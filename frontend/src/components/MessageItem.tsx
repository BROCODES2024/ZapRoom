import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatMessage, PrivateMessage, SystemMessage } from "@/types";

interface MessageItemProps {
  message: ChatMessage | PrivateMessage | SystemMessage;
  currentUser: string;
  isHost?: boolean;
}

export function MessageItem({
  message,
  currentUser,
  isHost,
}: MessageItemProps) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="text-sm text-muted-foreground italic">
          {message.message}
        </span>
      </div>
    );
  }

  const isPrivate = message.type === "private_message";
  const author = isPrivate ? message.from : message.author;
  const isOwnMessage = author === currentUser;
  const recipient = isPrivate ? message.to : null;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={cn(
        "flex gap-3 py-3 px-4 hover:bg-gray-50 transition-colors",
        isOwnMessage && "flex-row-reverse"
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
          {author.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex-1 space-y-1", isOwnMessage && "items-end")}>
        <div
          className={cn(
            "flex items-center gap-2",
            isOwnMessage && "justify-end"
          )}
        >
          <span className="text-sm font-semibold">{author}</span>
          {author === currentUser && isHost && (
            <Badge variant="secondary" className="text-xs">
              Host
            </Badge>
          )}
          {isPrivate && (
            <Badge variant="outline" className="text-xs">
              DM {isOwnMessage ? `to ${recipient}` : "to you"}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div
          className={cn(
            "inline-block px-3 py-2 rounded-lg max-w-[80%]",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : isPrivate
              ? "bg-purple-100 text-purple-900"
              : "bg-gray-100 text-gray-900"
          )}
        >
          <p className="text-sm break-words">{message.message}</p>
        </div>
      </div>
    </div>
  );
}
