import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel.js";

export const createChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    // Check if trying to chat with self
    if (req.userId === userId) {
      return res
        .status(400)
        .json({ message: "Cannot create chat with yourself" });
    }

    // Find existing chat between these two users
    const existingChat = await Chat.findOne({
      participants: { $all: [req.userId, userId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] }, // Ensure it's a direct chat, not group
    }).populate(
      "participants",
      "_id firstName lastName email image isOnline lastSeen"
    );

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    // Create new chat
    const newChat = new Chat({
      participants: [req.userId, userId],
    });

    const savedChat = await newChat.save();

    // Populate participants before sending response
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
    const { chatId, content } = req.body;
    const sender = req.userId;

    // Validate required fields
    if (!chatId || !content?.trim()) {
      return res
        .status(400)
        .json({ message: "ChatId and content are required" });
    }

    // Verify chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.includes(sender)) {
      return res
        .status(403)
        .json({ message: "You are not a participant in this chat" });
    }

    // Create new message with correct field names
    const newMessage = new Message({
      sender,
      messageType: "text", // Fixed: was "message" should be "messageType"
      content: content.trim(),
      chatId, // Include chatId to link message to chat
    });

    const savedMessage = await newMessage.save();

    // Update chat with the new message and last message info
    await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: savedMessage._id },
        lastMessage: content.trim(),
        lastMessageTime: new Date(),
      },
      { new: true }
    );

    // Populate sender info before sending response
    const populatedMessage = await Message.findById(savedMessage._id).populate(
      "sender",
      "_id firstName lastName email image"
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    // Validate chatId
    if (!chatId) {
      return res.status(400).json({ message: "ChatId is required" });
    }

    // Verify chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view these messages" });
    }

    // Get messages directly from Message collection instead of populating chat.messages
    // This is more efficient and handles cases where messages might not be properly linked
    const messages = await Message.find({ chatId })
      .populate("sender", "_id firstName lastName email image")
      .sort({ createdAt: 1 }); // Sort by creation time, oldest first

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

    // Get chats and populate participants, also get last message info
    const chats = await Chat.find({ participants: userId })
      .populate(
        "participants",
        "_id firstName lastName email image isOnline lastSeen"
      )
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 }, // Get only the last message
        populate: {
          path: "sender",
          select: "_id firstName lastName",
        },
      })
      .sort({ updatedAt: -1 }); // Sort chats by most recently updated

    // Transform the data to include last message info
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
