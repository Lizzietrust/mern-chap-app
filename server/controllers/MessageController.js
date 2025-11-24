import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel.js";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import mongoose from "mongoose";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

export const upload = multer({ storage: storage });

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("Uploading file to Cloudinary:", req.file.originalname);

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat-app",
      resource_type: "auto",
    });

    console.log("Cloudinary upload successful:", result.secure_url);

    fs.unlinkSync(req.file.path);

    res.status(200).json({
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: result.bytes,
      publicId: result.public_id,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error in uploadFile:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "File upload failed",
      error: error.message,
    });
  }
};

export const createChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    if (req.userId === userId) {
      return res
        .status(400)
        .json({ message: "Cannot create chat with yourself" });
    }

    const existingChat = await Chat.findOne({
      type: "direct",
      participants: {
        $all: [req.userId, userId],
        $size: 2,
      },
    }).populate(
      "participants",
      "_id firstName lastName email image isOnline lastSeen"
    );

    if (existingChat) {
      console.log("✅ Returning existing chat:", existingChat._id);
      return res.status(200).json(existingChat);
    }

    const newChat = new Chat({
      type: "direct",
      participants: [req.userId, userId],
    });

    const savedChat = await newChat.save();

    const populatedChat = await Chat.findById(savedChat._id).populate(
      "participants",
      "_id firstName lastName email image isOnline lastSeen"
    );

    console.log("✅ Created new chat:", populatedChat._id);
    res.status(201).json(populatedChat);
  } catch (error) {
    console.error("Error in createChat:", error);
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const {
      chatId,
      content,
      messageType = "text",
      fileUrl,
      fileName,
      fileSize,
    } = req.body;
    const sender = req.userId;

    console.log("📥 Received message request:", {
      chatId,
      sender,
      content,
      messageType,
    });

    if (!chatId) {
      return res.status(400).json({ message: "ChatId is required" });
    }

    if (!content?.trim() && !fileUrl) {
      return res.status(400).json({
        message: "Content or file is required",
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.type === "direct") {
      if (!chat.participants.includes(sender)) {
        return res
          .status(403)
          .json({ message: "You are not a participant in this chat" });
      }
    } else if (chat.type === "channel") {
      if (!chat.members.includes(sender)) {
        return res
          .status(403)
          .json({ message: "You are not a member of this channel" });
      }
    }

    const newMessage = new Message({
      sender,
      messageType,
      content: content?.trim() || "",
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      chat: chatId,
      status: "sent",
      readBy: [sender],
      readReceipts: [
        {
          user: sender,
          readAt: new Date(),
        },
      ],
    });

    console.log("💾 Saving message to database...");
    const savedMessage = await newMessage.save();
    console.log("✅ Message saved to database:", savedMessage._id);

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: content?.trim() || fileName || "File shared",
      lastMessageAt: new Date(),
      $push: { messages: savedMessage._id },
    });

    try {
      const db = mongoose.connection.db;

      if (chat.type === "direct") {
        for (const participantId of chat.participants) {
          const participantStr = participantId.toString();
          if (participantStr !== sender) {
            await db.collection("chats").updateOne(
              { _id: chat._id },
              {
                $inc: { [`unreadCount.${participantStr}`]: 1 },
              }
            );
            console.log(
              `📈 Incremented unread count for participant: ${participantStr}`
            );
          } else {
            await db.collection("chats").updateOne(
              { _id: chat._id },
              {
                $set: { [`unreadCount.${participantStr}`]: 0 },
              }
            );
            console.log(`🔄 Reset unread count for sender: ${participantStr}`);
          }
        }
      } else if (chat.type === "channel") {
        for (const memberId of chat.members) {
          const memberStr = memberId.toString();
          if (memberStr !== sender) {
            await db.collection("chats").updateOne(
              { _id: chat._id },
              {
                $inc: { [`unreadCount.${memberStr}`]: 1 },
              }
            );
            console.log(`📈 Incremented unread count for member: ${memberStr}`);
          } else {
            await db.collection("chats").updateOne(
              { _id: chat._id },
              {
                $set: { [`unreadCount.${memberStr}`]: 0 },
              }
            );
            console.log(`🔄 Reset unread count for sender: ${memberStr}`);
          }
        }
      }
    } catch (unreadError) {
      console.error("❌ Error updating unread counts:", unreadError);
    }

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("sender", "_id firstName lastName email image")
      .populate("readBy", "_id firstName lastName email image");

    const io = req.app.get("io");

    if (io) {
      console.log(`📢 Emitting socket events for chat: ${chatId}`);

      const messagePayload = {
        _id: populatedMessage._id.toString(),
        sender: populatedMessage.sender,
        messageType: populatedMessage.messageType,
        content: populatedMessage.content || "",
        text: populatedMessage.content || "",
        fileUrl: populatedMessage.fileUrl,
        fileName: populatedMessage.fileName,
        fileSize: populatedMessage.fileSize,
        chat: populatedMessage.chat.toString(),
        chatId: populatedMessage.chat.toString(),
        createdAt: populatedMessage.createdAt.toISOString(),
        timestamp: populatedMessage.createdAt.toISOString(),
        status: populatedMessage.status,
        readBy: populatedMessage.readBy,
        readReceipts: populatedMessage.readReceipts,
      };

      if (chat.type === "direct") {
        chat.participants.forEach((participantId) => {
          io.to(participantId.toString()).emit("newMessage", messagePayload);
          io.to(participantId.toString()).emit(
            "messageReceived",
            messagePayload
          );
          console.log(`✅ Emitted to participant: ${participantId}`);
        });

        if (savedMessage.messageType !== "text") {
          console.log(
            `📁 Emitting sharedMediaUpdated for file message: ${savedMessage._id}`
          );

          chat.participants.forEach((participantId) => {
            io.to(participantId.toString()).emit("sharedMediaUpdated", {
              chatId: chat._id.toString(),
              participants: chat.participants.map((p) => p.toString()),
              newMedia: {
                _id: savedMessage._id,
                messageType: savedMessage.messageType,
                fileUrl: savedMessage.fileUrl,
                fileName: savedMessage.fileName,
                fileSize: savedMessage.fileSize,
                createdAt: savedMessage.createdAt,
                sender: {
                  _id: populatedMessage.sender._id,
                  firstName: populatedMessage.sender.firstName,
                  lastName: populatedMessage.sender.lastName,
                  image: populatedMessage.sender.image,
                },
              },
            });
            console.log(
              `📁 Emitted sharedMediaUpdated to participant: ${participantId}`
            );
          });
        }
      } else if (chat.type === "channel") {
        chat.members.forEach((memberId) => {
          io.to(memberId.toString()).emit("newMessage", messagePayload);
          io.to(memberId.toString()).emit("messageReceived", messagePayload);
          console.log(`✅ Emitted to member: ${memberId}`);
        });

        io.to(chatId).emit("newMessage", messagePayload);
        io.to(chatId).emit("messageReceived", messagePayload);
      }

      io.emit("chatUpdated", {
        chatId,
        lastMessage: messagePayload.content,
        lastMessageAt: messagePayload.createdAt,
        lastMessageSender: messagePayload.sender,
      });

      console.log(`🔄 Emitted chatUpdated event for: ${chatId}`);
    } else {
      console.log("❌ Socket.io instance not available");
    }

    console.log("✅ Message sent successfully, sending response");
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage:", error);
    console.error("❌ Error stack:", error.stack);

    if (error.name === "ValidationError") {
      console.error("📋 Validation errors:", error.errors);
      return res.status(400).json({
        message: "Message validation failed",
        errors: error.errors,
      });
    }

    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to send message",
        error: error.message,
      });
    }
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    if (!chatId) {
      return res.status(400).json({ message: "ChatId is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.type === "direct") {
      if (!chat.participants.includes(userId)) {
        return res
          .status(403)
          .json({ message: "You are not authorized to view these messages" });
      }
    } else if (chat.type === "channel") {
      if (!chat.members.includes(userId)) {
        return res
          .status(403)
          .json({ message: "You are not authorized to view these messages" });
      }
    }

    const userClearedAt = chat.clearedBy?.get(userId.toString());
    let messages = [];

    if (!userClearedAt) {
      messages = await Message.find({ chat: chatId })
        .populate("sender", "_id firstName lastName email image")
        .populate("readBy", "_id firstName lastName email image")
        .populate("readReceipts.user", "_id firstName lastName email image")
        .sort({ createdAt: 1 });
    } else {
      messages = await Message.find({
        chat: chatId,
        createdAt: { $gt: userClearedAt },
      })
        .populate("sender", "_id firstName lastName email image")
        .populate("readBy", "_id firstName lastName email image")
        .populate("readReceipts.user", "_id firstName lastName email image")
        .sort({ createdAt: 1 });

      console.log(
        `🧹 Showing only messages after clear time: ${userClearedAt}`
      );
    }

    console.log(`📨 Retrieved ${messages.length} messages for chat ${chatId}`);

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error in getMessages:", error);
    next(error);
  }
};

export const getUserChats = async (req, res, next) => {
  try {
    const userId = req.userId;

    console.log("🔍 getUserChats called for user:", userId);

    const chats = await Chat.aggregate([
      {
        $match: {
          $or: [
            {
              type: "direct",
              participants: {
                $exists: true,
                $ne: [],
                $size: 2,
              },
            },
            {
              type: "channel",
              members: new mongoose.Types.ObjectId(userId),
            },
          ],
        },
      },
      {
        $addFields: {
          isValidDirectChat: {
            $cond: {
              if: { $eq: ["$type", "direct"] },
              then: {
                $and: [
                  { $isArray: "$participants" },
                  { $eq: [{ $size: "$participants" }, 2] },
                  {
                    $in: [new mongoose.Types.ObjectId(userId), "$participants"],
                  },
                ],
              },
              else: true,
            },
          },
        },
      },
      {
        $match: {
          isValidDirectChat: true,
        },
      },

      {
        $addFields: {
          calculatedUnreadCount: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$unreadCount", null] },
                  { $ne: ["$unreadCount", []] },
                  { $eq: [{ $type: "$unreadCount" }, "object"] },
                ],
              },
              then: {
                $ifNull: [
                  {
                    $getField: {
                      field: userId.toString(),
                      input: "$unreadCount",
                    },
                  },
                  0,
                ],
              },
              else: 0,
            },
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participants",
        },
      },
      {
        $lookup: {
          from: "messages",
          let: { chatId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$chat", "$$chatId"] },
                    { $eq: ["$chatId", "$$chatId"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
              },
            },
            {
              $project: {
                content: 1,
                createdAt: 1,
                messageType: 1,
                sender: { $arrayElemAt: ["$sender", 0] },
              },
            },
          ],
          as: "lastMessageInfo",
        },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          participants: 1,
          name: 1,
          description: 1,
          isPrivate: 1,
          createdBy: 1,
          admins: 1,
          members: 1,
          createdAt: 1,
          updatedAt: 1,
          unreadCount: "$calculatedUnreadCount",

          lastMessage: {
            $ifNull: [{ $arrayElemAt: ["$lastMessageInfo.content", 0] }, ""],
          },
          lastMessageAt: {
            $ifNull: [
              { $arrayElemAt: ["$lastMessageInfo.createdAt", 0] },
              "$updatedAt",
            ],
          },
          lastMessageSender: {
            $ifNull: [{ $arrayElemAt: ["$lastMessageInfo.sender", 0] }, null],
          },
          lastMessageType: {
            $ifNull: [
              { $arrayElemAt: ["$lastMessageInfo.messageType", 0] },
              "text",
            ],
          },
        },
      },
      {
        $sort: {
          lastMessageAt: -1,
          updatedAt: -1,
        },
      },
    ]);

    console.log("📈 Aggregation Results:", {
      totalChats: chats.length,
      chatTypes: chats.map((chat) => ({
        id: chat._id,
        type: chat.type,
        name: chat.name,
        participantsCount: chat.participants?.length,
        membersCount: chat.members?.length,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        lastMessageType: chat.lastMessageType,
        hasLastMessage: !!chat.lastMessage,
        unreadCount: chat.unreadCount,
      })),
    });

    if (chats.length > 0) {
      console.log("🔍 Sample chat details:");
      chats.slice(0, 3).forEach((chat, index) => {
        console.log(`  Chat ${index + 1}:`, {
          id: chat._id,
          type: chat.type,
          lastMessage: chat.lastMessage || "(empty)",
          lastMessageLength: chat.lastMessage ? chat.lastMessage.length : 0,
          lastMessageAt: chat.lastMessageAt,
          lastMessageType: chat.lastMessageType,
          participants: chat.participants?.map((p) => p._id),
        });
      });
    }

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error in getUserChats:", error);
    next(error);
  }
};

export const markChatAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    console.log(`📖 Marking chat ${chatId} as read for user ${userId}`);

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (Array.isArray(chat.unreadCount) || !chat.unreadCount) {
      console.log("🔄 Fixing unreadCount structure in markAsRead...");
      chat.unreadCount = new Map();
    }

    await chat.resetUnreadCount(userId);

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    console.log("✅ Chat marked as read successfully");

    const io = req.app.get("io");
    if (io) {
      io.emit("chatUpdated", { chatId });
      console.log(`🔄 Emitted chatUpdated event for: ${chatId}`);
    }

    res.status(200).json({ message: "Chat marked as read" });
  } catch (error) {
    console.error("Error marking chat as read:", error);

    try {
      console.log("🔄 Attempting direct MongoDB update for markAsRead...");
      await mongoose.connection.db.collection("chats").updateOne(
        { _id: new mongoose.Types.ObjectId(chatId) },
        {
          $set: {
            [`unreadCount.${userId}`]: 0,
          },
        }
      );
      console.log("✅ Fixed via direct MongoDB update");
      res.status(200).json({ message: "Chat marked as read (fixed)" });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      next(error);
    }
  }
};

export const getUnreadCounts = async (req, res, next) => {
  try {
    const userId = req.userId;

    const unreadCounts = await Chat.aggregate([
      {
        $match: {
          $or: [
            {
              type: "direct",
              participants: new mongoose.Types.ObjectId(userId),
            },
            { type: "channel", members: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $lookup: {
          from: "messages",
          let: { chatId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$chatId", "$$chatId"] },
                readBy: { $ne: new mongoose.Types.ObjectId(userId) },
              },
            },
            { $count: "unreadCount" },
          ],
          as: "unreadMessages",
        },
      },
      {
        $project: {
          _id: 1,
          unreadCount: {
            $ifNull: [{ $arrayElemAt: ["$unreadMessages.unreadCount", 0] }, 0],
          },
        },
      },
    ]);

    res.status(200).json(unreadCounts);
  } catch (error) {
    console.error("Error getting unread counts:", error);
    next(error);
  }
};

export const debugChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({}).select(
      "_id type unreadCount participants members"
    );

    console.log("🔍 DEBUG - All chats unreadCount structure:");
    chats.forEach((chat) => {
      console.log({
        id: chat._id,
        type: chat.type,
        unreadCount: chat.unreadCount,
        unreadCountType: Array.isArray(chat.unreadCount)
          ? "ARRAY"
          : typeof chat.unreadCount,
        participants: chat.participants?.length,
        members: chat.members?.length,
      });
    });

    res.status(200).json({
      totalChats: chats.length,
      chats: chats.map((chat) => ({
        id: chat._id,
        type: chat.type,
        unreadCount: chat.unreadCount,
        unreadCountType: Array.isArray(chat.unreadCount)
          ? "ARRAY"
          : typeof chat.unreadCount,
      })),
    });
  } catch (error) {
    console.error("Error in debugChats:", error);
    next(error);
  }
};

export const markMessageAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const readerId = req.userId;

    console.log(`👁️ Marking message ${messageId} as read by user ${readerId}`);

    const currentMessage = await Message.findById(messageId);
    if (!currentMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isAlreadyRead = currentMessage.readBy.some(
      (readByItem) => readByItem.toString() === readerId
    );

    if (isAlreadyRead) {
      console.log(`ℹ️ User ${readerId} already marked this message as read`);

      if (currentMessage.status !== "read") {
        console.log(
          `🔄 Updating message status from "${currentMessage.status}" to "read"`
        );

        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            status: "read",
          },
          { new: true }
        )
          .populate("sender", "_id firstName lastName email image")
          .populate("readBy", "_id firstName lastName email image");

        const io = req.app.get("io");
        if (io) {
          io.to(updatedMessage.chat.toString()).emit("messageStatusUpdate", {
            messageId: updatedMessage._id,
            status: updatedMessage.status,
            readBy: updatedMessage.readBy,
            chatId: updatedMessage.chat.toString(),
          });
        }

        return res.status(200).json({
          message: "Message status updated to read",
          data: updatedMessage,
        });
      }

      return res.status(200).json({
        message: "Message already marked as read by user",
        data: currentMessage,
      });
    }

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        status: "read",
        $addToSet: {
          readBy: readerId,
          readReceipts: {
            user: readerId,
            readAt: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("sender", "_id firstName lastName email image")
      .populate("readBy", "_id firstName lastName email image");

    console.log(`✅ Message ${messageId} status updated to: ${message.status}`);
    console.log(`✅ ReadBy count: ${message.readBy.length}`);

    const io = req.app.get("io");
    if (io) {
      io.to(message.chat.toString()).emit("messageStatusUpdate", {
        messageId: message._id,
        status: message.status,
        readBy: message.readBy,
        chatId: message.chat.toString(),
      });
      console.log(`📢 Emitted messageStatusUpdate for message: ${messageId}`);
    }

    res.status(200).json({
      message: "Message marked as read",
      data: message,
    });
  } catch (error) {
    console.error("❌ Error marking message as read:", error);
    res.status(500).json({
      message: "Failed to mark message as read",
      error: error.message,
    });
  }
};

export const markMessageAsDelivered = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    console.log(
      `📨 Marking message ${messageId} as delivered to user ${userId}`
    );

    const currentMessage = await Message.findById(messageId);
    if (!currentMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    const updateData = {
      $addToSet: {
        readBy: userId,
      },
    };

    if (currentMessage.status === "sent") {
      updateData.status = "delivered";
    }

    const message = await Message.findByIdAndUpdate(messageId, updateData, {
      new: true,
    })
      .populate("sender", "_id firstName lastName email image")
      .populate("readBy", "_id firstName lastName email image");

    const io = req.app.get("io");
    if (io) {
      io.to(message.chat.toString()).emit("messageStatusUpdate", {
        messageId: message._id,
        status: message.status,
        readBy: message.readBy,
        chatId: message.chat.toString(),
      });
      console.log(`📢 Emitted messageStatusUpdate for message: ${messageId}`);
    }

    res.status(200).json({
      message: "Message marked as delivered",
      data: message,
    });
  } catch (error) {
    console.error("❌ Error marking message as delivered:", error);
    res.status(500).json({
      message: "Failed to mark message as delivered",
      error: error.message,
    });
  }
};

export const getMessageStatus = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId)
      .populate("readBy", "_id firstName lastName email image")
      .select("status readBy readReceipts");

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({
      messageId: message._id,
      status: message.status,
      readBy: message.readBy,
      readReceipts: message.readReceipts,
      totalRead: message.readBy.length,
    });
  } catch (error) {
    console.error("❌ Error getting message status:", error);
    res.status(500).json({
      message: "Failed to get message status",
      error: error.message,
    });
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    console.log(`✏️ Editing message ${messageId} by user ${userId}`);

    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own messages" });
    }

    const editTimeLimit = 15 * 60 * 1000;
    const messageAge = Date.now() - message.createdAt.getTime();

    if (messageAge > editTimeLimit) {
      return res.status(400).json({
        message: "Message can only be edited within 15 minutes of sending",
      });
    }

    const editHistory = message.editHistory || [];
    editHistory.push({
      content: message.content,
      editedAt: message.updatedAt || message.createdAt,
    });

    message.content = content.trim();
    message.text = content.trim();
    message.isEdited = true;
    message.editHistory = editHistory;
    message.updatedAt = new Date();

    const updatedMessage = await message.save();
    const populatedMessage = await Message.findById(updatedMessage._id)
      .populate("sender", "_id firstName lastName email image")
      .populate("readBy", "_id firstName lastName email image");

    const io = req.app.get("io");
    if (io) {
      io.to(message.chat.toString()).emit("messageUpdated", {
        action: "edited",
        message: populatedMessage,
        chatId: message.chat.toString(),
      });
      console.log(
        `📢 Emitted messageUpdated event for edited message: ${messageId}`
      );
    }

    res.status(200).json({
      message: "Message updated successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("❌ Error editing message:", error);
    res.status(500).json({
      message: "Failed to edit message",
      error: error.message,
    });
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;
    const { deleteForEveryone } = req.body;

    console.log(`🗑️ Deleting message ${messageId} by user ${userId}`);

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isSender = message.sender.toString() === userId;
    const isAdmin =
      chat.type === "channel" &&
      chat.admins?.some((admin) => admin.toString() === userId);
    const isChannelCreator =
      chat.type === "channel" && chat.createdBy?.toString() === userId;

    if (!isSender && !isAdmin && !isChannelCreator) {
      return res
        .status(403)
        .json({ message: "You don't have permission to delete this message" });
    }

    let result;

    if (deleteForEveryone && (isAdmin || isChannelCreator || isSender)) {
      result = await Message.findByIdAndDelete(messageId);

      const io = req.app.get("io");
      if (io) {
        io.to(message.chat.toString()).emit("messageUpdated", {
          action: "deleted",
          messageId: messageId,
          chatId: message.chat.toString(),
          deletedForEveryone: true,
        });
      }
    } else if (isSender) {
      message.deletedForSender = true;
      message.content = "This message was deleted";
      message.text = "This message was deleted";
      message.isDeleted = true;
      message.fileUrl = null;
      message.fileName = null;
      message.fileSize = null;

      result = await message.save();
      const populatedMessage = await Message.findById(result._id)
        .populate("sender", "_id firstName lastName email image")
        .populate("readBy", "_id firstName lastName email image");

      const io = req.app.get("io");
      if (io) {
        io.to(message.chat.toString()).emit("messageUpdated", {
          action: "deleted",
          message: populatedMessage,
          chatId: message.chat.toString(),
          deletedForEveryone: false,
        });
      }
    } else {
      return res
        .status(403)
        .json({ message: "You don't have permission to delete this message" });
    }

    res.status(200).json({
      message: "Message deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error deleting message:", error);
    res.status(500).json({
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

export const clearChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    console.log(`🧹 Clearing chat ${chatId} for user ${userId}`);

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.type === "direct") {
      if (!chat.participants.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (chat.type === "channel") {
      if (!chat.members.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (!chat.clearedBy) {
      chat.clearedBy = new Map();
    }
    chat.clearedBy.set(userId.toString(), new Date());

    if (chat.unreadCount) {
      chat.unreadCount.set(userId.toString(), 0);
    }

    chat.lastMessage = "";
    chat.lastMessageTime = new Date();

    await chat.save();

    console.log(`✅ Chat ${chatId} cleared for user ${userId}`);

    const io = req.app.get("io");
    if (io) {
      io.to(userId).emit("chatCleared", {
        chatId,
        clearedForEveryone: false,
      });

      io.emit("chatUpdated", { chatId });
    }

    res.status(200).json({
      message: "Chat cleared successfully",
      chatId,
    });
  } catch (error) {
    console.error("❌ Error clearing chat:", error);
    res.status(500).json({
      message: "Failed to clear chat",
      error: error.message,
    });
  }
};

export const clearChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;
    const { deleteForEveryone = false } = req.body;

    console.log(`🗑️ Clearing messages from chat ${chatId} for user ${userId}`);

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.type === "direct") {
      if (!chat.participants.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (chat.type === "channel") {
      if (!chat.members.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const isAdmin = chat.admins?.some((admin) => admin.toString() === userId);
      const isCreator = chat.createdBy?.toString() === userId;

      if (deleteForEveryone && !isAdmin && !isCreator) {
        return res.status(403).json({
          message: "Only admins can clear messages for everyone in channels",
        });
      }
    }

    if (deleteForEveryone) {
      await Message.deleteMany({ chat: chatId });

      chat.lastMessage = "";
      chat.lastMessageTime = new Date();

      if (chat.unreadCount) {
        if (chat.type === "direct") {
          chat.participants.forEach((participantId) => {
            chat.unreadCount.set(participantId.toString(), 0);
          });
        } else if (chat.type === "channel") {
          chat.members.forEach((memberId) => {
            chat.unreadCount.set(memberId.toString(), 0);
          });
        }
      }

      chat.clearedBy = new Map();

      await chat.save();

      const io = req.app.get("io");
      if (io) {
        io.to(chatId).emit("messagesCleared", {
          chatId,
          clearedForEveryone: true,
        });
        io.emit("chatUpdated", { chatId });
      }
    } else {
      if (chat.unreadCount) {
        chat.unreadCount.set(userId.toString(), 0);
      }

      if (!chat.clearedBy) {
        chat.clearedBy = new Map();
      }
      chat.clearedBy.set(userId.toString(), new Date());

      chat.lastMessage = "";
      chat.lastMessageTime = new Date();

      await chat.save();

      const io = req.app.get("io");
      if (io) {
        io.to(userId).emit("messagesCleared", {
          chatId,
          clearedForEveryone: false,
        });

        io.emit("chatUpdated", { chatId });
      }
    }

    console.log(`✅ Messages cleared for chat ${chatId}`);

    res.status(200).json({
      message: deleteForEveryone
        ? "All messages cleared for everyone"
        : "Chat cleared for you",
      chatId,
      deletedForEveryone: deleteForEveryone,
    });
  } catch (error) {
    console.error("❌ Error clearing chat messages:", error);
    res.status(500).json({
      message: "Failed to clear messages",
      error: error.message,
    });
  }
};

export const getSharedMedia = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.query;
    const currentUserId = req.userId;

    console.log(`📁 Getting shared media between ${userId1} and ${userId2}`);

    if (!userId1 || !userId2) {
      return res.status(400).json({
        message: "Both userId1 and userId2 are required",
      });
    }

    if (currentUserId !== userId1 && currentUserId !== userId2) {
      return res.status(403).json({
        message: "You can only view shared media for chats you're part of",
      });
    }

    const chat = await Chat.findOne({
      type: "direct",
      participants: {
        $all: [userId1, userId2],
        $size: 2,
      },
    });

    if (!chat) {
      console.log("❌ No direct chat found between users");
      return res.status(200).json([]);
    }

    console.log(`✅ Found chat: ${chat._id} between users`);

    const sharedMedia = await Message.find({
      chat: chat._id,
      messageType: { $in: ["image", "video", "file", "audio"] },
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
        { deletedForEveryone: false },
      ],
    })
      .populate("sender", "_id firstName lastName email image")
      .sort({ createdAt: -1 })
      .select(
        "_id messageType content fileUrl fileName fileSize mimeType createdAt sender isDeleted"
      );

    console.log(`✅ Found ${sharedMedia.length} shared media items`);

    const formattedMedia = sharedMedia.map((media) => ({
      _id: media._id,
      messageType: media.messageType,
      content: media.content,
      fileUrl: media.fileUrl,
      fileName: media.fileName,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
      sender: media.sender,
      isDeleted: media.isDeleted || false,
    }));

    res.status(200).json(formattedMedia);
  } catch (error) {
    console.error("❌ Error in getSharedMedia:", error);
    res.status(500).json({
      message: "Failed to get shared media",
      error: error.message,
    });
  }
};

export const getSharedMediaPaginated = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.query;
    const currentUserId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (!userId1 || !userId2) {
      return res.status(400).json({
        message: "Both userId1 and userId2 are required",
      });
    }

    if (currentUserId !== userId1 && currentUserId !== userId2) {
      return res.status(403).json({
        message: "You can only view shared media for chats you're part of",
      });
    }

    const chat = await Chat.findOne({
      type: "direct",
      participants: {
        $all: [userId1, userId2],
        $size: 2,
      },
    });

    if (!chat) {
      return res.status(200).json({
        media: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

    const totalCount = await Message.countDocuments({
      chat: chat._id,
      messageType: { $in: ["image", "video", "file", "audio"] },
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
        { deletedForEveryone: false },
      ],
    });

    const sharedMedia = await Message.find({
      chat: chat._id,
      messageType: { $in: ["image", "video", "file", "audio"] },
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
        { deletedForEveryone: false },
      ],
    })
      .populate("sender", "_id firstName lastName email image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "_id messageType content fileUrl fileName fileSize mimeType createdAt sender isDeleted"
      );

    const formattedMedia = sharedMedia.map((media) => ({
      _id: media._id,
      messageType: media.messageType,
      content: media.content,
      fileUrl: media.fileUrl,
      fileName: media.fileName,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
      sender: media.sender,
      isDeleted: media.isDeleted || false,
    }));

    res.status(200).json({
      media: formattedMedia,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error("❌ Error in getSharedMediaPaginated:", error);
    res.status(500).json({
      message: "Failed to get shared media",
      error: error.message,
    });
  }
};

export const getSharedMediaByType = async (req, res, next) => {
  try {
    const { userId1, userId2, types } = req.query;
    const currentUserId = req.userId;

    console.log(
      `📁 Getting shared media by type between ${userId1} and ${userId2}`
    );

    if (!userId1 || !userId2) {
      return res.status(400).json({
        message: "Both userId1 and userId2 are required",
      });
    }

    if (currentUserId !== userId1 && currentUserId !== userId2) {
      return res.status(403).json({
        message: "You can only view shared media for chats you're part of",
      });
    }

    let messageTypes = ["image", "video", "file", "audio"];
    if (types) {
      const requestedTypes = Array.isArray(types) ? types : [types];
      messageTypes = messageTypes.filter((type) =>
        requestedTypes.includes(type)
      );
    }

    const chat = await Chat.findOne({
      type: "direct",
      participants: {
        $all: [userId1, userId2],
        $size: 2,
      },
    });

    if (!chat) {
      return res.status(200).json([]);
    }

    const sharedMedia = await Message.find({
      chat: chat._id,
      messageType: { $in: messageTypes },
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
        { deletedForEveryone: false },
      ],
    })
      .populate("sender", "_id firstName lastName email image")
      .sort({ createdAt: -1 })
      .select(
        "_id messageType content fileUrl fileName fileSize mimeType createdAt sender isDeleted"
      );

    const groupedMedia = {
      images: sharedMedia.filter((media) => media.messageType === "image"),
      videos: sharedMedia.filter((media) => media.messageType === "video"),
      files: sharedMedia.filter((media) => media.messageType === "file"),
      audio: sharedMedia.filter((media) => media.messageType === "audio"),
    };

    res.status(200).json({
      all: sharedMedia,
      grouped: groupedMedia,
      counts: {
        total: sharedMedia.length,
        images: groupedMedia.images.length,
        videos: groupedMedia.videos.length,
        files: groupedMedia.files.length,
        audio: groupedMedia.audio.length,
      },
    });
  } catch (error) {
    console.error("❌ Error in getSharedMediaByType:", error);
    res.status(500).json({
      message: "Failed to get shared media",
      error: error.message,
    });
  }
};
