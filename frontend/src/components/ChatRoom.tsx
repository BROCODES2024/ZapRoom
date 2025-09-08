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
import { useToast } from "@/hooks/use-toast";
import { MessageItem } from "./MessageItem";
import { ChatInput } from "./ChatInput";
import { UserList } from "./UserList";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Message, ChatMessage, PrivateMessage, User } from "@/types";
import {
  Zap,
  Users,
  Lock,
  Unlock,
  LogOut,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";

interface ChatRoomProps {
  roomId: string;
  username: string;
  onLeave: () => void;
}

export function ChatRoom({ roomId, username, onLeave }: ChatRoomProps) {
  const [messages, setMessages] = useState<(ChatMessage | PrivateMessage)[]>(
    []
  );
  const [users, setUsers] = useState<User[]>([{ username, isHost: false }]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [dmTarget, setDmTarget] = useState<string>("");
  const [showDMDialog, setShowDMDialog] = useState(false);
  const [dmMessage, setDmMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentUserIsHost =
    users.find((u) => u.username === username)?.isHost || false;

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
    url: `ws://localhost:8080`,
    roomId,
    username,
    onMessage: (message: Message) => {
      switch (message.type) {
        case "chat":
        case "private_message":
          setMessages((prev) => [...prev, message]);
          // Remove typing indicator for this user
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
          toast({
            description: message.message,
            duration: 3000,
          });

          // Update room lock status
          if (message.message.includes("room is now")) {
            setIsRoomLocked(message.message.includes("locked"));
          }

          // Update user list based on join/leave messages
          if (message.message.includes("has joined")) {
            const joinUsername = message.message.split(" ")[0];
            if (joinUsername !== username) {
              setUsers((prev) => {
                if (!prev.find((u) => u.username === joinUsername)) {
                  return [...prev, { username: joinUsername, isHost: false }];
                }
                return prev;
              });
            }
          } else if (
            message.message.includes("has left") ||
            message.message.includes("has been kicked") ||
            message.message.includes("has been banned")
          ) {
            const leftUsername = message.message.split(" ")[0];
            setUsers((prev) => prev.filter((u) => u.username !== leftUsername));
          }

          // Check if current user is host
          if (message.message.includes(`Welcome to room`)) {
            // First user in room becomes host
            setUsers([{ username, isHost: true }]);
          }
          break;

        case "history":
          setMessages(message.payload);
          break;

        case "user_typing":
          setTypingUsers((prev) => new Set(prev).add(message.payload.username));
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(message.payload.username);
              return next;
            });
          }, 3000);
          break;

        case "user_stop_typing":
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(message.payload.username);
            return next;
          });
          break;

        case "error":
          toast({
            variant: "destructive",
            title: "Error",
            description: message.message,
          });
          break;
      }
    },
  });

  // Update users with typing status
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">ZapRoom</h1>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Room:</span>
                <Badge variant="secondary" className="font-mono">
                  {roomId}
                </Badge>
                {isRoomLocked && <Lock className="h-4 w-4 text-orange-500" />}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isConnected ? (
                <Badge variant="outline" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Disconnected
                </Badge>
              )}

              {currentUserIsHost && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendAdminCommand("lock")}
                >
                  {isRoomLocked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock Room
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock Room
                    </>
                  )}
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={handleLeave}>
                <LogOut className="h-4 w-4 mr-2" />
                Leave Room
              </Button>
            </div>
          </div>
        </header>

        {/* Connection Error Alert */}
        {connectionError && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {connectionError}
              {!isConnected && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={reconnect}
                  className="ml-2 p-0 h-auto"
                >
                  Try to reconnect
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 bg-white">
          <div className="min-h-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center space-y-2">
                  <p>No messages yet</p>
                  <p className="text-sm">Be the first to say hello! 👋</p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
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
          <div className="px-4 py-2 text-sm text-muted-foreground italic bg-gray-50">
            {Array.from(typingUsers).join(", ")}{" "}
            {typingUsers.size === 1 ? "is" : "are"} typing...
          </div>
        )}

        {/* Input Area */}
        <ChatInput
          onSendMessage={sendMessage}
          onSendPrivateMessage={sendPrivateMessage}
          onTyping={sendTypingIndicator}
          disabled={!isConnected}
          placeholder="Type a message or @username for DM..."
        />
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Online Users</h2>
            <Badge variant="secondary" className="ml-auto">
              {usersWithTyping.length}
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
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
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Tips:</p>
            <ul className="space-y-1 ml-4">
              <li>• Type @username to send a DM</li>
              <li>• First user becomes room host</li>
              {currentUserIsHost && <li>• You can kick/ban users</li>}
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
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendDM();
                }
              }}
              maxLength={200}
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
