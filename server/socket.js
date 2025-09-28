import { Server } from "socket.io";
import Message from "./models/MessageModel.js";
import Chat from "./models/ChatModel.js";
import User from "./models/UserModel.js";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  const userSockets = new Map();
  const userRooms = new Map(); // Track which rooms users are in

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

  // Authentication middleware
  io.use(async (socket, next) => {
    const userId = socket.handshake.query.userId;
    if (!userId) {
      return next(new Error("Authentication error - no userId"));
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return next(new Error("Invalid user"));
      }
      socket.userId = userId;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    // Store user's socket ID
    userSockets.set(userId, socket.id);
    broadcastOnlineUsers();

    // Handle joining chat rooms
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      userRooms.set(userId, chatId);
      console.log(`User ${userId} joined chat ${chatId}`);
    });

    // Handle leaving chat rooms
    socket.on("leaveChat", (chatId) => {
      socket.leave(chatId);
      userRooms.delete(userId);
      console.log(`User ${userId} left chat ${chatId}`);
    });

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
      const { chatId, senderId, content } = data;

      try {
        // Validate required fields
        if (!chatId || !senderId || !content?.trim()) {
          socket.emit("messageError", { error: "Missing required fields" });
          return;
        }

        // Verify sender is the connected user
        if (senderId !== userId) {
          socket.emit("messageError", { error: "Unauthorized" });
          return;
        }

        // Check if chat exists
        const chat = await Chat.findById(chatId).populate("participants");
        if (!chat) {
          socket.emit("messageError", { error: "Chat not found" });
          return;
        }

        // Check if sender is a participant
        const isParticipant = chat.participants.some(
          (p) => p._id.toString() === senderId
        );
        if (!isParticipant) {
          socket.emit("messageError", { error: "Unauthorized" });
          return;
        }

        // Create and save message
        const newMessage = new Message({
          sender: senderId,
          messageType: "text",
          content: content.trim(),
          chatId: chatId,
        });

        const savedMessage = await newMessage.save();

        // Update chat with new message
        await Chat.findByIdAndUpdate(
          chatId,
          {
            $push: { messages: savedMessage._id },
            lastMessage: content.trim(),
            lastMessageTime: new Date(),
          },
          { new: true }
        );

        // Get the populated message
        const messageData = await Message.findById(savedMessage._id).populate(
          "sender",
          "_id firstName lastName image email"
        );

        // Create consistent message payload
        const payload = {
          _id: savedMessage._id,
          sender: messageData.sender,
          messageType: "text",
          content: content.trim(),
          chatId: chatId,
          timestamp: savedMessage.createdAt,
          createdAt: savedMessage.createdAt,
        };

        console.log("Broadcasting message to chat room:", chatId);
        
        // Emit to all participants in the chat room
        io.to(chatId).emit("newMessage", payload);

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("messageError", {
          error: "Failed to send message",
          details: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
      userSockets.delete(userId);
      userRooms.delete(userId);
      broadcastOnlineUsers();
    });
  });

  return io;
};

export default setupSocket;
