const {
  ConversationModel,
  MessageModel,
} = require("../models/ConversationModel");

const getConversation = async (currentUserId) => {
  if (currentUserId) {
    const currentUserConversation = await ConversationModel.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ updatedAt: -1 })
      .populate("msgs")
      .populate("sender")
      .populate("receiver");

    const conversation = await Promise.all(
      currentUserConversation
        .filter((conv) =>
          Array.from(conv.msgs.keys()).includes(currentUserId.toString())
        )
        .map(async (conv) => {
          const countUnseenMsg = conv?.msgs
            ?.get(currentUserId.toString())
            ?.reduce((prev, curr) => {
              const msgByUserId = curr?.msgByUserId?.toString();

              if (msgByUserId !== currentUserId) {
                return prev + (curr?.seen ? 0 : 1);
              } else {
                return prev;
              }
            }, 0);

          const lastMsgId = conv.msgs
            .get(currentUserId.toString())
            ?.[
              conv?.msgs?.get(currentUserId.toString())?.length - 1
            ]?.toString();

          const lastMsg = lastMsgId
            ? await MessageModel.findById(lastMsgId).populate("text")
            : null;

          return {
            _id: conv?._id,
            sender: conv?.sender,
            receiver: conv?.receiver,
            unseenMsg: countUnseenMsg,
            lastMsg: lastMsg?.text || null,
          };
        })
    );

    return conversation;
  } else {
    return [];
  }
};

module.exports = getConversation;
