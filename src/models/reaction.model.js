import mongoose, { Schema } from "mongoose";

const reactionSchema = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["Like", "Love", "Celebrate", "Insightful", "Funny"],
        required: true
    }
}, {
    timestamps: true
});

reactionSchema.index({ post: 1, user: 1 }, { unique: true });

export const Reaction = mongoose.model("Reaction", reactionSchema);
