"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageItem } from "@/components/MessageItem";
import { ChatInput } from "@/components/ChatInput";
import { UserList } from "@/components/UserList";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Message, ChatMessage, PrivateMessage, User } from "@/types";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  Zap,
  Users,
  Lock,
  Unlock,
  LogOut,
  Wifi,
  WifiOff,
  AlertCircle,
  Moon,
  Sun,
} from "lucide-react";

interface ChatRoomProps {
  roomId: string;
  username: string;
  onLeave: () => void;
}

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

export function ChatRoom({ roomId, username, onLeave }: ChatRoomProps) {
  const [messages, setMessages] = useState<(ChatMessage | PrivateMessage)[]>(
    []
  );
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [currentHost, setCurrentHost] = useState<string | null>(null);
  const [dmTarget, setDmTarget] = useState<string>("");
  const [showDMDialog, setShowDMDialog] = useState(false);
  const [dmMessage, setDmMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const currentUserIsHost = currentHost === username;

  const {
    isConnected,
    connectionError,
    sendMessage,
    sendPrivateMessage,
    sendTypingIndicator,
    sendAdminCommand,
    disconnect,
    reconnect,
  } = useWebSocket({
    url: WS_URL,
    roomId,
    username,
    onMessage: (message: Message) => {
      switch (message.type) {
        case "chat":
        case "private_message":
          setMessages((prev) => [...prev, message]);
          if ("author" in message) {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(message.author);
              return next;
            });
          } else if ("from" in message) {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(message.from);
              return next;
            });
          }
          break;

        case "system":
          toast(message.message, { duration: 3000 });
          break;

        case "room_state":
          setUsers(message.payload.users);
          setIsRoomLocked(message.payload.isLocked);
          setCurrentHost(message.payload.host);
          break;

        case "history":
          setMessages(message.payload);
          break;

        case "user_joined":
          setUsers((prev) => {
            if (prev.find((u) => u.username === message.payload.username)) {
              return prev;
            }
            return [
              ...prev,
              {
                username: message.payload.username,
                isHost: message.payload.isHost,
              },
            ];
          });
          toast(`${message.payload.username} has joined the room`, {
            duration: 2000,
          });
          break;

        case "user_left":
          setUsers((prev) =>
            prev.filter((u) => u.username !== message.payload.username)
          );
          toast(
            `${message.payload.username} has ${message.payload.reason}`,
            { duration: 2000 }
          );
          break;

        case "host_update":
          setCurrentHost(message.payload.newHost);
          setUsers((prev) =>
            prev.map((u) => ({
              ...u,
              isHost: u.username === message.payload.newHost,
            }))
          );
          toast(`${message.payload.newHost} is now the host`, {
            duration: 3000,
          });
          break;

        case "room_lock_update":
          setIsRoomLocked(message.payload.isLocked);
          toast(
            `Room is now ${message.payload.isLocked ? "locked 🔒" : "unlocked 🔓"}`,
            { duration: 2000 }
          );
          break;

        case "user_typing":
          setTypingUsers((prev) =>
            new Set(prev).add(message.payload.username)
          );
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(message.payload.username);
              return next;
            });
          }, 3500);
          break;

        case "user_stop_typing":
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(message.payload.username);
            return next;
          });
          break;

        case "error":
          toast.error(message.message);
          break;
      }
    },
  });

  const usersWithTyping = users.map((user) => ({
    ...user,
    isTyping: typingUsers.has(user.username) && user.username !== username,
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendDM = () => {
    if (dmMessage.trim() && dmTarget) {
      sendPrivateMessage(dmTarget, dmMessage.trim());
      setDmMessage("");
      setShowDMDialog(false);
      setDmTarget("");
    }
  };

  const handleStartDM = (targetUsername: string) => {
    setDmTarget(targetUsername);
    setShowDMDialog(true);
  };

  const handleLeave = () => {
    disconnect();
    onLeave();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-bold">ZapRoom</h1>
              </div>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Room:
                </span>
                <Badge variant="secondary" className="font-mono truncate max-w-[120px]">
                  {roomId}
                </Badge>
                {isRoomLocked && (
                  <Lock className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isConnected ? (
                <Badge variant="outline" className="gap-1 hidden sm:flex">
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Live</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1 hidden sm:flex">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              )}

              {currentUserIsHost && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendAdminCommand("lock")}
                  className="gap-1.5"
                >
                  {isRoomLocked ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Unlock</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Lock</span>
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              <Button variant="ghost" size="sm" onClick={handleLeave} className="gap-1.5">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Leave</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Connection Error Alert */}
        {connectionError && (
          <Alert variant="destructive" className="m-3 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              {connectionError}
              {!isConnected && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={reconnect}
                  className="p-0 h-auto text-destructive-foreground underline"
                >
                  Reconnect
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="min-h-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center space-y-3">
                  <Zap className="h-12 w-12 mx-auto opacity-20" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm opacity-70">Be the first to say hello! 👋</p>
                </div>
              </div>
            ) : (
              <div>
                {messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    currentUser={username}
                    isHost={currentUserIsHost}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Typing Indicators */}
        {typingUsers.size > 0 && (
          <div className="px-4 py-1.5 text-sm text-muted-foreground italic bg-muted/30 border-t">
            {Array.from(typingUsers)
              .filter((u) => u !== username)
              .join(", ")}{" "}
            {typingUsers.size === 1 ? "is" : "are"} typing
            <span className="animate-pulse">...</span>
          </div>
        )}

        {/* Input Area */}
        <ChatInput
          onSendMessage={sendMessage}
          onSendPrivateMessage={sendPrivateMessage}
          onTyping={sendTypingIndicator}
          disabled={!isConnected}
          placeholder="Type a message... (@ to DM)"
        />
      </div>

      {/* Sidebar */}
      <div className="w-72 bg-card border-l flex flex-col hidden md:flex">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Online Users</h2>
            <Badge variant="secondary" className="ml-auto text-xs">
              {usersWithTyping.length}
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <UserList
            users={usersWithTyping}
            currentUser={username}
            isHost={currentUserIsHost}
            onKick={(user) => sendAdminCommand("kick", user)}
            onBan={(user) => sendAdminCommand("ban", user)}
            onStartDM={handleStartDM}
          />
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p className="font-medium">Tips</p>
            <ul className="space-y-1 ml-2">
              <li>• Type <code className="bg-muted px-1 rounded">@user</code> to DM</li>
              <li>• First user becomes host</li>
              {currentUserIsHost && <li>• You can kick/ban users</li>}
              {currentHost && !currentUserIsHost && (
                <li>• Host: <span className="font-medium">{currentHost}</span></li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* DM Dialog */}
      <Dialog open={showDMDialog} onOpenChange={setShowDMDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Direct Message</DialogTitle>
            <DialogDescription>
              Send a private message to @{dmTarget}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Type your message..."
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendDM();
              }}
              maxLength={200}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDMDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendDM} disabled={!dmMessage.trim()}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
