const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    text: { type: String, default: "" },
    seen: { type: Boolean, default: false },
    msgByUserId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    replyTo: {
      type: mongoose.Schema.ObjectId,
      default: null,
      ref: "Message",
    },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    msgs: {
      type: Map,
      of: [mongoose.Schema.ObjectId],
      default: {},
    },
  },
  { timestamps: true }
);

const MessageModel = mongoose.model("Message", messageSchema);
const ConversationModel = mongoose.model("Conversation", conversationSchema);

module.exports = { MessageModel, ConversationModel };
