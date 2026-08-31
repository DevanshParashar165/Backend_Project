import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { ChatService } from "../services/chat.service.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { sendConversationEvent } from "../socket.js";

const getOrCreateConversation = asyncHandler(async (req, res) => {
    const { receiverId } = req.body;
    if (!receiverId) {
        throw new ApiError(400, "Receiver ID is required");
    }

    const conversation = await ChatService.getOrCreateConversation(req.user._id, receiverId);

    return res.status(200).json(
        new ApiResponse(200, conversation, "Conversation loaded successfully")
    );
});

const getConversationsList = asyncHandler(async (req, res) => {
    const list = await ChatService.getConversationsList(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, list, "Conversations retrieved successfully")
    );
});

const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;

    let file = null;
    if (req.file) {
        const uploaded = await uploadOnCloudinary(req.file.path);
        let fileType = "raw";
        if (req.file.mimetype.startsWith("image/")) {
            fileType = "image";
        } else if (req.file.mimetype === "application/pdf") {
            fileType = "pdf";
        }
        file = {
            url: uploaded.url,
            public_id: uploaded.public_id,
            fileType
        };
    }

    if (!content && !file) {
        throw new ApiError(400, "Cannot send empty message");
    }

    const message = await ChatService.sendMessage(req.user._id, conversationId, { content, file });

    // Emit socket event to the conversation room
    sendConversationEvent(conversationId, "new_message", message);

    return res.status(201).json(
        new ApiResponse(201, message, "Message sent successfully")
    );
});

const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "50");

    const messages = await ChatService.getMessages(req.user._id, conversationId, { page, limit });

    return res.status(200).json(
        new ApiResponse(200, messages, "Messages retrieved successfully")
    );
});

const markAsSeen = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const result = await ChatService.markConversationAsSeen(req.user._id, conversationId);

    return res.status(200).json(
        new ApiResponse(200, result, "Conversation marked as seen")
    );
});

export {
    getOrCreateConversation,
    getConversationsList,
    sendMessage,
    getMessages,
    markAsSeen
};
