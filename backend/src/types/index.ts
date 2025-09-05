import { WebSocket } from "ws";

/**
 * Extends the base WebSocket to include our application-specific properties.
 */
export interface CustomWebSocket extends WebSocket {
  roomId?: string;
  username?: string;
  isAlive: boolean;
}

/**
 * Defines the structure for a standard chat message.
 */
export interface ChatMessage {
  id: string;
  type: "chat";
  author: string;
  message: string;
  timestamp: string;
}

/**
 * Defines the structure for a private message (DM).
 */
export interface PrivateMessage {
  id: string;
  type: "private_message";
  from: string;
  to: string;
  message: string;
  timestamp: string;
}
