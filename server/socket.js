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

  const sendMessage = async (socket, data) => {
    const { chatId, senderId, content } = data;

    try {
      // Validate required fields
      if (!chatId || !senderId || !content?.trim()) {
        socket.emit("messageError", { error: "Missing required fields" });
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
        chatId: chatId, // Make sure to include chatId
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
        "_id firstName lastName image email bio phone location website color profileSetup"
      );

      const payload = {
        ...messageData.toObject(),
        chatId,
        timestamp: messageData.createdAt,
      };

      console.log("Broadcasting message to participants:", payload);

      // Send to all participants
      chat.participants.forEach((participant) => {
        const participantSocketId = userSockets.get(participant._id.toString());
        if (participantSocketId) {
          io.to(participantSocketId).emit("newMessage", payload);
          console.log(
            `Sent message to participant ${participant._id}: ${participantSocketId}`
          );
        } else {
          console.log(`Participant ${participant._id} is offline`);
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("messageError", {
        error: "Failed to send message",
        details: error.message,
      });
    }
  };

  // Add authentication middleware
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

  // In your socket.io setup
  io.on("connection", (socket) => {
    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, senderId, content } = data;

        // Save message to database (reuse your existing sendMessage logic)
        const newMessage = new Message({
          sender: senderId,
          messageType: "text",
          content: content.trim(),
          chatId,
        });

        const savedMessage = await newMessage.save();

        // Update chat
        await Chat.findByIdAndUpdate(chatId, {
          $push: { messages: savedMessage._id },
          lastMessage: content.trim(),
          lastMessageTime: new Date(),
        });

        // Populate and emit to all participants
        const populatedMessage = await Message.findById(
          savedMessage._id
        ).populate("sender", "_id firstName lastName email image");

        // Emit to all participants in the chat room
        io.to(chatId).emit("newMessage", populatedMessage);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });
  });

  return io;
};

export default setupSocket;
