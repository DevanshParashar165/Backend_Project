import { Notification } from "../models/notification.model.js";

class NotificationService {
    static async createNotification({ receiver, sender, type, post, comment }) {
        // Avoid self-notification
        if (receiver.toString() === sender.toString()) return null;

        const notification = await Notification.create({
            receiver,
            sender,
            type,
            post,
            comment,
            isRead: false
        });

        return await Notification.findById(notification._id)
            .populate("sender", "fullname username avatar");
    }

    static async getNotifications(receiverId, { page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ receiver: receiverId })
            .populate("sender", "fullname username avatar")
            .populate({
                path: "post",
                select: "content"
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const unreadCount = await Notification.countDocuments({
            receiver: receiverId,
            isRead: false
        });

        return {
            notifications,
            unreadCount
        };
    }

    static async markAsRead(receiverId, notificationId) {
        await Notification.findOneAndUpdate(
            { _id: notificationId, receiver: receiverId },
            { isRead: true }
        );
        return { success: true };
    }

    static async markAllAsRead(receiverId) {
        await Notification.updateMany(
            { receiver: receiverId, isRead: false },
            { isRead: true }
        );
        return { success: true };
    }
}

export { NotificationService };
