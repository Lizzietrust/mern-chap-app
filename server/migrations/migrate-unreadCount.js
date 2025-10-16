import mongoose from "mongoose";
import Chat from "../models/ChatModel.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("🔧 Migration starting...");
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "✓ Loaded" : "✗ Not found"
);

const migrateUnreadCounts = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    console.log("📡 Connecting to database...");
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connected to database");

    const chats = await Chat.find({});
    console.log(`📊 Found ${chats.length} chats to check`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const chat of chats) {
      console.log(`\n🔍 Checking chat ${chat._id}:`, {
        type: chat.type,
        unreadCountType: Array.isArray(chat.unreadCount)
          ? "ARRAY"
          : typeof chat.unreadCount,
        isMap: chat.unreadCount instanceof Map,
        unreadCountValue: chat.unreadCount,
      });

      // If unreadCount is an array or not a Map, fix it
      if (
        Array.isArray(chat.unreadCount) ||
        !(chat.unreadCount instanceof Map)
      ) {
        console.log(`🔄 Fixing invalid unreadCount for chat ${chat._id}`);

        // Create a new Map
        const newUnreadCount = new Map();

        // If it was an object (but not Map), convert it
        if (
          chat.unreadCount &&
          typeof chat.unreadCount === "object" &&
          !Array.isArray(chat.unreadCount)
        ) {
          console.log(`📊 Converting object to Map for chat ${chat._id}`);
          Object.entries(chat.unreadCount).forEach(([key, value]) => {
            if (key !== "_id" && key !== "__v") {
              // Skip mongoose internal fields
              newUnreadCount.set(key, Number(value) || 0);
            }
          });
        }
        // If it was an array, just reset to empty Map
        else if (Array.isArray(chat.unreadCount)) {
          console.log(`🗑️ Resetting array to empty Map for chat ${chat._id}`);
          // Array structure is invalid, so we start fresh
        }

        chat.unreadCount = newUnreadCount;
        await chat.save();
        fixedCount++;
        console.log(`✅ Fixed chat ${chat._id}`);
      } else {
        console.log(
          `✅ Chat ${chat._id} already has valid unreadCount structure`
        );
        skippedCount++;
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Fixed ${fixedCount} chats`);
    console.log(`⏭️ Skipped ${skippedCount} already valid chats`);
    console.log(`📊 Total: ${chats.length} chats processed`);

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);

    // Try to close connection if it exists
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
};

// Run the migration
migrateUnreadCounts();
