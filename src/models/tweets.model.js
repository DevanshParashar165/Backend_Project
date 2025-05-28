import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true,
        unique: true,
        trim: true
    },
    content : {
        type : String
    }
},{timestamps : true})

export const Tweet = mongoose.model("Tweet",tweetSchema)
