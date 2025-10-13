import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/UserModel.js";

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

      // Get the token from cookies instead of socket auth
      const cookies = socket.handshake.headers.cookie;
      console.log("🍪 All cookies received:", cookies);

      if (!cookies) {
        console.error("❌ No cookies provided");
        return next(new Error("Authentication error: No cookies provided"));
      }

      // Look specifically for the 'jwt' cookie (based on your auth controller)
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

      // Verify the token - NOTE: Use JWT_KEY (not JWT_SECRET)
      const decoded = jwt.verify(
        token,
        process.env.JWT_KEY || process.env.JWT_SECRET
      );
      console.log("✅ Token decoded for user:", decoded.userId);

      // Find the user
      const user = await User.findById(decoded.userId).select(
        "_id firstName lastName email image isOnline lastSeen"
      );

      if (!user) {
        console.error("❌ User not found:", decoded.userId);
        return next(new Error("Authentication error: User not found"));
      }

      // Update user as online when they connect - use findByIdAndUpdate to avoid pre-save hook
      await User.findByIdAndUpdate(
        decoded.userId,
        {
          isOnline: true,
          lastSeen: new Date(),
        },
        { new: true }
      );

      // Store user in connected users map
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

    // Join user to their personal room
    socket.join(socket.userId);

    // Get all currently online users
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

    // Send current online users to the newly connected user
    getOnlineUsers().then((onlineUsers) => {
      socket.emit("onlineUsers", onlineUsers);
      console.log(
        `📤 Sent ${onlineUsers.length} online users to ${socket.userId}`
      );
    });

    // Broadcast to ALL other users that this user came online
    socket.broadcast.emit("userOnline", {
      userId: socket.userId,
      user: socket.user,
    });
    console.log(
      `📢 Broadcasted userOnline for ${socket.userId} to all other users`
    );

    // Handle manual status updates (for logout)
    socket.on("updateUserStatus", async (data) => {
      try {
        const { isOnline } = data;
        console.log(
          `🔄 Manual status update for ${socket.userId}: ${
            isOnline ? "online" : "offline"
          }`
        );

        // Update user status in database
        await User.findByIdAndUpdate(
          socket.userId,
          {
            isOnline,
            lastSeen: new Date(),
          },
          { new: true }
        );

        // Update the user object in the connected users map
        if (connectedUsers.has(socket.userId)) {
          const userData = connectedUsers.get(socket.userId);
          userData.user.isOnline = isOnline;
          userData.user.lastSeen = new Date();
        }

        // Update socket user object
        socket.user.isOnline = isOnline;
        socket.user.lastSeen = new Date();

        // Broadcast the status change to all other users
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

    // Handle typing events
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
        // Remove from connected users map
        connectedUsers.delete(socket.userId);

        // Update user as offline in database - use findByIdAndUpdate to avoid pre-save hook
        await User.findByIdAndUpdate(
          socket.userId,
          {
            isOnline: false,
            lastSeen: new Date(),
          },
          { new: true }
        );

        // Broadcast to ALL other users that this user went offline
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

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  // Periodic cleanup of disconnected users (optional)
  setInterval(async () => {
    try {
      // Find users marked as online but not in connectedUsers map
      const onlineUsers = await User.find({ isOnline: true });

      for (const user of onlineUsers) {
        if (!connectedUsers.has(user._id.toString())) {
          // User is marked online but not connected - mark as offline
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
  }, 60000); // Run every minute

  return io;
};

export default setupSocket;
