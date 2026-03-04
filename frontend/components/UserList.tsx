"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, UserX, Ban, MessageSquare, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface UserListProps {
  users: User[];
  currentUser: string;
  isHost: boolean;
  onKick?: (username: string) => void;
  onBan?: (username: string) => void;
  onStartDM?: (username: string) => void;
}

export function UserList({
  users,
  currentUser,
  isHost,
  onKick,
  onBan,
  onStartDM,
}: UserListProps) {
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
    <div className="space-y-1">
      {users.map((user) => (
        <div
          key={user.username}
          className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className={cn("text-xs text-white", getAvatarColor(user.username))}
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium truncate">
                  {user.username}
                </span>
                {user.username === currentUser && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    You
                  </Badge>
                )}
                {user.isHost && (
                  <Crown className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              {user.isTyping && (
                <span className="text-xs text-muted-foreground italic">
                  typing...
                </span>
              )}
            </div>
          </div>

          {user.username !== currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  aria-label={`Options for ${user.username}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStartDM?.(user.username)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send DM
                </DropdownMenuItem>
                {isHost && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onKick?.(user.username)}
                      className="text-orange-600 dark:text-orange-400"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Kick User
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onBan?.(user.username)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Ban User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
}
