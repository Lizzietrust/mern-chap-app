import { Server } from "socket.io";
import Message from "./models/MessageModel.js";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  const userSockets = new Map();
  
  const sendMessage = async(message) => {
    const senderSocketId = userSockets.get(message.sender);
    const recipientSocketId = userSockets.get(message.recipient);
    const createdMessage = await Message.create(message);
    const messageData = await Message.findById(createMessage._id).populate(
      "sender", "_id firstName lastName image email bio phone location website color profileSetup"
    ).populate(
      "recipient", "_id firstName lastName image email bio phone location website color profileSetup"
    );

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSent", messageData);
    }
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("messageReceived", messageData);
    }
  }


  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSockets.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    } else {
      console.log("User connected without userId");
    }

    socket.on("sendMessage", sendMessage) 

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
