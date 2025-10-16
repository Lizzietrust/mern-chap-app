import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel.js";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import mongoose from "mongoose";

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

    // More robust duplicate check
    const existingChat = await Chat.findOne({
      type: "direct",
      participants: {
        $all: [req.userId, userId],
        $size: 2, // Ensure exactly 2 participants
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
      type: "direct", // Explicitly set type
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

    if (!chatId || (!content?.trim() && !fileUrl)) {
      return res
        .status(400)
        .json({ message: "ChatId and content or file are required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    console.log("🔍 Found chat:", {
      id: chat._id,
      type: chat.type,
      unreadCount: chat.unreadCount,
      participants: chat.participants,
    });

    // Verify user permissions
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

    // Create and save message
    const newMessage = new Message({
      sender,
      messageType,
      content: content?.trim() || "",
      fileUrl,
      fileName,
      fileSize,
      chatId,
    });

    console.log("💾 Saving message to database...");
    const savedMessage = await newMessage.save();
    console.log("✅ Message saved to database:", savedMessage._id);

    // ==================== FIXED UNREAD COUNT LOGIC ====================
    console.log("🔄 Updating unread counts...");

    try {
      // First, ensure the chat has valid unreadCount structure
      const db = mongoose.connection.db;

      // Check if unreadCount is an array and fix it if needed
      const chatDoc = await db.collection("chats").findOne({ _id: chat._id });
      if (Array.isArray(chatDoc.unreadCount)) {
        console.log("🔄 Fixing array unreadCount before update...");
        await db
          .collection("chats")
          .updateOne({ _id: chat._id }, { $set: { unreadCount: {} } });
      }

      // Now update unread counts using direct MongoDB operations
      if (chat.type === "direct") {
        for (const participantId of chat.participants) {
          const participantStr = participantId.toString();
          if (participantStr !== sender) {
            // Increment for other participants
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
            // Reset for sender
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
        // FIXED: For channels, increment unread count for ALL members except sender
        for (const memberId of chat.members) {
          const memberStr = memberId.toString();
          if (memberStr !== sender) {
            // Increment for other members
            await db.collection("chats").updateOne(
              { _id: chat._id },
              {
                $inc: { [`unreadCount.${memberStr}`]: 1 },
              }
            );
            console.log(`📈 Incremented unread count for member: ${memberStr}`);
          } else {
            // Reset for sender
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
      console.log("⚠️ Continuing without unread count update");
    }
    // ==================== END FIXED UNREAD COUNT LOGIC ====================

    // Update chat with last message info
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: content?.trim() || fileName || "File shared",
      lastMessageTime: new Date(),
    });

    const populatedMessage = await Message.findById(savedMessage._id).populate(
      "sender",
      "_id firstName lastName email image"
    );

    const io = req.app.get("io");

    if (io) {
      console.log(`📢 Emitting newMessage event for chat: ${chatId}`);

      const messagePayload = {
        _id: populatedMessage._id.toString(),
        sender: populatedMessage.sender,
        messageType: populatedMessage.messageType,
        content: populatedMessage.content || "",
        text: populatedMessage.content || "",
        fileUrl: populatedMessage.fileUrl,
        fileName: populatedMessage.fileName,
        fileSize: populatedMessage.fileSize,
        chatId: populatedMessage.chatId.toString(),
        createdAt: populatedMessage.createdAt.toISOString(),
        timestamp: populatedMessage.createdAt.toISOString(),
      };

      // Emit to relevant users
      if (chat.type === "direct") {
        chat.participants.forEach((participantId) => {
          io.to(participantId.toString()).emit("newMessage", messagePayload);
          console.log(`✅ Emitted to participant: ${participantId}`);
        });
      } else if (chat.type === "channel") {
        chat.members.forEach((memberId) => {
          io.to(memberId.toString()).emit("newMessage", messagePayload);
          console.log(`✅ Emitted to member: ${memberId}`);
        });
        io.to(chatId).emit("newMessage", messagePayload);
      }

      io.emit("chatUpdated", { chatId });
      console.log(`🔄 Emitted chatUpdated event for: ${chatId}`);
    } else {
      console.log("❌ Socket.io instance not available");
    }

    console.log("✅ Message sent successfully, sending response");
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage:", error);
    console.error("❌ Error stack:", error.stack);

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

    const messages = await Message.find({ chatId })
      .populate("sender", "_id firstName lastName email image")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
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
      // ==================== SIMPLIFIED UNREAD COUNT ====================
      {
        $addFields: {
          // Use the unreadCount field directly if it exists and is valid
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
      // ==================== END SIMPLIFIED UNREAD COUNT ====================
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
                $expr: { $eq: ["$chatId", "$$chatId"] },
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
          unreadCount: "$calculatedUnreadCount", // Use the calculated field
          lastMessage: { $arrayElemAt: ["$lastMessageInfo.content", 0] },
          lastMessageAt: { $arrayElemAt: ["$lastMessageInfo.createdAt", 0] },
          lastMessageSender: { $arrayElemAt: ["$lastMessageInfo.sender", 0] },
        },
      },
      {
        $sort: { lastMessageAt: -1, updatedAt: -1 },
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
        unreadCount: chat.unreadCount,
      })),
    });

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

    // Defensive check for unreadCount structure
    if (Array.isArray(chat.unreadCount) || !chat.unreadCount) {
      console.log("🔄 Fixing unreadCount structure in markAsRead...");
      chat.unreadCount = new Map();
    }

    // Use the schema method to reset unread count for this user
    await chat.resetUnreadCount(userId);

    // Also mark messages as read
    await Message.updateMany(
      {
        chatId,
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

    // If schema method fails, try direct MongoDB update
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
