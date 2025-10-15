import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function migrateUnreadCount() {
  try {
    console.log("🚀 Starting unreadCount migration...");

    // Connect to your database - UPDATE WITH YOUR DATABASE NAME
    await mongoose.connect(
      process.env.DATABASE_URL
    );
    console.log("✅ Connected to MongoDB");

    // Get the chats collection
    const db = mongoose.connection.db;
    const chatsCollection = db.collection("chats");

    // Run the migration
    const result = await chatsCollection.updateMany(
      { "unreadCount.0": { $exists: true } },
      [
        {
          $set: {
            unreadCount: {
              $arrayToObject: {
                $map: {
                  input: "$unreadCount",
                  as: "item",
                  in: {
                    k: { $toString: "$$item.user" },
                    v: "$$item.count",
                  },
                },
              },
            },
          },
        },
      ]
    );

    console.log("🎉 Migration completed:");
    console.log(`   - Matched ${result.matchedCount} documents`);
    console.log(`   - Modified ${result.modifiedCount} documents`);

    // Verify the migration
    const remainingArrayCount = await chatsCollection.countDocuments({
      "unreadCount.0": { $exists: true },
    });
    console.log(
      `   - Chats still with array structure: ${remainingArrayCount}`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0); // Exit the script
  }
}

// Run the migration
migrateUnreadCount();
