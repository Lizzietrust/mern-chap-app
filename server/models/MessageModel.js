import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: false,
    },
    message: {
      type: String,
      enum: ["text", "image", "file"],
      required: true,
    },
    content: {
      type: String,
      required: function() {
        return this.message === "text";
      }
    },
    fileUrl: {
      type: String,
      required: function() {
        return this.message === "image" || this.message === "file";
      }
    },
    timestamps: {
      type: Date,
      default: Date.now,
    },
  }
);

const Message = mongoose.model("Messages", messageSchema);

export default Message;
