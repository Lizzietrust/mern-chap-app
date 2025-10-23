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

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],

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
messageSchema.index({ readBy: 1 }); 
messageSchema.index({ status: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
