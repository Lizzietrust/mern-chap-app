import Chat from "../models/ChatModel.js";

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