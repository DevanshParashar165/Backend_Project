import mongoose, { Schema } from "mongoose";

const postSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true
    },
    images: [
        {
            url: String,
            public_id: String
        }
    ],
    codeSnippet: {
        code: { type: String, default: "" },
        language: { type: String, default: "" }
    },
    poll: {
        question: { type: String, default: "" },
        options: [
            {
                optionText: String,
                votes: [
                    {
                        type: Schema.Types.ObjectId,
                        ref: "User"
                    }
                ]
            }
        ],
        expiresAt: Date
    },
    tags: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        default: "General"
    },
    status: {
        type: String,
        enum: ["draft", "published", "scheduled"],
        default: "published"
    },
    scheduledAt: {
        type: Date
    },
    editHistory: [
        {
            content: String,
            editedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexing for search performance
postSchema.index({ content: "text", tags: "text" });
postSchema.index({ author: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);
