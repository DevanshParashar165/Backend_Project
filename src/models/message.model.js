import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
    conversation: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        default: ""
    },
    file: {
        url: String,
        public_id: String,
        fileType: String // e.g. "image", "pdf", "raw"
    },
    seenBy: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, {
    timestamps: true
});

export const Message = mongoose.model("Message", messageSchema);
