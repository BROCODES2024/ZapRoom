import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, UserX, Ban, MessageSquare } from "lucide-react";
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
  return (
    <div className="space-y-1">
      {users.map((user) => (
        <div
          key={user.username}
          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user.username}</span>
                {user.username === currentUser && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
                {user.isHost && (
                  <Badge variant="default" className="text-xs">
                    Host
                  </Badge>
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    <DropdownMenuItem
                      onClick={() => onKick?.(user.username)}
                      className="text-orange-600"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Kick User
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onBan?.(user.username)}
                      className="text-red-600"
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
