import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Migration function to set the 'type' field to 'direct'
 * for all chat documents that currently lack a 'type' field
 * but have a non-empty list of 'participants'.
 */
async function migrateChatType() {
  const connectionUrl = process.env.DATABASE_URL;

  if (!connectionUrl) {
    console.error(
      "❌ DATABASE_URL is not set in environment variables. Please check your .env file."
    );
    process.exit(1);
  }

  try {
    console.log("🚀 Starting chat type migration...");

    // 1. Connect to your database
    await mongoose.connect(connectionUrl);
    console.log("✅ Connected to MongoDB");

    // 2. Get the chats collection
    const db = mongoose.connection.db;
    const chatsCollection = db.collection("chats");

    // 3. Define the filter and update operation
    const filter = {
      // Find documents where participants exists and is not an empty array
      participants: { $exists: true, $ne: [] },
      // And the 'type' field does not exist
      type: { $exists: false },
    };

    const updateOperation = {
      // Set the 'type' field to 'direct'
      $set: { type: "direct" },
    };

    // 4. Run the update operation
    const result = await chatsCollection.updateMany(filter, updateOperation);

    // 5. Log results
    console.log("🎉 Migration completed:");
    console.log(`   - Matched ${result.matchedCount} documents`);
    console.log(`   - Modified ${result.modifiedCount} documents`);

    // 6. Verification (optional but recommended)
    const remainingUntypedChats = await chatsCollection.countDocuments(filter);
    console.log(
      `   - Chats still needing migration (should be 0): ${remainingUntypedChats}`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    // 7. Clean up
    if (mongoose.connection.readyState === 1) {
      // Check if connection is open
      await mongoose.connection.close();
      console.log("🔌 Disconnected from MongoDB");
    }
    process.exit(0);
  }
}

// Run the migration
migrateChatType();
