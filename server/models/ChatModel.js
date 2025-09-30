import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    }],
    messages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    }],
    // For group chats
    name: {
      type: String,
      required: function() {
        return this.participants.length > 2;
      },
    },
    // Group chat settings
    isGroup: {
      type: Boolean,
      default: function() {
        return this.participants.length > 2;
      },
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: function() {
        return this.isGroup;
      },
    },
    // Last message info for chat list
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
    // Unread message counts per user
    unreadCount: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      count: {
        type: Number,
        default: 0,
      },
    }],
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Indexes for better performance
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

// Ensure participants array has at least 2 users
chatSchema.pre('save', function(next) {
  if (this.participants.length < 2) {
    next(new Error('A chat must have at least 2 participants'));
  } else {
    next();
  }
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;