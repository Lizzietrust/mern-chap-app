import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/UserModel.js";
import Message from "./models/MessageModel.js";
import Chat from "./models/ChatModel.js";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const connectedUsers = new Map();

  io.use(async (socket, next) => {
    try {
      console.log("🔐 Socket authentication attempt via cookies");

      const cookies = socket.handshake.headers.cookie;
      console.log("🍪 All cookies received:", cookies);

      if (!cookies) {
        console.error("❌ No cookies provided");
        return next(new Error("Authentication error: No cookies provided"));
      }

      const jwtCookie = cookies
        .split(";")
        .find((c) => c.trim().startsWith("jwt="));

      if (!jwtCookie) {
        console.error("❌ No 'jwt' cookie found");
        console.log(
          "🔍 Available cookies:",
          cookies.split(";").map((c) => c.trim())
        );
        return next(new Error("Authentication error: No jwt cookie found"));
      }

      const token = jwtCookie.split("=")[1];
      console.log("✅ Found and extracted token from 'jwt' cookie");

      if (!token) {
        console.error("❌ Empty token in jwt cookie");
        return next(new Error("Authentication error: Empty token"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_KEY || process.env.JWT_SECRET
      );
      console.log("✅ Token decoded for user:", decoded.userId);

      const user = await User.findById(decoded.userId).select(
        "_id firstName lastName email image isOnline lastSeen"
      );

      if (!user) {
        console.error("❌ User not found:", decoded.userId);
        return next(new Error("Authentication error: User not found"));
      }

      await User.findByIdAndUpdate(
        decoded.userId,
        {
          isOnline: true,
          lastSeen: new Date(),
        },
        { new: true }
      );

      connectedUsers.set(user._id.toString(), {
        socketId: socket.id,
        user: {
          ...user.toObject(),
          isOnline: true,
          lastSeen: new Date(),
        },
      });

      socket.userId = user._id.toString();
      socket.user = {
        ...user.toObject(),
        isOnline: true,
        lastSeen: new Date(),
      };

      console.log(
        `🟢 User ${user._id} authenticated successfully via cookies. Total connected: ${connectedUsers.size}`
      );
      next();
    } catch (error) {
      console.error("❌ Socket authentication failed:", error.message);

      if (error.name === "JsonWebTokenError") {
        console.error("JWT Error:", error.message);
        return next(new Error("Authentication error: Invalid token"));
      } else if (error.name === "TokenExpiredError") {
        console.error("Token expired");
        return next(new Error("Authentication error: Token expired"));
      } else {
        console.error("Other auth error:", error);
        return next(new Error("Authentication error: " + error.message));
      }
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User ${socket.userId} connected with socket ${socket.id}`);

    socket.join(socket.userId);

    const getOnlineUsers = async () => {
      try {
        const onlineUsers = await User.find({
          isOnline: true,
          _id: { $ne: socket.userId },
        }).select("_id firstName lastName email image isOnline lastSeen");
        console.log(`📋 Found ${onlineUsers.length} online users in database`);
        return onlineUsers;
      } catch (error) {
        console.error("Error fetching online users:", error);
        return [];
      }
    };

    getOnlineUsers().then((onlineUsers) => {
      socket.emit("onlineUsers", onlineUsers);
      console.log(
        `📤 Sent ${onlineUsers.length} online users to ${socket.userId}`
      );
    });

    socket.broadcast.emit("userOnline", {
      userId: socket.userId,
      user: socket.user,
    });
    console.log(
      `📢 Broadcasted userOnline for ${socket.userId} to all other users`
    );

    socket.on("userOnline", async (userId) => {
      try {
        console.log(
          `🟢 User ${userId} came online, marking messages as delivered`
        );

        const undeliveredMessages = await Message.find({
          status: "sent",
          chatId: {
            $in: await Chat.find({
              $or: [{ participants: userId }, { members: userId }],
            }).distinct("_id"),
          },
          sender: { $ne: userId },
        });

        console.log(
          `📨 Found ${undeliveredMessages.length} undelivered messages for user ${userId}`
        );

        for (const message of undeliveredMessages) {
          const updatedMessage = await Message.findByIdAndUpdate(
            message._id,
            {
              status: "delivered",
              $addToSet: { readBy: userId },
            },
            { new: true }
          ).populate("readBy", "_id firstName lastName email image");

          io.to(message.chatId.toString()).emit("messageStatusUpdate", {
            messageId: message._id,
            status: "delivered",
            readBy: updatedMessage.readBy,
            chatId: message.chatId,
          });

          console.log(
            `✅ Marked message ${message._id} as delivered to user ${userId}`
          );
        }
      } catch (error) {
        console.error("❌ Error marking messages as delivered:", error);
      }
    });

    socket.on("updateUserStatus", async (data) => {
      try {
        const { isOnline } = data;
        console.log(
          `🔄 Manual status update for ${socket.userId}: ${
            isOnline ? "online" : "offline"
          }`
        );

        await User.findByIdAndUpdate(
          socket.userId,
          {
            isOnline,
            lastSeen: new Date(),
          },
          { new: true }
        );

        if (connectedUsers.has(socket.userId)) {
          const userData = connectedUsers.get(socket.userId);
          userData.user.isOnline = isOnline;
          userData.user.lastSeen = new Date();
        }

        socket.user.isOnline = isOnline;
        socket.user.lastSeen = new Date();

        if (isOnline) {
          socket.broadcast.emit("userOnline", {
            userId: socket.userId,
            user: socket.user,
          });
          console.log(`📢 Broadcasted userOnline for ${socket.userId}`);
        } else {
          socket.broadcast.emit("userOffline", {
            userId: socket.userId,
            lastSeen: new Date(),
          });
          console.log(`📢 Broadcasted userOffline for ${socket.userId}`);
        }

        console.log(`✅ Manual status update completed for ${socket.userId}`);
      } catch (error) {
        console.error("Error updating user status:", error);
      }
    });

    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`👥 User ${socket.userId} joined chat ${chatId}`);
    });

    socket.on("leaveChat", (chatId) => {
      socket.leave(chatId);
      console.log(`👋 User ${socket.userId} left chat ${chatId}`);
    });

    socket.on("typing", (data) => {
      const { chatId, isTyping } = data;
      socket.to(chatId).emit("typing", {
        userId: socket.userId,
        user: socket.user,
        isTyping,
        chatId,
      });
      console.log(
        `⌨️ User ${socket.userId} ${
          isTyping ? "started" : "stopped"
        } typing in chat ${chatId}`
      );
    });

    socket.on("disconnect", async (reason) => {
      console.log(`❌ User ${socket.userId} disconnected. Reason: ${reason}`);

      try {
        connectedUsers.delete(socket.userId);

        await User.findByIdAndUpdate(
          socket.userId,
          {
            isOnline: false,
            lastSeen: new Date(),
          },
          { new: true }
        );

        socket.broadcast.emit("userOffline", {
          userId: socket.userId,
          lastSeen: new Date(),
        });

        console.log(
          `🔴 User ${socket.userId} marked as offline. Remaining connected: ${connectedUsers.size}`
        );
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });

    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  setInterval(async () => {
    try {
      const onlineUsers = await User.find({ isOnline: true });

      for (const user of onlineUsers) {
        if (!connectedUsers.has(user._id.toString())) {
          await User.findByIdAndUpdate(user._id, {
            isOnline: false,
            lastSeen: new Date(),
          });
          console.log(`🧹 Cleaned up offline user: ${user._id}`);
        }
      }
    } catch (error) {
      console.error("Error in periodic cleanup:", error);
    }
  }, 60000);

  return io;
};

export default setupSocket;
