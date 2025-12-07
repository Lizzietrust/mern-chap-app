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

  const getChannelById = async (channelId) => {
    try {
      const channel = await Chat.findOne({
        _id: channelId,
        type: "channel",
      })
        .populate(
          "members",
          "_id firstName lastName email image isOnline lastSeen"
        )
        .populate(
          "admins",
          "_id firstName lastName email image isOnline lastSeen"
        )
        .populate(
          "createdBy",
          "_id firstName lastName email image isOnline lastSeen"
        );

      if (!channel) {
        console.error(`Channel ${channelId} not found or not a channel`);
        return null;
      }

      return channel;
    } catch (error) {
      console.error("Error getting channel:", error);
      return null;
    }
  };

  const getChatById = async (chatId) => {
    try {
      const chat = await Chat.findById(chatId)
        .populate(
          "participants",
          "_id firstName lastName email image isOnline lastSeen"
        )
        .populate(
          "members",
          "_id firstName lastName email image isOnline lastSeen"
        )
        .populate(
          "admins",
          "_id firstName lastName email image isOnline lastSeen"
        )
        .populate(
          "createdBy",
          "_id firstName lastName email image isOnline lastSeen"
        );

      return chat;
    } catch (error) {
      console.error("Error getting chat:", error);
      return null;
    }
  };

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
    // Video state change handler
    socket.on("videoStateChanged", (data) => {
      const { receiverId, channelId, callRoomId, isVideoEnabled } = data;
      console.log(
        `📹 Video state changed by ${socket.userId}: ${isVideoEnabled}`
      );

      if (channelId && callRoomId) {
        // Channel call - broadcast to all in the call room
        socket.to(callRoomId).emit("remoteVideoStateChanged", {
          userId: socket.userId,
          isVideoEnabled,
        });
        console.log(`📤 Broadcasted video state to call room ${callRoomId}`);
      } else if (receiverId) {
        // Direct call - send to specific receiver
        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          socket.to(receiverSocket.socketId).emit("remoteVideoStateChanged", {
            userId: socket.userId,
            isVideoEnabled,
          });
          console.log(`📤 Sent video state to ${receiverId}`);
        } else {
          console.log(`⚠️ Receiver ${receiverId} is not connected`);
        }
      }
    });

    // Audio state change handler
    socket.on("audioStateChanged", (data) => {
      const { receiverId, channelId, callRoomId, isAudioEnabled } = data;
      console.log(
        `🎤 Audio state changed by ${socket.userId}: ${isAudioEnabled}`
      );

      if (channelId && callRoomId) {
        // Channel call - broadcast to all in the call room
        socket.to(callRoomId).emit("remoteAudioStateChanged", {
          userId: socket.userId,
          isAudioEnabled,
        });
        console.log(`📤 Broadcasted audio state to call room ${callRoomId}`);
      } else if (receiverId) {
        // Direct call - send to specific receiver
        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          socket.to(receiverSocket.socketId).emit("remoteAudioStateChanged", {
            userId: socket.userId,
            isAudioEnabled,
          });
          console.log(`📤 Sent audio state to ${receiverId}`);
        } else {
          console.log(`⚠️ Receiver ${receiverId} is not connected`);
        }
      }
    });

    // Direct call handler
    socket.on("start_call", (data) => {
      const { receiverId, type, caller, offer } = data;
      console.log(`📞 Direct call from ${caller._id} to ${receiverId}`);

      const receiverSocket = connectedUsers.get(receiverId);
      if (!receiverSocket) {
        console.log(`❌ Receiver ${receiverId} is not connected`);
        socket.emit("receiver_offline", { receiverId });
        return;
      }

      // Emit incoming call event
      socket.to(receiverSocket.socketId).emit("incoming_call", {
        caller: caller,
        type: type,
      });

      // Send WebRTC offer after delay
      if (offer) {
        setTimeout(() => {
          socket.to(receiverSocket.socketId).emit("offer", {
            offer: offer,
            callerId: socket.userId,
            callType: "direct",
          });
          console.log(`📨 Sent WebRTC offer to ${receiverId}`);
        }, 1000);
      }
    });

    socket.on("startChannelCall", async (data) => {
      const { channelId, type, caller, offer } = data;
      console.log(`📞 Channel call from ${caller._id} in channel ${channelId}`);

      const channel = await getChannelById(channelId);
      if (!channel) {
        console.error(`❌ Channel ${channelId} not found`);
        socket.emit("channelCallError", {
          message: "Channel not found",
          channelId: channelId,
        });
        return;
      }

      // Check if user is admin
      const isAdmin = channel.admins.some(
        (admin) => admin._id.toString() === caller._id.toString()
      );

      if (!isAdmin) {
        console.error(
          `❌ User ${caller._id} is not admin of channel ${channelId}`
        );
        socket.emit("channelCallError", {
          message: "Only admins can start channel calls",
          channelId: channelId,
        });
        return;
      }

      // Auto-join the admin to the call room
      const callRoomId = `channel-call-${channelId}`;
      socket.join(callRoomId);
      console.log(
        `👥 Admin ${caller._id} auto-joined call room: ${callRoomId}`
      );

      const membersToNotify = channel.members.filter(
        (member) => member._id.toString() !== caller._id.toString()
      );

      console.log(`📢 Notifying ${membersToNotify.length} channel members`);

      let notifiedCount = 0;
      let offlineCount = 0;

      membersToNotify.forEach((member) => {
        const memberSocket = connectedUsers.get(member._id.toString());
        if (memberSocket) {
          socket.to(memberSocket.socketId).emit("incomingChannelCall", {
            caller,
            type,
            callMode: "channel",
            channelData: {
              _id: channel._id,
              name: channel.name,
              type: "channel",
              participants: channel.members,
              isPrivate: channel.isPrivate,
              admins: channel.admins,
              createdBy: channel.createdBy,
              caller,
            },
            callRoomId,
          });
          console.log(`📨 Sent channel call notification to ${member._id}`);
          notifiedCount++;
        } else {
          console.log(`⚠️ Member ${member._id} is not connected`);
          offlineCount++;
        }
      });

      // Send summary to caller
      socket.emit("channelCallStarted", {
        channelId,
        notifiedCount,
        offlineCount,
        totalMembers: membersToNotify.length,
        callRoomId,
      });

      socket.emit("adminAutoJoinedCall", {
        channelId,
        callRoomId,
        type,
      });

      // Send WebRTC offer if provided
      if (offer) {
        console.log(
          "📨 WebRTC offer received, waiting for participants to join"
        );
      }
    });

    // Listen for the new event name (incomingDirectCall)
    socket.on("incomingDirectCall", (data) => {
      const receiverSocket = connectedUsers.get(data.receiverId);
      if (receiverSocket) {
        socket.to(receiverSocket.socketId).emit("incoming_call", {
          caller: data.caller,
          type: data.type,
        });
        console.log(`📨 Forwarded incomingDirectCall to ${data.receiverId}`);
      }
    });

    socket.on("joinChannelCall", async (data) => {
      const { channelId, user } = data;
      console.log(`👥 User ${user._id} joining channel call in ${channelId}`);

      const channel = await getChannelById(channelId);
      if (!channel) {
        console.error(`❌ Channel ${channelId} not found`);
        socket.emit("channelCallError", {
          message: "Channel not found",
          channelId: channelId,
        });
        return;
      }

      // Check if user is a member of the channel
      const isMember = channel.members.some(
        (member) => member._id.toString() === user._id.toString()
      );

      if (!isMember) {
        console.error(
          `❌ User ${user._id} is not a member of channel ${channelId}`
        );
        socket.emit("channelCallError", {
          message: "You are not a member of this channel",
          channelId: channelId,
        });
        return;
      }

      // Join the call room
      const callRoomId = `channel-call-${channelId}`;
      socket.join(callRoomId);
      console.log(`👥 User ${user._id} joined call room: ${callRoomId}`);

      // Notify all other participants in the call room
      socket.to(callRoomId).emit("userJoinedChannelCall", {
        channelId,
        user,
        callRoomId,
        timestamp: new Date(),
      });

      // Get current participants in the call room
      const participantsInRoom = [];
      const room = io.sockets.adapter.rooms.get(callRoomId);
      if (room) {
        const socketIds = Array.from(room);
        socketIds.forEach((socketId) => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket && socket.userId !== user._id.toString()) {
            participantsInRoom.push({
              _id: socket.userId,
              firstName: socket.user?.firstName || "",
              lastName: socket.user?.lastName || "",
              name:
                socket.user?.firstName && socket.user?.lastName
                  ? `${socket.user.firstName} ${socket.user.lastName}`
                  : socket.user?.name || "User",
              image: socket.user?.image || null,
              isOnline: true,
            });
          }
        });
      }

      // Send current participants to the new joiner
      socket.emit("channelCallParticipants", {
        channelId,
        callRoomId,
        participants: participantsInRoom,
      });

      // Confirm to joiner
      socket.emit("channelCallJoined", {
        channelId,
        channelName: channel.name,
        memberCount: participantsInRoom.length + 1,
        callRoomId,
      });
    });

    socket.on("acceptChannelCall", async (data) => {
      const { channelId, user, callRoomId } = data;
      console.log(
        `✅ Channel call accepted by ${user._id} in channel ${channelId}`
      );

      const channel = await getChannelById(channelId);
      if (!channel) return;

      if (callRoomId) {
        socket.join(callRoomId);
        console.log(
          `👥 User ${user._id} joined call room for accept: ${callRoomId}`
        );
      }

      const otherMembers = channel.members.filter(
        (member) => member._id.toString() !== user._id.toString()
      );

      otherMembers.forEach((member) => {
        const memberSocket = connectedUsers.get(member._id.toString());
        if (memberSocket) {
          socket.to(memberSocket.socketId).emit("channelCallAccepted", {
            channelId,
            user,
            timestamp: new Date(),
            callRoomId,
          });
          console.log(`📢 Notified ${member._id} that call was accepted`);
        }
      });
    });

    socket.on("rejectChannelCall", async (data) => {
      const { channelId, callRoomId } = data;
      console.log(
        `❌ Channel call rejected by ${socket.userId} in channel ${channelId}`
      );

      const channel = await getChannelById(channelId);
      if (!channel) return;

      const otherMembers = channel.members.filter(
        (member) => member._id.toString() !== socket.userId
      );

      otherMembers.forEach((member) => {
        const memberSocket = connectedUsers.get(member._id.toString());
        if (memberSocket) {
          socket.to(memberSocket.socketId).emit("channelCallRejected", {
            channelId,
            userId: socket.userId,
            timestamp: new Date(),
            callRoomId,
          });
          console.log(`📢 Notified ${member._id} that call was rejected`);
        }
      });

      // Leave the call room if joined
      if (callRoomId) {
        socket.leave(callRoomId);
        console.log(`👋 User ${socket.userId} left call room: ${callRoomId}`);
      }

      const callerSocket = connectedUsers.get(socket.userId);
      if (callerSocket) {
        socket.emit("callRejectedNotification", {
          channelId,
          rejecterId: socket.userId,
        });
      }
    });

    socket.on("endChannelCall", async (data) => {
      const { channelId, callRoomId } = data;
      console.log(
        `📞 Channel call ended by ${socket.userId} in channel ${channelId}`
      );

      const channel = await getChannelById(channelId);
      if (!channel) return;

      const otherMembers = channel.members.filter(
        (member) => member._id.toString() !== socket.userId
      );

      otherMembers.forEach((member) => {
        const memberSocket = connectedUsers.get(member._id.toString());
        if (memberSocket) {
          socket.to(memberSocket.socketId).emit("channelCallEnded", {
            channelId,
            userId: socket.userId,
            timestamp: new Date(),
            endedBy: socket.user,
            callRoomId,
          });
          console.log(`📢 Notified ${member._id} that call ended`);
        }
      });

      // Leave the call room
      if (callRoomId) {
        socket.leave(callRoomId);
        console.log(`👋 User ${socket.userId} left call room: ${callRoomId}`);
      }
    });

    socket.on("accept_call", (data) => {
      const { callerId } = data;
      console.log(
        `✅ Direct call accepted by ${socket.userId} for caller ${callerId}`
      );

      const callerSocket = connectedUsers.get(callerId);
      if (callerSocket) {
        socket.to(callerSocket.socketId).emit("call_accepted", {
          acceptorId: socket.userId,
          timestamp: new Date(),
        });
        console.log(`📤 Notified caller ${callerId} that call was accepted`);
      } else {
        console.log(`⚠️ Caller ${callerId} is no longer connected`);
      }
    });

    socket.on("reject_call", (data) => {
      const { callerId } = data;
      console.log(
        `❌ Direct call rejected by ${socket.userId} for caller ${callerId}`
      );

      const callerSocket = connectedUsers.get(callerId);
      if (callerSocket) {
        socket.to(callerSocket.socketId).emit("call_rejected", {
          rejecterId: socket.userId,
          timestamp: new Date(),
        });
        console.log(`📤 Notified caller ${callerId} that call was rejected`);
      } else {
        console.log(`⚠️ Caller ${callerId} is no longer connected`);
      }
    });

    socket.on("end_call", (data) => {
      const { receiverId } = data;
      console.log(`📞 Direct call ended by ${socket.userId}`);

      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        socket.to(receiverSocket.socketId).emit("call_ended", {
          endedBy: socket.userId,
          timestamp: new Date(),
        });
        console.log(`📤 Notified receiver ${receiverId} that call ended`);
      } else {
        console.log(`⚠️ Receiver ${receiverId} is no longer connected`);
      }
    });

    socket.on("offer", (data) => {
      const { offer, receiverId, callType, channelId, callRoomId } = data;
      console.log(`📨 Forwarding offer from ${socket.userId} to ${receiverId}`);

      const receiverSocket = connectedUsers.get(receiverId);

      if (receiverSocket) {
        socket.to(receiverSocket.socketId).emit("offer", {
          offer: offer,
          callerId: socket.userId,
          callType: callType || "direct",
          channelId: channelId,
          callRoomId: callRoomId,
        });
        console.log(`✅ Offer forwarded to ${receiverId}`);
      } else {
        console.log(`❌ Receiver ${receiverId} is not online for offer`);
        socket.emit("receiver_offline", { receiverId });
      }
    });

    socket.on("answer", (data) => {
      const { answer, callerId, callType, channelId, callRoomId } = data;
      console.log(`📨 Forwarding answer from ${socket.userId} to ${callerId}`);

      const callerSocket = connectedUsers.get(callerId);

      if (callerSocket) {
        socket.to(callerSocket.socketId).emit("answer", {
          answer: answer,
          receiverId: socket.userId,
          callType: callType || "direct",
          channelId: channelId,
          callRoomId: callRoomId,
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

      const receiverSocket = connectedUsers.get(receiverId);

      if (receiverSocket) {
        socket.to(receiverSocket.socketId).emit("ice-candidate", {
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

    socket.on("ice-candidate-channel", async (data) => {
      const { candidate, channelId, callRoomId } = data;
      console.log(
        `❄️ Forwarding ICE candidate from ${socket.userId} to channel ${channelId}`
      );

      const channel = await getChannelById(channelId);
      if (!channel) return;

      // If callRoomId is provided, broadcast to the call room
      if (callRoomId) {
        socket.to(callRoomId).emit("ice-candidate", {
          candidate: candidate,
          senderId: socket.userId,
          channelId: channelId,
          callRoomId: callRoomId,
        });
        console.log(`✅ ICE candidate broadcasted to call room ${callRoomId}`);
      } else {
        // Fallback to individual members
        const otherMembers = channel.members.filter(
          (member) => member._id.toString() !== socket.userId
        );

        otherMembers.forEach((member) => {
          const memberSocket = connectedUsers.get(member._id.toString());
          if (memberSocket) {
            socket.to(memberSocket.socketId).emit("ice-candidate", {
              candidate: candidate,
              senderId: socket.userId,
              channelId: channelId,
            });
            console.log(`✅ ICE candidate forwarded to ${member._id}`);
          }
        });
      }
    });

    socket.on("call_timeout", (data) => {
      const { receiverId } = data;
      console.log(`⏰ Call timeout from ${socket.userId} to ${receiverId}`);

      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        socket.to(receiverSocket.socketId).emit("call_timeout", {
          callerId: socket.userId,
          timestamp: new Date(),
        });
        console.log(`📤 Notified receiver ${receiverId} of call timeout`);
      }
    });

    socket.on("getChannelCallParticipants", async (data) => {
      const { channelId, callRoomId } = data;
      console.log(`👥 Getting participants for channel ${channelId}`);

      const channel = await getChannelById(channelId);
      if (!channel) {
        socket.emit("channelParticipantsError", {
          message: "Channel not found",
          channelId: channelId,
        });
        return;
      }

      // Get online members
      const onlineMembers = channel.members.filter((member) =>
        connectedUsers.has(member._id.toString())
      );

      const offlineMembers = channel.members.filter(
        (member) => !connectedUsers.has(member._id.toString())
      );

      // Get participants in the call room if callRoomId is provided
      let callRoomParticipants = [];
      if (callRoomId) {
        const room = io.sockets.adapter.rooms.get(callRoomId);
        if (room) {
          const socketIds = Array.from(room);
          callRoomParticipants = socketIds
            .map((socketId) => {
              const socket = io.sockets.sockets.get(socketId);
              return socket ? socket.userId : null;
            })
            .filter((id) => id !== null);
        }
      }

      socket.emit("channelCallParticipants", {
        channelId,
        totalMembers: channel.members.length,
        onlineMembers,
        offlineMembers,
        callRoomParticipants,
        callRoomId,
      });
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
          chat.participants?.includes(userId) || chat.members?.includes(userId);

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

    // Join user to their channel rooms
    socket.on("joinUserChannels", async () => {
      try {
        const userChannels = await Chat.find({
          type: "channel",
          members: socket.userId,
        }).select("_id");

        userChannels.forEach((channel) => {
          socket.join(channel._id.toString());
          console.log(
            `🏠 User ${socket.userId} joined channel room: ${channel._id}`
          );
        });
      } catch (error) {
        console.error("Error joining user channels:", error);
      }
    });

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
