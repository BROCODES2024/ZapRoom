import { useEffect, useRef, useState, useCallback } from "react";
import type { Message } from "../types";

interface UseWebSocketProps {
  url: string;
  roomId: string;
  username: string;
  onMessage?: (message: Message) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useWebSocket({
  url,
  roomId,
  username,
  onMessage,
  onConnectionChange,
}: UseWebSocketProps) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionError(null);
        onConnectionChange?.(true);

        // Send join message
        if (roomId && username) {
          ws.current?.send(
            JSON.stringify({
              type: "join",
              payload: { roomId, username },
            })
          );
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionError("Connection error occurred");
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        onConnectionChange?.(false);

        if (event.code === 1008) {
          setConnectionError(event.reason || "Connection closed by server");
        } else if (event.code !== 1000) {
          // Attempt reconnection for unexpected closures
          reconnectTimeout.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setConnectionError("Failed to connect to server");
    }
  }, [url, roomId, username, onMessage, onConnectionChange]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    if (ws.current) {
      ws.current.close(1000, "User disconnected");
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "chat",
          payload: { message },
        })
      );
    }
  }, []);

  const sendPrivateMessage = useCallback(
    (toUsername: string, message: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "dm",
            payload: { toUsername, message },
          })
        );
      }
    },
    []
  );

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: isTyping ? "typing" : "stop_typing",
          payload: {},
        })
      );

      if (isTyping) {
        if (typingTimeout.current) {
          clearTimeout(typingTimeout.current);
        }
        typingTimeout.current = setTimeout(() => {
          sendTypingIndicator(false);
        }, 3000);
      }
    }
  }, []);

  const sendAdminCommand = useCallback(
    (command: "lock" | "kick" | "ban", targetUser?: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "admin",
            payload: { command, targetUser },
          })
        );
      }
    },
    []
  );

  useEffect(() => {
    if (roomId && username) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [roomId, username]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    sendPrivateMessage,
    sendTypingIndicator,
    sendAdminCommand,
    disconnect,
    reconnect: connect,
  };
}
