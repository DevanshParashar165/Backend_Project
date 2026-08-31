import mongoose, { Schema } from "mongoose";

const profileVisitSchema = new Schema({
    visited: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    visitor: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

// To optimize search by date
profileVisitSchema.index({ visited: 1, createdAt: -1 });

export const ProfileVisit = mongoose.model("ProfileVisit", profileVisitSchema);
