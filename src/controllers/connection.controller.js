import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { ConnectionService } from "../services/connection.service.js";
import { NotificationService } from "../services/notification.service.js";
import { sendRealTimeEvent } from "../socket.js";

const toggleFollow = asyncHandler(async (req, res) => {
    const { id } = req.params; // followingId
    const result = await ConnectionService.toggleFollow(req.user._id, id);

    if (result.isFollowing) {
        const notif = await NotificationService.createNotification({
            receiver: id,
            sender: req.user._id,
            type: "follow"
        });
        if (notif) {
            sendRealTimeEvent(id, "new_notification", notif);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, result, result.message)
    );
});

const sendConnectionRequest = asyncHandler(async (req, res) => {
    const { id } = req.params; // receiverId
    const request = await ConnectionService.sendConnectionRequest(req.user._id, id);

    const notif = await NotificationService.createNotification({
        receiver: id,
        sender: req.user._id,
        type: "connection_request"
    });
    if (notif) {
        sendRealTimeEvent(id, "new_notification", notif);
    }

    return res.status(201).json(
        new ApiResponse(201, request, "Connection request sent successfully")
    );
});

const acceptConnectionRequest = asyncHandler(async (req, res) => {
    const { id } = req.params; // requestId
    const request = await ConnectionService.acceptConnectionRequest(req.user._id, id);

    const notif = await NotificationService.createNotification({
        receiver: request.sender,
        sender: req.user._id,
        type: "connection_accept"
    });
    if (notif) {
        sendRealTimeEvent(request.sender, "new_notification", notif);
    }

    return res.status(200).json(
        new ApiResponse(200, request, "Connection request accepted successfully")
    );
});

const rejectConnectionRequest = asyncHandler(async (req, res) => {
    const { id } = req.params; // requestId
    const request = await ConnectionService.rejectConnectionRequest(req.user._id, id);

    return res.status(200).json(
        new ApiResponse(200, request, "Connection request rejected successfully")
    );
});

const getConnectionsList = asyncHandler(async (req, res) => {
    const connections = await ConnectionService.getConnectionsList(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, connections, "Connections retrieved successfully")
    );
});

const getPendingRequests = asyncHandler(async (req, res) => {
    const requests = await ConnectionService.getPendingRequests(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, requests, "Pending requests retrieved successfully")
    );
});

const getFollowers = asyncHandler(async (req, res) => {
    const followers = await ConnectionService.getFollowers(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, followers, "Followers list retrieved successfully")
    );
});

const getFollowing = asyncHandler(async (req, res) => {
    const following = await ConnectionService.getFollowing(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, following, "Following list retrieved successfully")
    );
});

const getConnectionState = asyncHandler(async (req, res) => {
    const { id } = req.params; // receiverId
    const state = await ConnectionService.getConnectionState(req.user._id, id);

    return res.status(200).json(
        new ApiResponse(200, state, "Connection state retrieved successfully")
    );
});

export {
    toggleFollow,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    getConnectionsList,
    getPendingRequests,
    getFollowers,
    getFollowing,
    getConnectionState
};
