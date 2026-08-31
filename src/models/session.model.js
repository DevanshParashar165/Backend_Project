import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tokenHash: {
        type: String,
        required: true
    },
    userAgent: {
        type: String
    },
    ip: {
        type: String
    },
    deviceType: {
        type: String,
        enum: ["mobile", "tablet", "desktop", "unknown"],
        default: "unknown"
    },
    browser: {
        type: String
    },
    os: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const Session = mongoose.model("Session", sessionSchema);
