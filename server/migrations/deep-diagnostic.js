// migrations/deep-diagnostic.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const deepDiagnostic = async () => {
  try {
    console.log("🔄 Connecting to database...");

    await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("✅ Database connected successfully");

    // Dynamically import the Message model
    const { default: Message } = await import("../models/MessageModel.js");

    console.log("🔍 Running DEEP diagnostic analysis...");

    // Get ALL messages to see what fields they actually have
    const allMessages = await Message.find({}).limit(10); // Just get first 10 for analysis

    console.log(`📊 Sample of first 10 messages in database:`);

    allMessages.forEach((message, index) => {
      console.log(`\n📝 Message ${index + 1}: ${message._id}`);
      console.log(`   Raw document fields:`, Object.keys(message.toObject()));
      console.log(`   chat field:`, message.chat);
      console.log(`   chatId field:`, message.chatId);
      console.log(`   sender:`, message.sender);
      console.log(`   content:`, message.content?.substring(0, 50) + "...");
      console.log(`   messageType:`, message.messageType);
      console.log(`   createdAt:`, message.createdAt);
    });

    // Check what fields actually exist in the database schema
    console.log("\n🔍 Checking database collection schema...");
    const db = mongoose.connection.db;
    const messageCollection = db.collection("messages");

    // Get sample documents directly from collection
    const rawDocuments = await messageCollection.find({}).limit(5).toArray();

    console.log(`📊 Sample raw documents from messages collection:`);
    rawDocuments.forEach((doc, index) => {
      console.log(`\n📄 Document ${index + 1}:`);
      console.log(`   _id:`, doc._id);
      console.log(
        `   Fields:`,
        Object.keys(doc).filter((key) => !key.startsWith("_"))
      );
      // Show actual field values
      Object.keys(doc).forEach((key) => {
        if (!key.startsWith("_")) {
          console.log(`   ${key}:`, doc[key]);
        }
      });
    });

    // Check if there are different field names being used
    console.log("\n🔍 Checking for alternative field names...");

    // Common alternative field names for chat reference
    const possibleChatFields = [
      "chat",
      "chatId",
      "room",
      "roomId",
      "channel",
      "channelId",
      "conversation",
      "conversationId",
    ];

    for (const field of possibleChatFields) {
      const count = await Message.countDocuments({
        [field]: { $exists: true },
      });
      if (count > 0) {
        console.log(`📊 Found ${count} messages with field: ${field}`);

        // Sample some values
        const sample = await Message.find({ [field]: { $exists: true } }).limit(
          2
        );
        sample.forEach((msg) => {
          console.log(`   Sample: ${msg._id} -> ${field}: ${msg[field]}`);
        });
      }
    }
  } catch (error) {
    console.error("❌ Deep diagnostic failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run the deep diagnostic
deepDiagnostic();
