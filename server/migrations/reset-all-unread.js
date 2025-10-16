import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const resetAllUnread = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    const db = mongoose.connection.db;

    // Reset ALL unread counts to 0 for all users in all chats
    const result = await db.collection("chats").updateMany(
      {},
      { $set: { unreadCount: {} } } // Empty object means all counts are 0
    );

    console.log(`✅ Reset unread counts for ${result.modifiedCount} chats`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Reset error:", error);
    process.exit(1);
  }
};

resetAllUnread();
