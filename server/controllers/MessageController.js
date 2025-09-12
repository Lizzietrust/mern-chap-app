import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel.js";

export const createChat = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const existingChat = await Chat.findOne({
      participants: { $all: [req.userId, userId] },
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const newChat = new Chat({
      participants: [req.userId, userId],
    });

    const savedChat = await newChat.save();

    res.status(201).json(savedChat);
  } catch (error) {
    console.log({ error });
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, content } = req.body;
    const sender = req.userId; // Assuming req.userId is set by AuthMiddleware

    const newMessage = new Message({
      sender,
      message: "text", // Assuming text messages for now
      content,
    });

    const savedMessage = await newMessage.save();

    await Chat.findByIdAndUpdate(
      chatId,
      { $push: { messages: savedMessage._id } },
      { new: true }
    );

    res.status(201).json(savedMessage);
  } catch (error) {
    console.log({ error });
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId).populate("messages");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(chat.messages);
  } catch (error) {
    console.log({ error });
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserChats = async (req, res, next) => {
  try {
    const userId = req.userId; // Assuming req.userId is set by AuthMiddleware
    const chats = await Chat.find({ participants: userId }).populate('participants'); // Populate participants to get user details
    res.status(200).json(chats);
  } catch (error) {
    console.log({ error });
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
