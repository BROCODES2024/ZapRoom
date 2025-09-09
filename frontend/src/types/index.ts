export interface ChatMessage {
  id: string;
  type: "chat";
  author: string;
  message: string;
  timestamp: string;
}

export interface PrivateMessage {
  id: string;
  type: "private_message";
  from: string;
  to: string;
  message: string;
  timestamp: string;
}

export interface SystemMessage {
  type: "system";
  message: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export interface TypingIndicator {
  type: "user_typing" | "user_stop_typing";
  payload: {
    username: string;
  };
}

export interface HistoryMessage {
  type: "history";
  payload: (ChatMessage | PrivateMessage)[];
}

export interface RoomStateMessage {
  type: "room_state";
  payload: {
    users: User[];
    isLocked: boolean;
    host: string;
  };
}

export interface UserJoinedMessage {
  type: "user_joined";
  payload: {
    username: string;
    isHost: boolean;
  };
}

export interface UserLeftMessage {
  type: "user_left";
  payload: {
    username: string;
    reason: "left" | "kicked" | "banned";
  };
}

export interface RoomLockUpdateMessage {
  type: "room_lock_update";
  payload: {
    isLocked: boolean;
  };
}

export interface HostUpdateMessage {
  type: "host_update";
  payload: {
    newHost: string;
  };
}

export type Message =
  | ChatMessage
  | PrivateMessage
  | SystemMessage
  | ErrorMessage
  | TypingIndicator
  | HistoryMessage
  | RoomStateMessage
  | UserJoinedMessage
  | UserLeftMessage
  | RoomLockUpdateMessage
  | HostUpdateMessage;

export interface User {
  username: string;
  isHost?: boolean;
  isTyping?: boolean;
}
