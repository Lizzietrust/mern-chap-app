import { Server } from "socket.io";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  const userSockets = new Map();

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSockets.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    } else {
      console.log("User connected without userId");
    }

    socket.on("disconnect", () => {
      const disconnectedUserId = [...userSockets.entries()].find(
        ([_, socketId]) => socketId === socket.id
      )?.[0];
      if (disconnectedUserId) {
        userSockets.delete(disconnectedUserId);
        console.log(`User disconnected: ${disconnectedUserId}`);
      } else {
        console.log("A user disconnected");
      }
    });
  });
};

export default setupSocket;
