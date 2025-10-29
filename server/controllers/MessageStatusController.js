import Message from "../models/MessageModel.js";
import Chat from "../models/ChatModel.js";

export const setupMessageStatusHandlers = (socket, io) => {
  socket.on("messageDelivered", async (data) => {
    try {
      const { messageId, userId } = data;

      console.log(`📨 Message delivered: ${messageId} to user: ${userId}`);

      const message = await Message.findById(messageId);
      if (message) {
        if (!message.deliveredTo.includes(userId)) {
          message.deliveredTo.push(userId);
        }

        if (message.status === "sent") {
          message.status = "delivered";
        }

        await message.save();

        const populatedMessage = await Message.findById(messageId)
          .populate("sender", "_id firstName lastName email image")
          .populate("deliveredTo", "_id firstName lastName email image")
          .populate("readBy", "_id firstName lastName email image");

        io.to(message.chat.toString()).emit("messageStatusUpdate", {
          messageId: messageId,
          status: "delivered",
          chatId: message.chat.toString(),
          deliveredTo: populatedMessage.deliveredTo,
          readBy: populatedMessage.readBy,
        });

        console.log(`✅ Message ${messageId} marked as delivered`);
      }
    } catch (error) {
      console.error("Error handling message delivery:", error);
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

  socket.on("userOnline", async (userId) => {
    try {
      console.log(
        `🟢 User ${userId} came online, marking messages as delivered`
      );

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

  socket.on("markAllMessagesDelivered", async (userId) => {
    try {
      console.log(`🟢 Marking all messages as delivered for user: ${userId}`);
      await markAllUndeliveredAsDelivered(userId);
    } catch (error) {
      console.error("❌ Error marking all messages as delivered:", error);
    }
  });

  socket.on("markChatMessagesDelivered", async (data) => {
    try {
      const { chatId, userId } = data;

      console.log(
        `📨 Marking messages in chat ${chatId} as delivered for user ${userId}`
      );

      const undeliveredMessages = await Message.find({
        chat: chatId,
        status: "sent",
        sender: { $ne: userId },
        deliveredTo: { $ne: userId },
      });

      console.log(
        `📨 Found ${undeliveredMessages.length} undelivered messages in chat ${chatId} for user ${userId}`
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
            `✅ Marked message ${message._id} as delivered in chat ${chatId}`
          );
        } catch (messageError) {
          console.error(`Error updating message ${message._id}:`, messageError);
        }
      }
    } catch (error) {
      console.error("❌ Error marking chat messages as delivered:", error);
    }
  });

  socket.on("messageRead", async (data) => {
    try {
      const { messageId, userId } = data;

      console.log(`👁️ Message read: ${messageId} by user: ${userId}`);

      const message = await Message.findById(messageId);
      if (message) {
        if (!message.readBy.includes(userId)) {
          message.readBy.push(userId);
        }

        message.status = "read";

        message.readReceipts.push({
          user: userId,
          readAt: new Date(),
        });

        await message.save();

        const populatedMessage = await Message.findById(messageId)
          .populate("sender", "_id firstName lastName email image")
          .populate("readBy", "_id firstName lastName email image");

        io.to(message.chat.toString()).emit("messageStatusUpdate", {
          messageId: messageId,
          status: "read",
          chatId: message.chat.toString(),
          readBy: populatedMessage.readBy,
        });

        const chat = await Chat.findById(message.chat);
        if (
          chat &&
          chat.lastMessage &&
          chat.lastMessage.toString() === messageId
        ) {
          chat.lastMessageStatus = "read";
          await chat.save();

          io.to(message.chat.toString()).emit("chatUpdated");
        }

        console.log(`✅ Message ${messageId} marked as read by ${userId}`);
      }
    } catch (error) {
      console.error("Error handling message read:", error);
    }
  });

  socket.on("markMessagesAsRead", async (data) => {
    try {
      const { messageIds, userId, chatId } = data;

      console.log(
        `👁️ Marking ${messageIds.length} messages as read by user: ${userId}`
      );

      await Message.updateMany(
        { _id: { $in: messageIds } },
        {
          $addToSet: { readBy: userId },
          $set: { status: "read" },
          $push: {
            readReceipts: {
              user: userId,
              readAt: new Date(),
            },
          },
        }
      );

      const updatedMessages = await Message.find({ _id: { $in: messageIds } })
        .populate("sender", "_id firstName lastName email image")
        .populate("readBy", "_id firstName lastName email image");

      updatedMessages.forEach((message) => {
        io.to(chatId).emit("messageStatusUpdate", {
          messageId: message._id,
          status: "read",
          chatId: chatId,
          readBy: message.readBy,
        });
      });

      const chat = await Chat.findById(chatId);
      if (chat && chat.lastMessage) {
        const lastMessage = await Message.findById(chat.lastMessage);
        if (lastMessage && lastMessage.readBy.includes(userId)) {
          chat.lastMessageStatus = "read";
          await chat.save();
          io.to(chatId).emit("chatUpdated");
        }
      }

      console.log(
        `✅ Successfully marked ${messageIds.length} messages as read`
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  socket.on("markAllMessagesAsRead", async (data) => {
    try {
      const { chatId, userId } = data;

      console.log(
        `👁️ Marking all messages in chat ${chatId} as read for user ${userId}`
      );

      const result = await Message.updateMany(
        {
          chat: chatId,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        },
        {
          $set: { status: "read" },
          $addToSet: { readBy: userId },
          $push: {
            readReceipts: {
              user: userId,
              readAt: new Date(),
            },
          },
        }
      );

      console.log(
        `✅ Marked ${result.modifiedCount} messages as read in chat ${chatId}`
      );

      const updatedMessages = await Message.find({
        chat: chatId,
        readBy: userId,
      })
        .populate("sender", "_id firstName lastName email image")
        .populate("readBy", "_id firstName lastName email image");

      updatedMessages.forEach((message) => {
        io.to(message.chat.toString()).emit("messageStatusUpdate", {
          messageId: message._id,
          status: message.status,
          readBy: message.readBy,
          chatId: message.chat.toString(),
        });
      });

      const chat = await Chat.findById(chatId);
      if (chat && chat.unreadCount) {
        chat.unreadCount.set(userId.toString(), 0);
        await chat.save();

        io.emit("chatUpdated", { chatId });
      }
    } catch (error) {
      console.error("Error marking all messages as read:", error);
    }
  });
};
