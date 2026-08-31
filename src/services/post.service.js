import { Post } from "../models/post.model.js";
import { Reaction } from "../models/reaction.model.js";
import { Bookmark } from "../models/bookmark.model.js";
import { Follow } from "../models/follow.model.js";
import { ApiError } from "../utils/apiError.js";

class PostService {
    static async createPost(userId, { content, images, codeSnippet, poll, tags, category, status, scheduledAt }) {
        const postData = {
            author: userId,
            content,
            images: images || [],
            codeSnippet: codeSnippet || { code: "", language: "" },
            tags: tags || [],
            category: category || "General",
            status: status || "published"
        };

        if (poll && poll.question && poll.options && poll.options.length > 0) {
            postData.poll = {
                question: poll.question,
                options: poll.options.map(opt => ({ optionText: opt, votes: [] })),
                expiresAt: poll.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
            };
        }

        if (status === "scheduled" && scheduledAt) {
            postData.scheduledAt = scheduledAt;
        }

        const post = await Post.create(postData);
        return await Post.findById(post._id).populate("author", "fullname username avatar");
    }

    static async getPostFeed(userId, { page = 1, limit = 10, tag, category, authorId, searchQuery, type }) {
        const query = { status: "published" };

        if (tag) {
            query.tags = tag;
        }
        if (category) {
            query.category = category;
        }
        if (authorId) {
            query.author = authorId;
        }
        if (searchQuery) {
            query.$text = { $search: searchQuery };
        }

        // Special feed types, e.g. "following"
        if (type === "following" && userId) {
            const follows = await Follow.find({ follower: userId }).select("following");
            const followingIds = follows.map(f => f.following);
            query.author = { $in: [...followingIds, userId] }; // Show following users + own posts
        }

        // For Bookmarked posts
        if (type === "bookmarks" && userId) {
            const bookmarks = await Bookmark.find({ user: userId }).select("post");
            const bookmarkedPostIds = bookmarks.map(b => b.post);
            query._id = { $in: bookmarkedPostIds };
        }

        const skip = (page - 1) * limit;

        const posts = await Post.find(query)
            .populate("author", "fullname username avatar bio currentCompany availability isOpenToWork")
            .sort(searchQuery ? { score: { $meta: "textScore" } } : { createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments(query);

        // Map posts to include reactions counts, current user's reaction, bookmarks status
        const postsWithMeta = await Promise.all(posts.map(async (post) => {
            const totalViews = post.views || 0;
            // Increments view on read
            post.views = totalViews + 1;
            await post.save({ validateBeforeSave: false });

            // Count Reactions
            const reactions = await Reaction.find({ post: post._id });
            const reactionCounts = { Like: 0, Love: 0, Celebrate: 0, Insightful: 0, Funny: 0 };
            let userReaction = null;

            reactions.forEach(r => {
                if (reactionCounts[r.type] !== undefined) {
                    reactionCounts[r.type]++;
                }
                if (userId && r.user.toString() === userId.toString()) {
                    userReaction = r.type;
                }
            });

            // Check if Bookmarked
            let isBookmarked = false;
            if (userId) {
                const bookmark = await Bookmark.findOne({ user: userId, post: post._id });
                isBookmarked = !!bookmark;
            }

            return {
                ...post.toObject(),
                reactionCounts,
                userReaction,
                isBookmarked
            };
        }));

        return {
            posts: postsWithMeta,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalPosts: total
        };
    }

    static async updatePost(userId, postId, updateData) {
        const post = await Post.findById(postId);
        if (!post) throw new ApiError(404, "Post not found");

        if (post.author.toString() !== userId.toString()) {
            throw new ApiError(403, "You do not have permission to edit this post");
        }

        // Push to edit history
        post.editHistory.push({
            content: post.content,
            editedAt: Date.now()
        });

        post.content = updateData.content || post.content;
        post.codeSnippet = updateData.codeSnippet || post.codeSnippet;
        post.tags = updateData.tags || post.tags;
        post.category = updateData.category || post.category;
        
        if (updateData.status) {
            post.status = updateData.status;
            if (updateData.status === "scheduled" && updateData.scheduledAt) {
                post.scheduledAt = updateData.scheduledAt;
            }
        }

        await post.save();
        return await Post.findById(post._id).populate("author", "fullname username avatar");
    }

    static async deletePost(userId, postId) {
        const post = await Post.findById(postId);
        if (!post) throw new ApiError(404, "Post not found");

        if (post.author.toString() !== userId.toString()) {
            throw new ApiError(403, "You do not have permission to delete this post");
        }

        await Post.findByIdAndDelete(postId);
        // Clean up bookmarks and reactions
        await Bookmark.deleteMany({ post: postId });
        await Reaction.deleteMany({ post: postId });

        return { message: "Post deleted successfully" };
    }

    static async toggleReaction(userId, postId, type) {
        if (!["Like", "Love", "Celebrate", "Insightful", "Funny"].includes(type)) {
            throw new ApiError(400, "Invalid reaction type");
        }

        const existingReaction = await Reaction.findOne({ post: postId, user: userId });

        if (existingReaction) {
            if (existingReaction.type === type) {
                // Remove reaction if clicked twice (toggle off)
                await Reaction.findByIdAndDelete(existingReaction._id);
                return { reaction: null, action: "removed" };
            } else {
                // Change reaction type
                existingReaction.type = type;
                await existingReaction.save();
                return { reaction: existingReaction, action: "updated" };
            }
        } else {
            // Add new reaction
            const reaction = await Reaction.create({
                post: postId,
                user: userId,
                type
            });
            return { reaction, action: "added" };
        }
    }

    static async toggleBookmark(userId, postId) {
        const existingBookmark = await Bookmark.findOne({ user: userId, post: postId });

        if (existingBookmark) {
            await Bookmark.findByIdAndDelete(existingBookmark._id);
            return { isBookmarked: false, message: "Bookmark removed" };
        } else {
            await Bookmark.create({ user: userId, post: postId });
            return { isBookmarked: true, message: "Bookmark added" };
        }
    }

    static async voteInPoll(userId, postId, optionId) {
        const post = await Post.findById(postId);
        if (!post) throw new ApiError(404, "Post not found");
        if (!post.poll || !post.poll.question) {
            throw new ApiError(400, "Post is not a poll");
        }

        if (post.poll.expiresAt && post.poll.expiresAt < new Date()) {
            throw new ApiError(400, "Poll has expired");
        }

        // Check if user already voted in this poll
        let alreadyVoted = false;
        post.poll.options.forEach(opt => {
            if (opt.votes.some(v => v.toString() === userId.toString())) {
                alreadyVoted = true;
            }
        });

        if (alreadyVoted) {
            throw new ApiError(400, "You have already voted in this poll");
        }

        // Add vote
        const option = post.poll.options.id(optionId);
        if (!option) throw new ApiError(404, "Poll option not found");

        option.votes.push(userId);
        await post.save();

        return await Post.findById(postId).populate("author", "fullname username avatar");
    }
}

export { PostService };
