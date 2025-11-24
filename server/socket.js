import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/UserModel.js";
import Message from "./models/MessageModel.js";
import Chat from "./models/ChatModel.js";
import { setupMessageStatusHandlers } from "./controllers/MessageStatusController.js";

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

  const markAllUndeliveredAsDelivered = async (userId) => {
    try {
      const userChats = await Chat.find({
        $or: [{ participants: userId }, { members: userId }],
      });

      const chatIds = userChats.map((chat) => chat._id);

      const undeliveredMessages = await Message.find({
        status: "sent",
        chat: { $in: chatIds },
        sender: { $ne: userId },
        deliveredTo: { $ne: userId },
      });

      console.log(
        `📨 Found ${undeliveredMessages.length} undelivered messages for user ${userId}`
      );

      for (const message of undeliveredMessages) {
        try {
          const updatedMessage = await Message.findByIdAndUpdate(
            message._id,
            {
              status: "delivered",
              $addToSet: { deliveredTo: userId },
            },
            { new: true }
          ).populate("deliveredTo", "_id firstName lastName email image");

          io.to(message.chat.toString()).emit("messageStatusUpdate", {
            messageId: message._id,
            status: "delivered",
            deliveredTo: updatedMessage.deliveredTo,
            chatId: message.chat.toString(),
          });

          console.log(
            `✅ Marked message ${message._id} as delivered to user ${userId}`
          );
        } catch (messageError) {
          console.error(`Error updating message ${message._id}:`, messageError);
        }
      }
    } catch (error) {
      console.error("❌ Error marking messages as delivered:", error);
    }
  };

  const setupCallHandlers = (socket) => {
    socket.on("start_call", (data) => {
      const { receiverId, type, caller, offer } = data;
      console.log(`📞 Call from ${caller._id} to ${receiverId}`);

      socket.to(receiverId).emit("incoming_call", {
        caller: caller,
        type: type,
      });

      if (offer) {
        setTimeout(() => {
          socket.to(receiverId).emit("offer", {
            offer: offer,
            callerId: socket.userId,
          });
          console.log(`📨 Sent WebRTC offer to ${receiverId}`);
        }, 1000);
      }
    });

    socket.on("accept_call", (data) => {
      const { callerId } = data;
      console.log(
        `✅ Call accepted by ${socket.userId} for caller ${callerId}`
      );

      socket.to(callerId).emit("call_accepted");
      console.log(`📤 Notified caller ${callerId} that call was accepted`);
    });

    socket.on("reject_call", (data) => {
      const { callerId } = data;
      console.log(
        `❌ Call rejected by ${socket.userId} for caller ${callerId}`
      );

      socket.to(callerId).emit("call_rejected");
      console.log(`📤 Notified caller ${callerId} that call was rejected`);
    });

    socket.on("end_call", (data) => {
      const { receiverId } = data;
      console.log(`📞 Call ended by ${socket.userId}`);

      socket.to(receiverId).emit("call_ended");
      console.log(`📤 Notified receiver ${receiverId} that call ended`);
    });

    socket.on("offer", (data) => {
      const { offer, receiverId } = data;
      console.log(`📨 Forwarding offer from ${socket.userId} to ${receiverId}`);

      const receiverSocket = Array.from(connectedUsers.entries()).find(
        ([userId, userData]) => userId === receiverId
      );

      if (receiverSocket) {
        socket.to(receiverSocket[1].socketId).emit("offer", {
          offer: offer,
          callerId: socket.userId,
        });
        console.log(`✅ Offer forwarded to ${receiverId}`);
      } else {
        console.log(`❌ Receiver ${receiverId} is not online for offer`);
        socket.emit("receiver_offline", { receiverId });
      }
    });

    socket.on("answer", (data) => {
      const { answer, callerId } = data;
      console.log(`📨 Forwarding answer from ${socket.userId} to ${callerId}`);

      const callerSocket = Array.from(connectedUsers.entries()).find(
        ([userId, userData]) => userId === callerId
      );

      if (callerSocket) {
        socket.to(callerSocket[1].socketId).emit("answer", {
          answer: answer,
          receiverId: socket.userId,
        });
        console.log(`✅ Answer forwarded to ${callerId}`);
      } else {
        console.log(`❌ Caller ${callerId} is not online for answer`);
        socket.emit("caller_unavailable", { callerId });
      }
    });

    socket.on("ice-candidate", (data) => {
      const { candidate, receiverId } = data;
      console.log(
        `❄️ Forwarding ICE candidate from ${socket.userId} to ${receiverId}`
      );

      const receiverSocket = Array.from(connectedUsers.entries()).find(
        ([userId, userData]) => userId === receiverId
      );

      if (receiverSocket) {
        socket.to(receiverSocket[1].socketId).emit("ice-candidate", {
          candidate: candidate,
          senderId: socket.userId,
        });
        console.log(`✅ ICE candidate forwarded to ${receiverId}`);
      } else {
        console.log(
          `❌ Receiver ${receiverId} is not online for ICE candidate`
        );
      }
    });

    socket.on("call_timeout", (data) => {
      const { receiverId } = data;
      console.log(`⏰ Call timeout from ${socket.userId} to ${receiverId}`);

      socket.to(receiverId).emit("call_timeout");
    });
  };

  const setupChatHandlers = (socket) => {
    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, senderId, content, messageType } = data;

        console.log(`📤 New message in chat ${chatId} from user ${senderId}`);

        const newMessage = new Message({
          sender: senderId,
          content: content,
          messageType: messageType || "text",
          chat: chatId,
          status: "sent",
        });

        await newMessage.save();

        await newMessage.populate("sender", "firstName lastName email image");

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: newMessage._id,
          lastMessageStatus: "sent",
          updatedAt: new Date(),
        });

        io.to(chatId).emit("newMessage", {
          _id: newMessage._id,
          sender: newMessage.sender,
          content: newMessage.content,
          messageType: newMessage.messageType,
          chatId: chatId,
          createdAt: newMessage.createdAt,
          status: newMessage.status,
        });

        io.to(chatId).emit("chatUpdated");
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
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

    socket.on("clearChat", async (data) => {
      try {
        const { chatId, clearedForEveryone } = data;

        if (clearedForEveryone) {
          await Message.deleteMany({ chat: chatId });

          await Chat.findByIdAndUpdate(chatId, {
            lastMessage: null,
            lastMessageStatus: null,
            updatedAt: new Date(),
          });

          io.to(chatId).emit("messagesCleared", {
            chatId,
            clearedForEveryone: true,
          });
        } else {
          socket.emit("messagesCleared", {
            chatId,
            clearedForEveryone: false,
          });
        }

        io.to(chatId).emit("chatUpdated");
      } catch (error) {
        console.error("Error clearing chat:", error);
      }
    });
  };

  const setupUserHandlers = (socket) => {
    socket.on("getOnlineUsers", () => {
      try {
        const onlineUsers = Array.from(connectedUsers.values()).map(
          (u) => u.user
        );

        console.log(
          `📤 Sending ${onlineUsers.length} real-time online users to ${socket.userId}`
        );

        const filteredOnlineUsers = onlineUsers.filter(
          (user) => user._id.toString() !== socket.userId
        );

        console.log(
          `📋 Sending ${filteredOnlineUsers.length} online users to ${socket.userId} (excluding self)`
        );

        socket.emit("onlineUsers", filteredOnlineUsers);
      } catch (error) {
        console.error("Error handling getOnlineUsers:", error);
        socket.emit("onlineUsers", []);
      }
    });

    socket.on("getOnlineUsersFromDB", async () => {
      try {
        const onlineUsers = await User.find({
          isOnline: true,
          _id: { $ne: socket.userId },
        }).select("_id firstName lastName email image isOnline lastSeen");
        console.log(`📋 Found ${onlineUsers.length} online users in database`);
        socket.emit("onlineUsers", onlineUsers);
      } catch (error) {
        console.error("Error fetching online users:", error);
        socket.emit("onlineUsers", []);
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

    socket.on("markAsDelivered", async (data) => {
      try {
        const { messageId, userId } = data;

        console.log(`📨 Mark as delivered request:`, { messageId, userId });

        const message = await Message.findById(messageId);
        if (!message) {
          console.error(`❌ Message ${messageId} not found`);
          return;
        }

        const chat = await Chat.findById(message.chat);
        if (!chat) {
          console.error(`❌ Chat ${message.chat} not found`);
          return;
        }

        const isParticipant =
          chat.participants.includes(userId) || chat.members?.includes(userId);

        if (!isParticipant) {
          console.error(
            `❌ User ${userId} is not a participant in chat ${message.chat}`
          );
          return;
        }

        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            status: "delivered",
            $addToSet: { deliveredTo: userId },
          },
          { new: true }
        ).populate("deliveredTo", "_id firstName lastName email image");

        io.to(message.chat.toString()).emit("messageStatusUpdate", {
          messageId: messageId,
          status: "delivered",
          deliveredTo: updatedMessage.deliveredTo,
          chatId: message.chat.toString(),
        });

        console.log(
          `✅ Successfully marked message ${messageId} as delivered for user ${userId}`
        );
      } catch (error) {
        console.error("❌ Error in markAsDelivered:", error);
      }
    });
  };

  io.on("connection", (socket) => {
    console.log(`✅ User ${socket.userId} connected with socket ${socket.id}`);

    socket.join(socket.userId);
    console.log(`🏠 User ${socket.userId} joined room: ${socket.userId}`);

    setupMessageStatusHandlers(socket, io);
    setupChatHandlers(socket);
    setupUserHandlers(socket);
    setupCallHandlers(socket);

    markAllUndeliveredAsDelivered(socket.userId);

    const sendInitialOnlineUsers = () => {
      try {
        const onlineUsers = Array.from(connectedUsers.values()).map(
          (u) => u.user
        );
        const filteredOnlineUsers = onlineUsers.filter(
          (user) => user._id.toString() !== socket.userId
        );

        console.log(
          `📤 Sending initial ${filteredOnlineUsers.length} online users to ${socket.userId}`
        );
        socket.emit("onlineUsers", filteredOnlineUsers);
      } catch (error) {
        console.error("Error sending initial online users:", error);
        socket.emit("onlineUsers", []);
      }
    };

    setTimeout(sendInitialOnlineUsers, 100);

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
        await markAllUndeliveredAsDelivered(userId);
      } catch (error) {
        console.error("❌ Error marking messages as delivered:", error);
      }
    });

    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`👥 User ${socket.userId} joined chat ${chatId}`);

      setTimeout(async () => {
        try {
          const undeliveredMessages = await Message.find({
            chat: chatId,
            status: "sent",
            sender: { $ne: socket.userId },
            deliveredTo: { $ne: socket.userId },
          });

          console.log(
            `📨 Found ${undeliveredMessages.length} undelivered messages in chat ${chatId} for user ${socket.userId}`
          );

          for (const message of undeliveredMessages) {
            const updatedMessage = await Message.findByIdAndUpdate(
              message._id,
              {
                status: "delivered",
                $addToSet: { deliveredTo: socket.userId },
              },
              { new: true }
            ).populate("deliveredTo", "_id firstName lastName email image");

            io.to(message.chat.toString()).emit("messageStatusUpdate", {
              messageId: message._id,
              status: "delivered",
              deliveredTo: updatedMessage.deliveredTo,
              chatId: message.chat.toString(),
            });

            console.log(
              `✅ Marked message ${message._id} as delivered in chat ${chatId}`
            );
          }
        } catch (error) {
          console.error(
            "Error marking messages as delivered when joining chat:",
            error
          );
        }
      }, 500);
    });

    socket.on("leaveChat", (chatId) => {
      socket.leave(chatId);
      console.log(`👋 User ${socket.userId} left chat ${chatId}`);
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
