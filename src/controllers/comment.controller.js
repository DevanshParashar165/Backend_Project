import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { NotificationService } from "../services/notification.service.js";
import { sendRealTimeEvent } from "../socket.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 10, parentCommentId = null } = req.query;

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    const filters = {
        post: postId,
        parentComment: parentCommentId === "null" || !parentCommentId ? null : parentCommentId
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find(filters)
        .populate("owner", "fullname username avatar bio currentCompany availability isOpenToWork")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Comment.countDocuments(filters);

    const commentsWithMeta = comments.map(comment => {
        const isLiked = comment.likes.some(id => id.toString() === req.user?._id?.toString());
        return {
            ...comment.toObject(),
            likesCount: comment.likes.length,
            isLiked
        };
    });

    return res.status(200).json(
        new ApiResponse(200, {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            comments: commentsWithMeta
        }, "Comments retrieved successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { content, parentComment, mentions } = req.body;
    const { postId } = req.params;

    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    const comment = await Comment.create({
        content,
        post: postId,
        owner: req.user._id,
        parentComment: parentComment || null,
        mentions: mentions || []
    });

    const populatedComment = await Comment.findById(comment._id)
        .populate("owner", "fullname username avatar bio currentCompany availability isOpenToWork");

    // Notifications
    const postObj = await Post.findById(postId);
    if (postObj) {
        // Notification to Post Author
        if (postObj.author.toString() !== req.user._id.toString()) {
            const notif = await NotificationService.createNotification({
                receiver: postObj.author,
                sender: req.user._id,
                type: parentComment ? "reply" : "comment",
                post: postObj._id,
                comment: comment._id
            });
            if (notif) {
                sendRealTimeEvent(postObj.author, "new_notification", notif);
            }
        }

        // Notification to Parent Comment Owner
        if (parentComment) {
            const parentCommentObj = await Comment.findById(parentComment);
            if (
                parentCommentObj && 
                parentCommentObj.owner.toString() !== req.user._id.toString() &&
                parentCommentObj.owner.toString() !== postObj.author.toString()
            ) {
                const replyNotif = await NotificationService.createNotification({
                    receiver: parentCommentObj.owner,
                    sender: req.user._id,
                    type: "reply",
                    post: postId,
                    comment: comment._id
                });
                if (replyNotif) {
                    sendRealTimeEvent(parentCommentObj.owner, "new_notification", replyNotif);
                }
            }
        }

        // Notifications to Mentioned Users
        if (mentions && mentions.length > 0) {
            for (const mentionUserId of mentions) {
                if (
                    mentionUserId.toString() !== req.user._id.toString() && 
                    mentionUserId.toString() !== postObj.author.toString()
                ) {
                    const mentionNotif = await NotificationService.createNotification({
                        receiver: mentionUserId,
                        sender: req.user._id,
                        type: "mention",
                        post: postId,
                        comment: comment._id
                    });
                    if (mentionNotif) {
                        sendRealTimeEvent(mentionUserId, "new_notification", mentionNotif);
                    }
                }
            }
        }
    }

    return res.status(201).json(
        new ApiResponse(201, populatedComment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this comment");
    }

    comment.content = content;
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
        .populate("owner", "fullname username avatar bio currentCompany");

    return res.status(200).json(
        new ApiResponse(200, populatedComment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);
    await Comment.deleteMany({ parentComment: commentId });

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

const toggleLikeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const isLiked = comment.likes.includes(req.user._id);

    if (isLiked) {
        comment.likes = comment.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
        comment.likes.push(req.user._id);
    }

    await comment.save();
    return res.status(200).json(
        new ApiResponse(200, { likesCount: comment.likes.length, isLiked: !isLiked }, "Likes toggled")
    );
});

const togglePinComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.populate(await Comment.findById(commentId), { path: "post" });

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.post.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the post author can pin comments");
    }

    if (!comment.isPinned) {
        await Comment.updateMany({ post: comment.post._id, isPinned: true }, { isPinned: false });
    }

    comment.isPinned = !comment.isPinned;
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, { isPinned: comment.isPinned }, comment.isPinned ? "Comment pinned" : "Comment unpinned")
    );
});

export {
    getPostComments,
    addComment,
    updateComment,
    deleteComment,
    toggleLikeComment,
    togglePinComment
};