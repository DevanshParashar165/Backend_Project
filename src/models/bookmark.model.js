import mongoose, { Schema } from "mongoose";

const bookmarkSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    }
}, {
    timestamps: true
});

bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
