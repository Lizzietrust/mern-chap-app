import { Server } from "socket.io";
import Message from "./models/MessageModel.js";
import Chat from "./models/ChatModel.js";
import User from "./models/UserModel.js"; // Add this import

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  const userSockets = new Map();
  
  // Helper function to broadcast online users
  const broadcastOnlineUsers = async () => {
    try {
      const onlineUsers = await User.find(
        { _id: { $in: Array.from(userSockets.keys()) } },
        "_id firstName lastName email image isOnline lastSeen"
      );
      io.emit("getOnlineUsers", onlineUsers);
    } catch (error) {
      console.error("Error broadcasting online users:", error);
    }
  };
  
  const sendMessage = async(data) => {
    const { chatId, senderId, content } = data;

    try {
      const newMessage = new Message({
        sender: senderId,
        messageType: "text",
        content: content,
      });

      const savedMessage = await newMessage.save();

      const chat = await Chat.findByIdAndUpdate(
        chatId,
        { $push: { messages: savedMessage._id } },
        { new: true }
      ).populate("participants");

      if (chat) {
        const messageData = await Message.findById(savedMessage._id).populate(
          "sender", "_id firstName lastName image email bio phone location website color profileSetup"
        );

        const payload = { 
          ...messageData.toObject(), 
          chatId,
          timestamp: messageData.createdAt
        };

        // Send to all participants
        chat.participants.forEach(participant => {
          const participantSocketId = userSockets.get(participant._id.toString());
          if (participantSocketId) {
            io.to(participantSocketId).emit("newMessage", payload);
          }
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const senderSocketId = userSockets.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageError", { error: "Failed to send message" });
      }
    }
  };

  // Add authentication middleware
  io.use(async (socket, next) => {
    const userId = socket.handshake.query.userId;
    if (!userId) {
      return next(new Error("Authentication error"));
    }
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        return next(new Error("Invalid user"));
      }
      socket.userId = userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    
    // Handle multiple connections from same user
    const existingSocketId = userSockets.get(userId);
    if (existingSocketId) {
      io.to(existingSocketId).emit("forceDisconnect", "New connection from same user");
      io.sockets.sockets.get(existingSocketId)?.disconnect();
    }
    
    userSockets.set(userId, socket.id);
    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    
    // Broadcast updated online users
    await broadcastOnlineUsers();

    socket.on("sendMessage", sendMessage);

    socket.on("disconnect", async () => {
      // More reliable disconnect handling
      for (let [uid, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(uid);
          console.log(`User disconnected: ${uid}`);
          await broadcastOnlineUsers();
          break;
        }
      }
    });
  });
};

export default setupSocket;