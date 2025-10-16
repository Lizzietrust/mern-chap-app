import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "channel"],
      required: true,
      default: "direct",
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: function () {
          return this.type === "direct";
        },
      },
    ],

    name: {
      type: String,
      required: function () {
        return this.type === "channel";
      },
    },
    description: {
      type: String,
      default: "",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: function () {
        return this.type === "channel";
      },
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: function () {
          return this.type === "channel";
        },
      },
    ],

    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },

    unreadCount: {
      type: Map,
      of: {
        type: Number,
        default: 0,
        min: 0,
      },
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1 });
chatSchema.index({ members: 1 });
chatSchema.index({ updatedAt: -1 });

chatSchema.virtual("memberCount").get(function () {
  if (this.type === "direct") {
    return this.participants?.length || 0;
  } else {
    return this.members?.length || 0;
  }
});

chatSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    if (ret.unreadCount && ret.unreadCount instanceof Map) {
      ret.unreadCount = Object.fromEntries(ret.unreadCount);
    }
    return ret;
  },
});

chatSchema.pre("save", function (next) {
  if (this.type === "direct" && this.participants.length < 2) {
    next(new Error("A direct chat must have at least 2 participants"));
  } else if (
    this.type === "channel" &&
    (!this.members || this.members.length === 0)
  ) {
    next(new Error("A channel must have at least one member"));
  } else {
    next();
  }
});

chatSchema.methods.incrementUnreadCount = function (userId) {
  if (!this.unreadCount) {
    this.unreadCount = new Map();
  }
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  return this.save();
};

chatSchema.methods.resetUnreadCount = function (userId) {
  if (this.unreadCount) {
    this.unreadCount.set(userId.toString(), 0);
    return this.save();
  }
  return Promise.resolve(this);
};

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
