import { useEffect } from "react";
import { useSocket } from "../../contexts/useSocket";

export const TestConnectionStatus = () => {
  const { isConnected, onlineUsers, socket } = useSocket();

  useEffect(() => {
    console.log("🔌 Connection Status:", {
      isConnected,
      onlineUsersCount: onlineUsers.length,
      onlineUsers: onlineUsers.map((u) => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        isOnline: u.isOnline,
      })),
      socketId: socket?.id,
    });
  }, [isConnected, onlineUsers, socket]);

  if (!isConnected) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "red",
          color: "white",
          padding: "10px",
          textAlign: "center",
          zIndex: 10000,
        }}
      >
        🔴 Disconnected from server - Online status may not work
      </div>
    );
  }

  return null;
};
