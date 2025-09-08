import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, AlertCircle } from "lucide-react";

interface JoinRoomProps {
  onJoin: (roomId: string, username: string) => void;
  error?: string | null;
}

export function JoinRoom({ onJoin, error }: JoinRoomProps) {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const trimmedRoom = roomId.trim();
    const trimmedUsername = username.trim();

    if (!trimmedRoom) {
      setValidationError("Room ID is required");
      return;
    }
    if (trimmedRoom.length > 20) {
      setValidationError("Room ID must be 20 characters or less");
      return;
    }
    if (!trimmedUsername) {
      setValidationError("Username is required");
      return;
    }
    if (trimmedUsername.length > 20) {
      setValidationError("Username must be 20 characters or less");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setValidationError("Username can only contain letters, numbers, - and _");
      return;
    }

    onJoin(trimmedRoom, trimmedUsername);
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary rounded-full">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">ZapRoom</CardTitle>
          <CardDescription className="text-base">
            Real-time chat rooms with instant messaging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="room" className="text-sm font-medium">
                Room ID
              </label>
              <Input
                id="room"
                type="text"
                placeholder="Enter room name"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                maxLength={20}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Choose your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="w-full"
              />
            </div>

            {displayError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" size="lg">
              Join Room
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground">
              No signup required • Just pick a room and start chatting
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
