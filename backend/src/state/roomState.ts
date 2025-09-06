import type { ChatMessage, PrivateMessage } from "../types/index.js";
import { randomUUID } from "crypto";

const MAX_HISTORY_PER_ROOM = 50;

// Store message history for each room. Key: roomId, Value: Array of messages.
const roomHistories = new Map<string, ChatMessage[]>();

/**
 * Adds a new chat message to a room's history, ensuring it doesn't exceed the max size.
 * @returns The full message object with ID and timestamp.
 */
export function addMessageToHistory(
  roomId: string,
  messageData: { author: string; message: string }
): ChatMessage {
  //:ChatMessage means return type is ChatMessage
  if (!roomHistories.has(roomId)) {
    roomHistories.set(roomId, []);
  }

  const history = roomHistories.get(roomId)!;

  const newMessage: ChatMessage = {
    id: randomUUID(),
    type: "chat",
    author: messageData.author,
    message: messageData.message,
    timestamp: new Date().toISOString(),
  };

  history.push(newMessage);

  // Trim the history if it's too long
  if (history.length > MAX_HISTORY_PER_ROOM) {
    history.shift(); // Remove the oldest message
  }

  return newMessage;
}

/**
 * Retrieves the message history for a given room.
 */
export function getHistoryForRoom(roomId: string): ChatMessage[] {
  return roomHistories.get(roomId) || [];
}
