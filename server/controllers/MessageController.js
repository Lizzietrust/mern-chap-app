import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel.js";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
      participants: { $all: [req.userId, userId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    }).populate(
      "participants",
      "_id firstName lastName email image isOnline lastSeen"
    );

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const newChat = new Chat({
      participants: [req.userId, userId],
    });

    const savedChat = await newChat.save();

    const populatedChat = await Chat.findById(savedChat._id).populate(
      "participants",
      "_id firstName lastName email image isOnline lastSeen"
    );

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

    const chats = await Chat.find({ participants: userId })
      .populate(
        "participants",
        "_id firstName lastName email image isOnline lastSeen"
      )
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 },
        populate: {
          path: "sender",
          select: "_id firstName lastName",
        },
      })
      .sort({ updatedAt: -1 });

    const transformedChats = chats.map((chat) => {
      const chatObj = chat.toObject();
      const lastMessage =
        chatObj.messages && chatObj.messages.length > 0
          ? chatObj.messages[0]
          : null;

      return {
        ...chatObj,
        lastMessage: lastMessage ? lastMessage.content : null,
        lastMessageTime: lastMessage ? lastMessage.createdAt : null,
        lastMessageSender: lastMessage ? lastMessage.sender : null,
      };
    });

    res.status(200).json(transformedChats);
  } catch (error) {
    console.error("Error in getUserChats:", error);
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
