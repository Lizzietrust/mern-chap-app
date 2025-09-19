import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    // Add chatId to link messages to chats
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    // Track read status
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Track message status
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Index for better query performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
