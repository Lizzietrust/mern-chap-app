// migrations/verify-fix.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const verifyFix = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    const db = mongoose.connection.db;

    const total = await db.collection("chats").countDocuments();
    const arrays = await db.collection("chats").countDocuments({
      unreadCount: { $type: "array" },
    });
    const objects = await db.collection("chats").countDocuments({
      unreadCount: { $type: "object" },
    });

    console.log(`\n🔍 Verification Results:`);
    console.log(`   Total chats: ${total}`);
    console.log(`   ✅ Object unreadCount: ${objects}`);
    console.log(`   ❌ Array unreadCount: ${arrays}`);
    console.log(`   Other/undefined: ${total - objects - arrays}`);
    console.log(`   🎯 Status: ${arrays === 0 ? "FIXED" : "STILL BROKEN"}`);

    if (arrays > 0) {
      console.log(`\n⚠️ Still have ${arrays} chats with array unreadCount`);
      const brokenChats = await db
        .collection("chats")
        .find({ unreadCount: { $type: "array" } }, { projection: { _id: 1 } })
        .toArray();
      console.log(
        "Broken chat IDs:",
        brokenChats.map((c) => c._id)
      );
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("Verification error:", error);
  }
  process.exit(0);
};

verifyFix();
