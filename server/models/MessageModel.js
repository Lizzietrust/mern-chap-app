import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: false,
    },

    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: false,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: false,
    },
    message: {
      type: String,
      required: false,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "system"],
      required: true,
      default: "text",
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
    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    deletedAt: Date,
    deletedForSender: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.virtual("effectiveChat").get(function () {
  return this.chat || this.chatId || this.recipient;
});

messageSchema.index({ content: "text" });

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ chatId: 1, createdAt: -1 }); 
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ readBy: 1 });
messageSchema.index({ status: 1 });

messageSchema.pre("save", function (next) {
  if (this.recipient && !this.chat && !this.chatId) {
    this.chat = this.recipient;
    this.chatId = this.recipient;
  }

  if (this.message && !this.messageType) {
    this.messageType = this.message;
  }

  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
