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
      fileUrl,
      fileName,
      fileSize,
      chatId,
    });

    const savedMessage = await newMessage.save();
    console.log("💾 Message saved to database:", savedMessage._id);

    // Update chat with last message info
    await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: savedMessage._id },
        lastMessage: content?.trim() || fileName || "File shared",
        lastMessageTime: new Date(),
      },
      { new: true }
    );

    const populatedMessage = await Message.findById(savedMessage._id).populate(
      "sender",
      "_id firstName lastName email image"
    );

    const io = req.app.get("io");

    // INCREMENT UNREAD COUNTS FOR ALL RECIPIENTS (EXCEPT SENDER)
    if (chat.type === "direct") {
      for (const participantId of chat.participants) {
        if (participantId.toString() !== sender) {
          // Increment unread count for this participant
          await Chat.findByIdAndUpdate(chatId, {
            $inc: { [`unreadCount.${participantId}`]: 1 },
          });
          console.log(
            `📈 Incremented unread count for participant: ${participantId}`
          );
        }
      }
    } else if (chat.type === "channel") {
      for (const memberId of chat.members) {
        if (memberId.toString() !== sender) {
          // Increment unread count for this member
          await Chat.findByIdAndUpdate(chatId, {
            $inc: { [`unreadCount.${memberId}`]: 1 },
          });
          console.log(`📈 Incremented unread count for member: ${memberId}`);
        }
      }
    }

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

      // Also emit chat update to refresh sidebar
      io.emit("chatUpdated", { chatId });
      console.log(`🔄 Emitted chatUpdated event for: ${chatId}`);
    } else {
      console.log("❌ Socket.io instance not available");
    }

    console.log("✅ Message sent successfully");
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage:", error);
    next(error);
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
              // Match direct chats: must have type "direct" AND valid participants
              type: "direct",
              participants: {
                $exists: true,
                $ne: [],
                $size: 2, // Ensure exactly 2 participants for direct chats
              },
            },
            {
              // Match channel chats where user is a member
              type: "channel",
              members: new mongoose.Types.ObjectId(userId),
            },
          ],
        },
      },
      // ==================== ADD THIS STAGE TO FILTER EMPTY PARTICIPANTS ====================
      {
        $addFields: {
          // For direct chats, ensure current user is a participant and there's exactly one other participant
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
              else: true, // Channels are always valid for this check
            },
          },
        },
      },
      {
        $match: {
          isValidDirectChat: true,
        },
      },
      // ==================== END FILTER STAGE ====================
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
          unreadCount: {
            $ifNull: [{ $arrayElemAt: ["$unreadMessages.unreadCount", 0] }, 0],
          },
          lastMessage: { $arrayElemAt: ["$lastMessageInfo.content", 0] },
          lastMessageAt: { $arrayElemAt: ["$lastMessageInfo.createdAt", 0] },
          lastMessageSender: { $arrayElemAt: ["$lastMessageInfo.sender", 0] },
          // Remove the isValidDirectChat field by not including it (don't use exclusion)
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
    // Remove the duplicate return statement that was causing the "headers already sent" error
  }
};

export const markChatAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    // Mark messages as read
    await Message.updateMany(
      {
        chatId,
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    // Update chat's unread count using Map structure
    await Chat.findByIdAndUpdate(chatId, {
      $set: {
        [`unreadCount.${userId}`]: 0,
      },
    });

    res.status(200).json({ message: "Chat marked as read" });
  } catch (error) {
    console.error("Error marking chat as read:", error);
    next(error);
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
