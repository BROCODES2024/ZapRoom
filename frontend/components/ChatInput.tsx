"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, AtSign } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendPrivateMessage?: (username: string, message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onSendPrivateMessage,
  onTyping,
  disabled,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [targetUser, setTargetUser] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef(false);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    if (isPrivate && targetUser && onSendPrivateMessage) {
      onSendPrivateMessage(targetUser, trimmedMessage);
    } else if (!isPrivate) {
      onSendMessage(trimmedMessage);
    }

    setMessage("");
    setIsPrivate(false);
    setTargetUser("");

    // Stop typing indicator
    if (typingRef.current && onTyping) {
      typingRef.current = false;
      onTyping(false);
    }

    inputRef.current?.focus();
  };

  // Use onKeyDown instead of deprecated onKeyPress
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Check for DM syntax (@username message)
    if (value.startsWith("@")) {
      const match = value.match(/^@(\w+)\s*(.*)/);
      if (match) {
        setIsPrivate(true);
        setTargetUser(match[1] ?? "");
        setMessage(match[2] ?? "");
      }
    } else {
      setIsPrivate(false);
      setTargetUser("");
    }

    // Handle typing indicator
    if (onTyping) {
      if (value && !typingRef.current) {
        typingRef.current = true;
        onTyping(true);
      } else if (!value && typingRef.current) {
        typingRef.current = false;
        onTyping(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingRef.current && onTyping) {
        onTyping(false);
      }
    };
  }, [onTyping]);

  return (
    <div className="flex gap-2 p-4 border-t bg-background">
      {isPrivate && (
        <div className="flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm whitespace-nowrap">
          <AtSign className="h-3 w-3 mr-1" />
          {targetUser}
        </div>
      )}
      <Input
        ref={inputRef}
        value={
          isPrivate
            ? message
            : targetUser
            ? `@${targetUser} ${message}`
            : message
        }
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={isPrivate ? `Message @${targetUser}...` : placeholder}
        disabled={disabled}
        className="flex-1"
        maxLength={200}
        aria-label="Chat message input"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="icon"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
