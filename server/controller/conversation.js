const { ConversationModel } = require("../models/ConversationModel");

async function deleteConversation(request, response) {
  const { sender, receiver } = request.body;

  if (!sender || !receiver) {
    return response.status(400).json({
      msg: "Sender and receiver must be provided",
      error: true,
    });
  }

  try {
    const conversation = await ConversationModel.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    });

    if (!conversation) {
      return response.status(404).json({
        msg: "Conversation does not exist",
        error: true,
      });
    }

    const updateMsgs = conversation.msgs;

    updateMsgs.delete(sender);

    conversation.msgs = updateMsgs;
    await conversation.save();

    return response.status(200).json({
      msg: "Conversation deleted successfully",
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      msg: error.message || "An error occurred",
      error: true,
    });
  }
}

async function deleteMsg(request, response) {
  const { sender, receiver, msgId } = request.body;

  if (!msgId) {
    return response.status(400).json({
      msg: "message must be provided",
      error: true,
    });
  }

  try {
    const conversation = await ConversationModel.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    });

    if (!conversation) {
      return response.status(404).json({
        msg: "Conversation does not exist",
        error: true,
      });
    }

    const userMsgs = conversation.msgs?.get(sender.toString()) || [];

    const updatedMsgs = userMsgs.filter(
      (id) => id.toString() !== msgId.toString()
    );

    conversation.msgs.set(sender, updatedMsgs);
    await conversation.save();

    return response.status(200).json({
      msg: "Message deleted successfully",
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      msg: error.message || "An error occurred",
      error: true,
    });
  }
}

module.exports = { deleteConversation, deleteMsg };
