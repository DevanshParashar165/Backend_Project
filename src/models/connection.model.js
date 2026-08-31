import mongoose, { Schema } from "mongoose";

const connectionSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, {
    timestamps: true
});

connectionSchema.index({ sender: 1, receiver: 1 }, { unique: true });

export const Connection = mongoose.model("Connection", connectionSchema);
