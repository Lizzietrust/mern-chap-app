import { useSocket } from "../../contexts/useSocket";
import { useEffect } from "react";

export const DebugOnlineStatus = () => {
  const { onlineUsers, isConnected, socket } = useSocket();

  console.log("🔍 DebugOnlineStatus - Current state:", {
    isConnected,
    onlineUsers,
    onlineUsersCount: onlineUsers.length,
    socketId: socket?.id,
    hasSocket: !!socket,
  });

  useEffect(() => {
    console.log("🔄 onlineUsers updated:", onlineUsers);
  }, [onlineUsers]);

  useEffect(() => {
    console.log("🔄 isConnected updated:", isConnected);
  }, [isConnected]);

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "white",
        padding: "10px",
        border: "1px solid #ccc",
        zIndex: 1000,
        fontSize: "12px",
        maxWidth: "300px",
      }}
    >
      <div><strong>Socket Debug</strong></div>
      <div>Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
      <div>Socket ID: {socket?.id || "None"}</div>
      <div>Online Users: {onlineUsers.length}</div>
      <div>
        <strong>Online Users List:</strong>
        {onlineUsers.length === 0 ? (
          <div>❌ No online users</div>
        ) : (
          onlineUsers.map((user) => (
            <div key={user._id}>
              🟢 {user.firstName} {user.lastName} ({user._id})
            </div>
          ))
        )}
      </div>
    </div>
  );
};