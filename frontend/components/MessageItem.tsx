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
      <div className="flex justify-center py-2 px-4">
        <span className="text-sm text-muted-foreground italic bg-muted/50 px-3 py-1 rounded-full">
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

  // Generate a consistent color for avatar based on username
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className={cn(
        "flex gap-3 py-3 px-4 hover:bg-muted/30 transition-colors",
        isOwnMessage && "flex-row-reverse"
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback
          className={cn("text-xs text-white", getAvatarColor(author))}
        >
          {author.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex-1 space-y-1 min-w-0", isOwnMessage && "items-end")}>
        <div
          className={cn(
            "flex items-center gap-2",
            isOwnMessage && "justify-end"
          )}
        >
          <span className="text-sm font-semibold truncate">{author}</span>
          {author === currentUser && isHost && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Host
            </Badge>
          )}
          {isPrivate && (
            <Badge
              variant="outline"
              className="text-xs shrink-0 border-purple-400 text-purple-600 dark:text-purple-400"
            >
              DM {isOwnMessage ? `to ${recipient}` : "to you"}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div
          className={cn(
            "inline-block px-3 py-2 rounded-2xl max-w-[80%] break-words",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : isPrivate
              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200"
              : "bg-muted text-foreground"
          )}
        >
          <p className="text-sm">{message.message}</p>
        </div>
      </div>
    </div>
  );
}
