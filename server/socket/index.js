const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const verifyToken = require("../helpers/verifyToken");
const UserModel = require("../models/UserModel");
const {
  ConversationModel,
  MessageModel,
} = require("../models/ConversationModel");
const getConversation = require("../helpers/getConversation");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
  },
});

const rateLimiter = new RateLimiterMemory({
  points: 10, // Maximum number of requests
  duration: 1, // Per second
});

io.use(async (socket, next) => {
  try {
    await rateLimiter.consume(socket.handshake.address);
    next();
  } catch (err) {
    next(new Error("Too many requests - Please slow down"));
  }
});

const onlineUser = new Set();

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  const token = socket.handshake.auth.token;

  const user = await verifyToken(token);
  if (!user) {
    console.error("Invalid token or user not found");
    return socket.disconnect(true);
  }

  socket.join(user._id.toString());
  onlineUser.add(user._id.toString());
  io.emit("onlineUser", Array.from(onlineUser));

  socket.on("message-page", async (userId) => {
    const userDetails = await UserModel.findById(userId).select("-password");

    const payload = {
      _id: userDetails?._id,
      name: userDetails?.name,
      email: userDetails?.email,
      online: onlineUser.has(userId),
    };
    socket.emit("message-user", payload);

    const conversation = await ConversationModel.findOne({
      $or: [
        { sender: user._id, receiver: userId },
        { sender: userId, receiver: user._id },
      ],
    }).sort({ updatedAt: -1 });

    const populatedMsgs = {};
    if (conversation?.msgs) {
      for (const [userId, messageIds] of conversation?.msgs?.entries()) {
        populatedMsgs[userId] = await MessageModel.find({
          _id: { $in: messageIds },
        });
      }
    }

    socket.emit("message", populatedMsgs?.[user?._id] || []);
  });

  socket.on("new message", async (data) => {
    let conversation = await ConversationModel.findOne({
      $or: [
        { sender: data.sender, receiver: data.receiver },
        { sender: data.receiver, receiver: data.sender },
      ],
    });

    if (!conversation) {
      conversation = new ConversationModel({
        sender: data.sender,
        receiver: data.receiver,
      });
      await conversation.save();
    }

    const message = new MessageModel({
      text: data.text,
      msgByUserId: data.msgByUserId,
      replyTo: data.replyTo || null,
    });
    const savedMessage = await message.save();

    const updateMsgs = conversation.msgs || new Map();
    const senderMsgs = updateMsgs.get(data.sender) || [];
    const receiverMsgs = updateMsgs.get(data.receiver) || [];

    senderMsgs.push(savedMessage._id);
    receiverMsgs.push(savedMessage._id);

    updateMsgs.set(data.sender, senderMsgs);
    updateMsgs.set(data.receiver, receiverMsgs);

    conversation.msgs = updateMsgs;
    await conversation.save();

    const populatedMsgs = {};
    for (const [userId, messageIds] of conversation?.msgs?.entries()) {
      populatedMsgs[userId] = await MessageModel.find({
        _id: { $in: messageIds },
      });
    }

    io.to(data.receiver).emit("message", populatedMsgs[data.receiver] || []);
    io.to(data.sender).emit("message", populatedMsgs[data.sender] || []);

    const senderConversations = await getConversation(data.sender);
    const receiverConversations = await getConversation(data.receiver);

    io.to(data.sender).emit("conversation", senderConversations);
    io.to(data.receiver).emit("conversation", receiverConversations);
  });

  socket.on("sidebar", async (currentUserId) => {
    const conversation = await getConversation(currentUserId);
    socket.emit("conversation", conversation);
  });

  socket.on("seen", async (msgByUserId) => {
    const conversation = await ConversationModel.findOne({
      $or: [
        { sender: user._id, receiver: msgByUserId },
        { sender: msgByUserId, receiver: user._id },
      ],
    });

    const conversationMessageId = conversation?.msgs?.get(user._id) || [];

    await MessageModel.updateMany(
      { _id: { $in: conversationMessageId }, msgByUserId },
      { $set: { seen: true } }
    );

    const conversationSender = await getConversation(user._id.toString());
    const conversationReceiver = await getConversation(msgByUserId);

    io.to(user._id.toString()).emit("conversation", conversationSender);
    io.to(msgByUserId).emit("conversation", conversationReceiver);
  });

  socket.on("disconnect", () => {
    onlineUser.delete(user._id.toString());
    console.log("User disconnected:", socket.id);
  });
});

module.exports = {
  app,
  server,
};
