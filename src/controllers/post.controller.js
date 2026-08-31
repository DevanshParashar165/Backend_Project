import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { PostService } from "../services/post.service.js";
import { NotificationService } from "../services/notification.service.js";
import { sendRealTimeEvent } from "../socket.js";
import { Post } from "../models/post.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";

const createPost = asyncHandler(async (req, res) => {
    const { content, codeSnippet, poll, tags, category, status, scheduledAt } = req.body;
    
    // Support multiple images upload
    let images = [];
    if (req.files && req.files.images) {
        const uploadPromises = req.files.images.map(async (file) => {
            const uploaded = await uploadOnCloudinary(file.path);
            return {
                url: uploaded.url,
                public_id: uploaded.public_id
            };
        });
        images = await Promise.all(uploadPromises);
    }

    const post = await PostService.createPost(req.user._id, {
        content,
        images,
        codeSnippet: codeSnippet ? JSON.parse(codeSnippet) : undefined,
        poll: poll ? JSON.parse(poll) : undefined,
        tags: tags ? JSON.parse(tags) : undefined,
        category,
        status,
        scheduledAt
    });

    return res.status(201).json(
        new ApiResponse(201, post, "Post created successfully")
    );
});

const getPostFeed = asyncHandler(async (req, res) => {
    const { page, limit, tag, category, authorId, searchQuery, type } = req.query;
    const userId = req.user?._id || null;

    const feed = await PostService.getPostFeed(userId, {
        page,
        limit,
        tag,
        category,
        authorId,
        searchQuery,
        type
    });

    return res.status(200).json(
        new ApiResponse(200, feed, "Post feed retrieved successfully")
    );
});

const updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedPost = await PostService.updatePost(req.user._id, id, req.body);

    return res.status(200).json(
        new ApiResponse(200, updatedPost, "Post updated successfully")
    );
});

const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await PostService.deletePost(req.user._id, id);

    return res.status(200).json(
        new ApiResponse(200, result, "Post deleted successfully")
    );
});

const toggleReaction = asyncHandler(async (req, res) => {
    const { id } = req.params; // postId
    const { type } = req.body;

    const result = await PostService.toggleReaction(req.user._id, id, type);

    if (result.action === "added" || result.action === "updated") {
        const post = await Post.findById(id);
        if (post && post.author.toString() !== req.user._id.toString()) {
            const notif = await NotificationService.createNotification({
                receiver: post.author,
                sender: req.user._id,
                type: "like",
                post: post._id
            });
            if (notif) {
                sendRealTimeEvent(post.author, "new_notification", notif);
            }
        }
    }

    return res.status(200).json(
        new ApiResponse(200, result, "Reaction updated successfully")
    );
});

const toggleBookmark = asyncHandler(async (req, res) => {
    const { id } = req.params; // postId
    const result = await PostService.toggleBookmark(req.user._id, id);

    return res.status(200).json(
        new ApiResponse(200, result, result.message)
    );
});

const voteInPoll = asyncHandler(async (req, res) => {
    const { id } = req.params; // postId
    const { optionId } = req.body;

    if (!optionId) {
        throw new ApiError(400, "Option ID is required to vote");
    }

    const post = await PostService.voteInPoll(req.user._id, id, optionId);
    return res.status(200).json(
        new ApiResponse(200, post, "Vote registered successfully")
    );
});

export {
    createPost,
    getPostFeed,
    updatePost,
    deletePost,
    toggleReaction,
    toggleBookmark,
    voteInPoll
};
