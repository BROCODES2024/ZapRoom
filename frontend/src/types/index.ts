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

export type Message =
  | ChatMessage
  | PrivateMessage
  | SystemMessage
  | ErrorMessage
  | TypingIndicator
  | HistoryMessage;

export interface User {
  username: string;
  isHost?: boolean;
  isTyping?: boolean;
}
