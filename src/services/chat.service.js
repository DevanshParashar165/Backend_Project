import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/apiError.js";

class ChatService {
    static async getOrCreateConversation(senderId, receiverId) {
        // Find existing conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        return conversation;
    }

    static async getConversationsList(userId) {
        const conversations = await Conversation.find({
            participants: userId
        })
        .populate("participants", "fullname username avatar bio currentCompany availability")
        .populate({
            path: "lastMessage",
            populate: { path: "sender", select: "username avatar" }
        })
        .sort({ updatedAt: -1 });

        // Compute unseen counts for each conversation
        const mappedList = await Promise.all(conversations.map(async (conv) => {
            const unseenCount = await Message.countDocuments({
                conversation: conv._id,
                sender: { $ne: userId },
                seenBy: { $ne: userId }
            });

            return {
                ...conv.toObject(),
                unseenCount
            };
        }));

        return mappedList;
    }

    static async sendMessage(senderId, conversationId, { content, file }) {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) throw new ApiError(404, "Conversation not found");

        if (!conversation.participants.some(p => p.toString() === senderId.toString())) {
            throw new ApiError(403, "You are not a participant in this conversation");
        }

        const messageData = {
            conversation: conversationId,
            sender: senderId,
            content,
            seenBy: [senderId]
        };

        if (file && file.url) {
            messageData.file = file;
        }

        const message = await Message.create(messageData);

        conversation.lastMessage = message._id;
        await conversation.save();

        return await Message.findById(message._id)
            .populate("sender", "fullname username avatar");
    }

    static async getMessages(senderId, conversationId, { page = 1, limit = 50 }) {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) throw new ApiError(404, "Conversation not found");

        if (!conversation.participants.some(p => p.toString() === senderId.toString())) {
            throw new ApiError(403, "You are not authorized to view messages");
        }

        const skip = (page - 1) * limit;

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "fullname username avatar")
            .sort({ createdAt: -1 }) // Get newest first, frontend will reverse it
            .skip(skip)
            .limit(limit);

        return messages.reverse();
    }

    static async markConversationAsSeen(userId, conversationId) {
        // Add userId to seenBy array for all messages in this conversation where user hasn't seen yet
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: userId },
                seenBy: { $ne: userId }
            },
            {
                $push: { seenBy: userId }
            }
        );

        return { success: true };
    }
}

export { ChatService };
