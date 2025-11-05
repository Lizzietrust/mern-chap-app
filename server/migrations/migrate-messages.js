// migrations/migrate-messages.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Import models with correct relative path
const Message = (await import("../models/MessageModel.js")).default;

const migrateMessageFields = async () => {
  try {
    console.log("🔄 Connecting to database...");

    await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("✅ Database connected successfully");

    // First, run comprehensive diagnostic to understand the current state
    console.log("🔍 Running comprehensive diagnostic analysis...");

    const totalMessages = await Message.countDocuments();

    // Get messages in each category separately for accurate counting
    const messagesWithChatIdOnly = await Message.find({
      chatId: { $exists: true },
      chat: { $exists: false },
    });
    const messagesWithChatOnly = await Message.find({
      chat: { $exists: true },
      chatId: { $exists: false },
    });
    const messagesWithBoth = await Message.find({
      chatId: { $exists: true },
      chat: { $exists: true },
    });

    // Also get the combined counts for reference
    const messagesWithChatId = await Message.find({
      chatId: { $exists: true },
    });
    const messagesWithChat = await Message.find({ chat: { $exists: true } });

    // Check for old format messages (recipient-based)
    const oldFormatMessages = await Message.find({
      recipient: { $exists: true },
      $or: [{ chat: { $exists: false } }, { chatId: { $exists: false } }],
    });

    // Check for broken messages (no references at all)
    const brokenMessages = await Message.find({
      $and: [
        { recipient: { $exists: false } },
        { chat: { $exists: false } },
        { chatId: { $exists: false } },
      ],
    });

    console.log(`📊 Total messages in database: ${totalMessages}`);
    console.log(`📊 Old format (recipient only): ${oldFormatMessages.length}`);
    console.log(`📊 Broken (no references): ${brokenMessages.length}`);
    console.log(
      `📊 Messages with ONLY chatId (no chat): ${messagesWithChatIdOnly.length}`
    );
    console.log(
      `📊 Messages with ONLY chat (no chatId): ${messagesWithChatOnly.length}`
    );
    console.log(`📊 Messages with BOTH fields: ${messagesWithBoth.length}`);
    console.log(
      `📊 Messages with chatId field (any): ${messagesWithChatId.length}`
    );
    console.log(
      `📊 Messages with chat field (any): ${messagesWithChat.length}`
    );

    // Check for inconsistent values
    const inconsistentMessages = await Message.find({
      $and: [
        { chat: { $exists: true } },
        { chatId: { $exists: true } },
        { $expr: { $ne: ["$chat", "$chatId"] } },
      ],
    });

    console.log(
      `📊 Messages with inconsistent chat/chatId values: ${inconsistentMessages.length}`
    );

    // Sample some messages to see actual data
    console.log("\n🔍 Sample of messages from each category:");

    if (oldFormatMessages.length > 0) {
      console.log("   Old format messages (recipient only):");
      const sampleOldFormat = oldFormatMessages.slice(0, 2);
      sampleOldFormat.forEach((msg, index) => {
        console.log(`     Message ${index + 1}: ${msg._id}`);
        console.log(`       sender: ${msg.sender}`);
        console.log(`       recipient: ${msg.recipient}`);
        console.log(`       chat: ${msg.chat} (missing)`);
        console.log(`       chatId: ${msg.chatId} (missing)`);
        console.log(`       message field: ${msg.message}`);
        console.log(`       messageType: ${msg.messageType}`);
      });
    }

    if (messagesWithChatIdOnly.length > 0) {
      console.log("   Messages with ONLY chatId:");
      const sampleChatIdOnly = messagesWithChatIdOnly.slice(0, 2);
      sampleChatIdOnly.forEach((msg, index) => {
        console.log(`     Message ${index + 1}: ${msg._id}`);
        console.log(`       chatId: ${msg.chatId}`);
        console.log(`       chat: ${msg.chat} (missing)`);
      });
    }

    if (messagesWithChatOnly.length > 0) {
      console.log("   Messages with ONLY chat:");
      const sampleChatOnly = messagesWithChatOnly.slice(0, 2);
      sampleChatOnly.forEach((msg, index) => {
        console.log(`     Message ${index + 1}: ${msg._id}`);
        console.log(`       chat: ${msg.chat}`);
        console.log(`       chatId: ${msg.chatId} (missing)`);
      });
    }

    if (messagesWithBoth.length > 0) {
      console.log("   Messages with BOTH fields:");
      const sampleBoth = messagesWithBoth.slice(0, 2);
      sampleBoth.forEach((msg, index) => {
        console.log(`     Message ${index + 1}: ${msg._id}`);
        console.log(`       chat: ${msg.chat}`);
        console.log(`       chatId: ${msg.chatId}`);
        console.log(
          `       consistent: ${
            msg.chat?.toString() === msg.chatId?.toString()
          }`
        );
      });
    }

    console.log("\n🔄 Starting comprehensive migration...");

    let totalFixed = 0;

    // FIX 0: Convert old format messages (recipient-based) to chat-based
    console.log(
      `\n🔧 Converting ${oldFormatMessages.length} old format messages...`
    );
    for (const message of oldFormatMessages) {
      if (message.recipient) {
        message.chat = message.recipient;
        message.chatId = message.recipient;

        // Also fix messageType if it's using old 'message' field
        if (message.message && !message.messageType) {
          message.messageType = message.message;
        }

        await message.save();
        totalFixed++;
        console.log(
          `✅ Converted old message ${message._id} (${totalFixed} total fixed)`
        );

        if (totalFixed % 20 === 0) {
          console.log(`📈 Progress: ${totalFixed} messages fixed so far`);
        }
      }
    }

    // FIX 1: Add chat field to messages that only have chatId
    console.log(
      `\n🔧 Fixing ${messagesWithChatIdOnly.length} messages with ONLY chatId...`
    );
    for (const message of messagesWithChatIdOnly) {
      if (message.chatId && !message.chat) {
        message.chat = message.chatId;
        await message.save();
        totalFixed++;
        console.log(
          `✅ Added chat field to message ${message._id} (${totalFixed} total fixed)`
        );

        // Show progress for large datasets
        if (totalFixed % 20 === 0) {
          console.log(`📈 Progress: ${totalFixed} messages fixed so far`);
        }
      }
    }

    // FIX 2: Add chatId field to messages that only have chat
    console.log(
      `\n🔧 Fixing ${messagesWithChatOnly.length} messages with ONLY chat...`
    );
    for (const message of messagesWithChatOnly) {
      if (message.chat && !message.chatId) {
        message.chatId = message.chat;
        await message.save();
        totalFixed++;
        console.log(
          `✅ Added chatId field to message ${message._id} (${totalFixed} total fixed)`
        );
      }
    }

    // FIX 3: Ensure consistency for messages with both fields
    console.log(
      `\n🔧 Ensuring consistency for ${messagesWithBoth.length} messages with BOTH fields...`
    );
    let inconsistentFixed = 0;
    for (const message of messagesWithBoth) {
      if (
        message.chat &&
        message.chatId &&
        message.chat.toString() !== message.chatId.toString()
      ) {
        // Prefer chatId as source of truth
        const originalChat = message.chat;
        message.chat = message.chatId;
        await message.save();
        totalFixed++;
        inconsistentFixed++;
        console.log(
          `✅ Fixed inconsistent message ${message._id}: ${originalChat} -> ${message.chatId} (${totalFixed} total fixed)`
        );
      }
    }

    // Handle broken messages
    console.log(
      `\n🔧 Handling ${brokenMessages.length} broken messages (no references)...`
    );
    if (brokenMessages.length > 0) {
      console.log(
        "⚠️  These messages have no chat references and need manual review:"
      );
      brokenMessages.slice(0, 5).forEach((msg, index) => {
        console.log(
          `   ${index + 1}. ${msg._id} - sender: ${
            msg.sender
          }, content: "${msg.content?.substring(0, 30)}..."`
        );
      });
      if (brokenMessages.length > 5) {
        console.log(`   ... and ${brokenMessages.length - 5} more`);
      }
    }

    console.log("\n🎉 COMPREHENSIVE MIGRATION COMPLETED!");
    console.log(`📈 Total messages fixed/updated: ${totalFixed}`);
    console.log(`📈 Inconsistent messages fixed: ${inconsistentFixed}`);
    console.log(`📊 Messages needing manual review: ${brokenMessages.length}`);

    // Final comprehensive verification
    console.log("\n🔍 Final comprehensive verification...");

    const finalTotal = await Message.countDocuments();
    const finalOldFormat = await Message.countDocuments({
      recipient: { $exists: true },
      $or: [{ chat: { $exists: false } }, { chatId: { $exists: false } }],
    });
    const finalWithChatIdOnly = await Message.countDocuments({
      chatId: { $exists: true },
      chat: { $exists: false },
    });
    const finalWithChatOnly = await Message.countDocuments({
      chat: { $exists: true },
      chatId: { $exists: false },
    });
    const finalWithBoth = await Message.countDocuments({
      chatId: { $exists: true },
      chat: { $exists: true },
    });
    const finalInconsistent = await Message.countDocuments({
      $and: [
        { chat: { $exists: true } },
        { chatId: { $exists: true } },
        { $expr: { $ne: ["$chat", "$chatId"] } },
      ],
    });
    const finalBroken = await Message.countDocuments({
      $and: [
        { recipient: { $exists: false } },
        { chat: { $exists: false } },
        { chatId: { $exists: false } },
      ],
    });

    console.log(`📊 Final verification stats:`);
    console.log(`   Total messages: ${finalTotal}`);
    console.log(`   Old format remaining: ${finalOldFormat}`);
    console.log(`   Messages with ONLY chatId: ${finalWithChatIdOnly}`);
    console.log(`   Messages with ONLY chat: ${finalWithChatOnly}`);
    console.log(`   Messages with BOTH fields: ${finalWithBoth}`);
    console.log(`   Still inconsistent: ${finalInconsistent}`);
    console.log(`   Still broken: ${finalBroken}`);

    if (
      finalOldFormat === 0 &&
      finalWithChatIdOnly === 0 &&
      finalWithChatOnly === 0 &&
      finalInconsistent === 0
    ) {
      console.log(
        "✅ PERFECT SUCCESS: All messages now have consistent chat and chatId fields!"
      );
      console.log(
        "🎉 Your messaging should now work smoothly without requiring page refresh!"
      );
    } else {
      console.log("⚠️  Partial success - some issues may remain");
      if (finalOldFormat > 0) {
        console.log(
          `   ❌ Still ${finalOldFormat} old format messages to convert`
        );
      }
      if (finalWithChatIdOnly > 0) {
        console.log(
          `   ❌ Still ${finalWithChatIdOnly} messages missing chat field`
        );
      }
      if (finalWithChatOnly > 0) {
        console.log(
          `   ❌ Still ${finalWithChatOnly} messages missing chatId field`
        );
      }
      if (finalInconsistent > 0) {
        console.log(
          `   ❌ Still ${finalInconsistent} messages with inconsistent values`
        );
      }
      if (finalBroken > 0) {
        console.log(
          `   ❌ Still ${finalBroken} broken messages needing manual review`
        );
      }
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("❌ Error details:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run the migration
migrateMessageFields();
