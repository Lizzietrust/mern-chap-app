import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return this.messageType === "text";
      },
    },
    fileUrl: {
      type: String,
      required: function () {
        return this.messageType === "image" || this.messageType === "file";
      },
    },
    fileName: {
      type: String,
      required: function () {
        return this.messageType === "file";
      },
    },
    fileSize: {
      type: Number,
      required: function () {
        return this.messageType === "file";
      },
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    // CORRECTED: Simple array of user IDs for readBy
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],

    // OPTIONAL: If you want to track read timestamps separately
    readReceipts: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ readBy: 1 }); // Add this for readBy queries

const Message = mongoose.model("Message", messageSchema);

export default Message;
