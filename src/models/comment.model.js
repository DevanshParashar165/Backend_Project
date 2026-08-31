import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    parentComment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },
    likes: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    isPinned: {
        type: Boolean,
        default: false
    },
    mentions: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, { timestamps: true })

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)