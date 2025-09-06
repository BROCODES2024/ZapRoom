import type { ChatMessage, PrivateMessage } from "../types/index.js";
import { randomUUID } from "crypto";

const MAX_HISTORY_PER_ROOM = 50;

type RoomStatus = "open" | "locked";

class Room {
  host: string | null = null;
  status: RoomStatus = "open";
  bannedUsers: Set<string> = new Set(); // Using a Set for efficient lookups
  history: (ChatMessage | PrivateMessage)[] = [];
}

const rooms = new Map<string, Room>();

/**
 * Gets a room by its ID, creating it if it doesn't exist.
 */
function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Room());
  }
  return rooms.get(roomId)!;
}

/**
 * Sets the host for a room if it doesn't already have one.
 */
export function setRoomHost(roomId: string, username: string) {
  const room = getOrCreateRoom(roomId);
  if (!room.host) {
    room.host = username;
    console.log(
      `[STATE] User '${username}' is now the host of room '${roomId}'.`
    );
  }
}

export function getRoomHost(roomId: string): string | null {
  return rooms.get(roomId)?.host ?? null;
}

export function isRoomLocked(roomId: string): boolean {
  return rooms.get(roomId)?.status === "locked";
}

export function toggleRoomLock(roomId: string): RoomStatus {
  const room = getOrCreateRoom(roomId);
  room.status = room.status === "open" ? "locked" : "open";
  return room.status;
}

export function banUser(roomId: string, username: string) {
  const room = getOrCreateRoom(roomId);
  room.bannedUsers.add(username.toLowerCase());
}

export function isUserBanned(roomId: string, username: string): boolean {
  return rooms.get(roomId)?.bannedUsers.has(username.toLowerCase()) ?? false;
}

export function addMessageToHistory(
  roomId: string,
  messageData: { author: string; message: string }
): ChatMessage {
  const room = getOrCreateRoom(roomId);

  const newMessage: ChatMessage = {
    id: randomUUID(),
    type: "chat",
    author: messageData.author,
    message: messageData.message,
    timestamp: new Date().toISOString(),
  };

  room.history.push(newMessage);

  if (room.history.length > MAX_HISTORY_PER_ROOM) {
    room.history.shift();
  }

  return newMessage;
}

export function getHistoryForRoom(
  roomId: string
): (ChatMessage | PrivateMessage)[] {
  return rooms.get(roomId)?.history || [];
}
