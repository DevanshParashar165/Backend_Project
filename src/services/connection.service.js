import { Connection } from "../models/connection.model.js";
import { Follow } from "../models/follow.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

class ConnectionService {
    static async toggleFollow(followerId, followingId) {
        if (followerId.toString() === followingId.toString()) {
            throw new ApiError(400, "You cannot follow yourself");
        }

        const existingFollow = await Follow.findOne({ follower: followerId, following: followingId });

        if (existingFollow) {
            await Follow.findByIdAndDelete(existingFollow._id);
            return { isFollowing: false, message: "Unfollowed successfully" };
        } else {
            await Follow.create({ follower: followerId, following: followingId });
            return { isFollowing: true, message: "Followed successfully" };
        }
    }

    static async sendConnectionRequest(senderId, receiverId) {
        if (senderId.toString() === receiverId.toString()) {
            throw new ApiError(400, "You cannot connect with yourself");
        }

        // Check if there is an existing request or connection
        const existingConnection = await Connection.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (existingConnection) {
            if (existingConnection.status === "accepted") {
                throw new ApiError(400, "You are already connected");
            } else if (existingConnection.status === "pending") {
                throw new ApiError(400, "Connection request is already pending");
            } else {
                // If rejected previously, allow re-sending by updating
                existingConnection.sender = senderId;
                existingConnection.receiver = receiverId;
                existingConnection.status = "pending";
                await existingConnection.save();
                return existingConnection;
            }
        }

        const newRequest = await Connection.create({
            sender: senderId,
            receiver: receiverId,
            status: "pending"
        });

        return newRequest;
    }

    static async acceptConnectionRequest(receiverId, requestId) {
        const request = await Connection.findById(requestId);
        
        if (!request) {
            throw new ApiError(404, "Connection request not found");
        }

        if (request.receiver.toString() !== receiverId.toString()) {
            throw new ApiError(403, "You do not have permission to accept this request");
        }

        request.status = "accepted";
        await request.save();

        // Establish mutual follows automatically when connected
        await Follow.findOneAndUpdate(
            { follower: request.sender, following: request.receiver },
            {},
            { upsert: true }
        );
        await Follow.findOneAndUpdate(
            { follower: request.receiver, following: request.sender },
            {},
            { upsert: true }
        );

        return request;
    }

    static async rejectConnectionRequest(receiverId, requestId) {
        const request = await Connection.findById(requestId);

        if (!request) {
            throw new ApiError(404, "Connection request not found");
        }

        if (request.receiver.toString() !== receiverId.toString()) {
            throw new ApiError(403, "You do not have permission to reject this request");
        }

        request.status = "rejected";
        await request.save();

        return request;
    }

    static async getConnectionsList(userId) {
        const connections = await Connection.find({
            status: "accepted",
            $or: [{ sender: userId }, { receiver: userId }]
        }).populate("sender receiver", "fullname username avatar bio currentCompany availability isOpenToWork");

        // Map and filter out the current user
        return connections.map(conn => {
            const partner = conn.sender._id.toString() === userId.toString() ? conn.receiver : conn.sender;
            return partner;
        });
    }

    static async getPendingRequests(userId) {
        return await Connection.find({
            receiver: userId,
            status: "pending"
        }).populate("sender", "fullname username avatar bio currentCompany");
    }

    static async getFollowers(userId) {
        const follows = await Follow.find({ following: userId }).populate("follower", "fullname username avatar bio currentCompany");
        return follows.map(f => f.follower);
    }

    static async getFollowing(userId) {
        const follows = await Follow.find({ follower: userId }).populate("following", "fullname username avatar bio currentCompany");
        return follows.map(f => f.following);
    }

    static async getConnectionState(senderId, receiverId) {
        if (senderId.toString() === receiverId.toString()) {
            return { state: "self" };
        }

        const connection = await Connection.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        const follow = await Follow.findOne({ follower: senderId, following: receiverId });

        return {
            status: connection ? connection.status : "none",
            isSender: connection ? connection.sender.toString() === senderId.toString() : false,
            requestId: connection ? connection._id : null,
            isFollowing: !!follow
        };
    }
}

export { ConnectionService };
