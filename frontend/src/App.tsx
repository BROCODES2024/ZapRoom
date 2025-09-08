import { useState } from "react";
import { Toaster } from "sonner";
import { JoinRoom } from "./components/JoinRoom";
import { ChatRoom } from "./components/ChatRoom";

interface RoomState {
  roomId: string;
  username: string;
}

function App() {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleJoin = (roomId: string, username: string) => {
    setConnectionError(null);
    setRoomState({ roomId, username });
  };

  const handleLeave = () => {
    setRoomState(null);
    setConnectionError(null);
  };

  return (
    <>
      {roomState ? (
        <ChatRoom
          roomId={roomState.roomId}
          username={roomState.username}
          onLeave={handleLeave}
        />
      ) : (
        <JoinRoom onJoin={handleJoin} error={connectionError} />
      )}
      <Toaster />
    </>
  );
}

export default App;
