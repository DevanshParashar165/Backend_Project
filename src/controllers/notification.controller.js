import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { NotificationService } from "../services/notification.service.js";

const getNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");

    const result = await NotificationService.getNotifications(req.user._id, { page, limit });

    return res.status(200).json(
        new ApiResponse(200, result, "Notifications retrieved successfully")
    );
});

const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params; // notificationId
    const result = await NotificationService.markAsRead(req.user._id, id);

    return res.status(200).json(
        new ApiResponse(200, result, "Notification marked as read")
    );
});

const markAllAsRead = asyncHandler(async (req, res) => {
    const result = await NotificationService.markAllAsRead(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, result, "All notifications marked as read")
    );
});

export {
    getNotifications,
    markAsRead,
    markAllAsRead
};
