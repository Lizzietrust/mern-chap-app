import Chat from "../models/ChatModel.js";

export const cleanupChats = async (req, res, next) => {
  try {
    console.log("🧹 Starting chat cleanup...");

    // Delete chats with empty participants
    const emptyParticipantsResult = await Chat.deleteMany({
      participants: { $exists: true, $size: 0 },
    });
    console.log(
      `🗑️ Deleted ${emptyParticipantsResult.deletedCount} chats with empty participants`
    );

    // Find duplicate direct chats
    const allChats = await Chat.find({ type: "direct" });
    const chatMap = new Map();
    const chatsToDelete = [];

    allChats.forEach((chat) => {
      if (!chat.participants || chat.participants.length !== 2) return;

      // Create a unique key based on sorted participant IDs
      const participantIds = chat.participants.map((p) => p.toString()).sort();
      const key = participantIds.join("-");

      if (chatMap.has(key)) {
        // Keep the most recent chat, delete older ones
        const existingChat = chatMap.get(key);
        const existingTime = existingChat.updatedAt || existingChat.createdAt;
        const currentTime = chat.updatedAt || chat.createdAt;

        if (currentTime > existingTime) {
          chatsToDelete.push(existingChat._id);
          chatMap.set(key, chat);
        } else {
          chatsToDelete.push(chat._id);
        }
      } else {
        chatMap.set(key, chat);
      }
    });

    // Delete duplicate chats
    if (chatsToDelete.length > 0) {
      const deleteResult = await Chat.deleteMany({
        _id: { $in: chatsToDelete },
      });
      console.log(`🗑️ Deleted ${deleteResult.deletedCount} duplicate chats`);
    }

    console.log("✅ Chat cleanup completed");
    res.status(200).json({
      message: "Cleanup completed",
      deletedEmpty: emptyParticipantsResult.deletedCount,
      deletedDuplicates: chatsToDelete.length,
    });
  } catch (error) {
    console.error("Error in cleanupChats:", error);
    next(error);
  }
};
