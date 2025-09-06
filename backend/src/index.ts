import { WebSocketServer, WebSocket } from "ws";
import type { CustomWebSocket } from "./types/index.js";
import {
  addMessageToHistory,
  getHistoryForRoom,
  setRoomHost,
  getRoomHost,
  isRoomLocked,
  isUserBanned,
  toggleRoomLock,
  banUser,
} from "./state/roomState.js";
import { randomUUID } from "crypto";

const wss = new WebSocketServer({ port: 8080 });

// --- Helper Functions ---

/**
 * Finds a user's WebSocket connection within a specific room by their username.
 * @param roomId The ID of the room to search in.
 * @param username The username to search for.
 * @returns The CustomWebSocket object if found, otherwise null.
 */
function findUserInRoom(
  roomId: string,
  username: string
): CustomWebSocket | null {
  for (const client of wss.clients) {
    const customClient = client as CustomWebSocket;
    if (
      customClient.roomId === roomId &&
      customClient.username?.toLowerCase() === username.toLowerCase()
    ) {
      return customClient;
    }
  }
  return null;
}

/**
 * Checks if a username is already taken in a given room.
 * @param roomId The ID of the room.
 * @param username The username to check.
 * @returns True if the username is taken, otherwise false.
 */
function isUsernameTaken(roomId: string, username: string): boolean {
  return !!findUserInRoom(roomId, username);
}

/**
 * Broadcasts a message to all clients in a specific room.
 * @param roomId The room to broadcast to.
 * @param message The message object to send.
 * @param excludeClient An optional client to exclude from the broadcast (usually the sender).
 */
function broadcastToRoom(
  roomId: string,
  message: object,
  excludeClient?: CustomWebSocket
) {
  const messageString = JSON.stringify(message);
  wss.clients.forEach((client) => {
    const customClient = client as CustomWebSocket;
    if (
      customClient.readyState === WebSocket.OPEN &&
      customClient.roomId === roomId &&
      customClient !== excludeClient
    ) {
      customClient.send(messageString);
    }
  });
}

// --- Main Connection Logic ---

wss.on("connection", (ws: WebSocket) => {
  const customWs = ws as CustomWebSocket;
  customWs.isAlive = true;
  console.log("A new client connected!");

  customWs.on("pong", () => {
    customWs.isAlive = true;
  });

  customWs.on("message", (message: Buffer) => {
    const messageString = message.toString();
    try {
      const messageData = JSON.parse(messageString);
      const { type, payload } = messageData;
      const { roomId: userRoomId, username: userUsername } = customWs;

      if (type === "join") {
        const { roomId, username } = payload;

        // Validation & Enforcement
        if (
          typeof roomId !== "string" ||
          roomId.trim().length === 0 ||
          roomId.length > 20 ||
          typeof username !== "string" ||
          username.trim().length === 0 ||
          username.length > 20
        ) {
          return customWs.close(
            1008,
            "Invalid roomId or username format/length."
          );
        }
        if (isRoomLocked(roomId)) {
          return customWs.close(1008, "This room is locked.");
        }
        if (isUserBanned(roomId, username)) {
          return customWs.close(1008, "You are banned from this room.");
        }
        if (isUsernameTaken(roomId, username)) {
          return customWs.close(
            1008,
            "Username is already taken in this room."
          );
        }

        customWs.roomId = roomId.trim();
        customWs.username = username.trim();

        // Set host on first join
        setRoomHost(customWs.roomId, customWs.username);

        console.log(`User ${customWs.username} joined room ${customWs.roomId}`);

        customWs.send(
          JSON.stringify({
            type: "system",
            message: `Welcome to room "${customWs.roomId}"!`,
          })
        );

        const history = getHistoryForRoom(customWs.roomId);
        customWs.send(JSON.stringify({ type: "history", payload: history }));

        broadcastToRoom(
          customWs.roomId,
          {
            type: "system",
            message: `${customWs.username} has joined the room.`,
          },
          customWs
        );
      } else if (type === "chat") {
        if (!userRoomId || !userUsername) return;

        const chatMsg = payload.message;
        if (
          typeof chatMsg !== "string" ||
          chatMsg.trim().length === 0 ||
          chatMsg.length > 200
        ) {
          return console.warn("Received invalid chat message. Ignoring.");
        }

        const newChatMessage = addMessageToHistory(userRoomId, {
          author: userUsername,
          message: chatMsg.trim(),
        });
        broadcastToRoom(userRoomId, newChatMessage);
      } else if (type === "typing" || type === "stop_typing") {
        if (!userRoomId || !userUsername) return;

        broadcastToRoom(
          userRoomId,
          {
            type: type === "typing" ? "user_typing" : "user_stop_typing",
            payload: { username: userUsername },
          },
          customWs
        );
      } else if (type === "dm") {
        if (!userRoomId || !userUsername) return;
        const { toUsername, message } = payload;

        const recipient = findUserInRoom(userRoomId, toUsername);

        if (recipient) {
          const dm = {
            id: randomUUID(),
            type: "private_message",
            from: userUsername,
            to: toUsername,
            message,
            timestamp: new Date().toISOString(),
          };

          recipient.send(JSON.stringify(dm));
          customWs.send(JSON.stringify(dm));
        } else {
          customWs.send(
            JSON.stringify({
              type: "error",
              message: `User "${toUsername}" not found in this room.`,
            })
          );
        }
      } else if (type === "admin" && userRoomId && userUsername) {
        if (getRoomHost(userRoomId) !== userUsername) {
          return customWs.send(
            JSON.stringify({
              type: "error",
              message: "You are not the host of this room.",
            })
          );
        }

        const { command, targetUser } = payload;
        console.log(
          `[AUDIT] Host '${userUsername}' trying command '${command}' on user '${targetUser}' in room '${userRoomId}'`
        );

        const targetSocket = findUserInRoom(userRoomId, targetUser);

        switch (command) {
          case "lock":
            const newStatus = toggleRoomLock(userRoomId);
            broadcastToRoom(userRoomId, {
              type: "system",
              message: `The room is now ${newStatus}.`,
            });
            break;

          case "kick":
            if (targetSocket) {
              targetSocket.send(
                JSON.stringify({
                  type: "system",
                  message: "You have been kicked by the host.",
                })
              );
              targetSocket.close(4001, "Kicked by host");
              broadcastToRoom(userRoomId, {
                type: "system",
                message: `${targetUser} has been kicked.`,
              });
            }
            break;

          case "ban":
            if (targetUser) {
              banUser(userRoomId, targetUser);
              broadcastToRoom(userRoomId, {
                type: "system",
                message: `${targetUser} has been banned.`,
              });
              if (targetSocket) {
                targetSocket.send(
                  JSON.stringify({
                    type: "system",
                    message: "You have been banned by the host.",
                  })
                );
                targetSocket.close(4002, "Banned by host");
              }
            }
            break;
        }
      } else {
        console.warn(`Unknown message type received: ${type}`);
      }
    } catch (error) {
      console.error(
        "Failed to parse message or invalid format:",
        messageString,
        error
      );
    }
  });

  customWs.on("close", () => {
    console.log("Client disconnected");
    if (customWs.roomId && customWs.username) {
      broadcastToRoom(
        customWs.roomId,
        { type: "system", message: `${customWs.username} has left the room.` },
        customWs
      );
    }
  });

  customWs.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// --- Periodic Server Tasks ---

const statsInterval = setInterval(() => {
  const roomStats: { [roomId: string]: number } = {};
  wss.clients.forEach((client) => {
    const customClient = client as CustomWebSocket;
    if (customClient.roomId) {
      roomStats[customClient.roomId] =
        (roomStats[customClient.roomId] || 0) + 1;
    }
  });
  console.log(`\n--- Server Stats ---`);
  console.log(`Total connected users: ${wss.clients.size}`);
  console.log(`Users per room:`, roomStats);
  console.log(`--------------------\n`);
}, 30000);

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    const customClient = client as CustomWebSocket;
    if (customClient.isAlive === false) {
      console.log(
        `Terminating dead connection for user: ${
          customClient.username || "unknown"
        }`
      );
      return customClient.terminate();
    }
    customClient.isAlive = false;
    customClient.ping();
  });
}, 60000);

wss.on("close", () => {
  clearInterval(statsInterval);
  clearInterval(heartbeatInterval);
});

console.log("WebSocket server started on ws://localhost:8080");
