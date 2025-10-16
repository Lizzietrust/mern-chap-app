// migrations/fix-unreadcount.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

const fixUnreadCounts = async () => {
  try {
    console.log("🔧 Starting unreadCount migration...");

    await mongoose.connect(DATABASE_URL);
    console.log("✅ Connected to database");

    const db = mongoose.connection.db;

    // Use direct MongoDB operations - don't use Mongoose models
    const result = await db.collection("chats").updateMany(
      {
        $or: [
          { unreadCount: { $type: "array" } },
          { unreadCount: null },
          { unreadCount: { $exists: false } },
          { unreadCount: { $type: "undefined" } },
        ],
      },
      { $set: { unreadCount: {} } }
    );

    console.log(`✅ Fixed ${result.modifiedCount} chats`);

    // Verify the fix
    const totalChats = await db.collection("chats").countDocuments();
    const arrayChats = await db.collection("chats").countDocuments({
      unreadCount: { $type: "array" },
    });

    console.log(`\n📊 Verification:`);
    console.log(`   Total chats: ${totalChats}`);
    console.log(`   Chats with array unreadCount: ${arrayChats}`);
    console.log(`   Fixed: ${arrayChats === 0 ? "✅ YES" : "❌ NO"}`);

    if (arrayChats === 0) {
      console.log("\n🎉 Migration completed successfully!");
    } else {
      console.log("\n⚠️ Some chats still need fixing");
    }

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

// Run only the migration
fixUnreadCounts();
