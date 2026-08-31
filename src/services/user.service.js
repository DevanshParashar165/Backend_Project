import { User } from "../models/user.model.js";
import { ProfileVisit } from "../models/profileVisit.model.js";
import { Follow } from "../models/follow.model.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/apiError.js";
import mongoose from "mongoose";

class UserService {
    static async getProfileByUsername(username, currentUserId = null) {
        const user = await User.findOne({ username: username.toLowerCase().trim() })
            .select("-password -refreshToken -emailVerifyToken -forgotPasswordToken");

        if (!user) {
            throw new ApiError(404, "Developer profile not found");
        }

        // Log profile visit if visited by someone else
        if (currentUserId && currentUserId.toString() !== user._id.toString()) {
            await ProfileVisit.create({
                visited: user._id,
                visitor: currentUserId
            });
            user.profileVisits = (user.profileVisits || 0) + 1;
            await user.save({ validateBeforeSave: false });
        }

        // Check if followed by current user
        let isFollowing = false;
        if (currentUserId) {
            const follow = await Follow.findOne({ follower: currentUserId, following: user._id });
            isFollowing = !!follow;
        }

        const followersCount = await Follow.countDocuments({ following: user._id });
        const followingCount = await Follow.countDocuments({ follower: user._id });

        return {
            ...user.toObject(),
            isFollowing,
            followersCount,
            followingCount
        };
    }

    static async updateProfile(userId, updateData) {
        const allowedUpdates = [
            "fullname", "bio", "about", "skills", "location", "currentCompany", 
            "portfolioUrl", "githubUsername", "linkedinUrl", "twitterUrl", 
            "websiteUrl", "availability", "isOpenToWork", "achievements"
        ];

        const updates = {};
        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                updates[key] = updateData[key];
            }
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(404, "Developer profile not found");
        }

        return user;
    }

    // Timeline elements updates (Education, Experience, Projects, Certifications)
    static async addTimelineItem(userId, type, item) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        if (!["experience", "education", "projects", "certifications"].includes(type)) {
            throw new ApiError(400, "Invalid profile section type");
        }

        user[type].push(item);
        await user.save({ validateBeforeSave: false });
        return user[type];
    }

    static async deleteTimelineItem(userId, type, itemId) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        if (!["experience", "education", "projects", "certifications"].includes(type)) {
            throw new ApiError(400, "Invalid profile section type");
        }

        user[type] = user[type].filter(item => item._id.toString() !== itemId);
        await user.save({ validateBeforeSave: false });
        return user[type];
    }

    // Recommendation logic for developer connections
    static async getSuggestedDevelopers(userId, limit = 5) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        // Find users already followed
        const follows = await Follow.find({ follower: userId }).select("following");
        const followedIds = follows.map(f => f.following);

        // Suggested: Users with matching skills or same location, excluding self and already followed
        const suggestions = await User.find({
            _id: { $nin: [userId, ...followedIds] },
            $or: [
                { skills: { $in: user.skills } },
                { location: user.location }
            ]
        })
        .select("fullname username avatar bio skills location currentCompany isOpenToWork")
        .limit(limit);

        // Fallback: If not enough suggestions, pull general active developers
        if (suggestions.length < limit) {
            const extraCount = limit - suggestions.length;
            const extraSuggestions = await User.find({
                _id: { $nin: [userId, ...followedIds, ...suggestions.map(s => s._id)] }
            })
            .select("fullname username avatar bio skills location currentCompany isOpenToWork")
            .limit(extraCount);

            suggestions.push(...extraSuggestions);
        }

        return suggestions;
    }

    // Analytics Dashboard service
    static async getDashboardAnalytics(userId) {
        // Post stats
        const posts = await Post.find({ author: userId });
        const postIds = posts.map(p => p._id);

        const totalPosts = posts.length;
        const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

        // Profile stats
        const user = await User.findById(userId);
        const totalProfileVisits = user.profileVisits || 0;

        // Followers growth log (aggregated by date in the last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const followerGrowth = await Follow.aggregate([
            {
                $match: {
                    following: new mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Profile visits log in last 7 days
        const visitsGrowth = await ProfileVisit.aggregate([
            {
                $match: {
                    visited: new mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Most popular posts (sorted by views or engagement)
        const popularPosts = await Post.find({ author: userId })
            .sort({ views: -1 })
            .limit(3);

        return {
            totalPosts,
            totalViews,
            totalProfileVisits,
            followerGrowth,
            visitsGrowth,
            popularPosts
        };
    }
}

export { UserService };
