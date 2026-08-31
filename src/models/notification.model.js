import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["follow", "like", "comment", "reply", "mention", "connection_request", "connection_accept"],
        required: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: "Post"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Notification = mongoose.model("Notification", notificationSchema);
