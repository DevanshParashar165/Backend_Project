import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"Video Id not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
            throw new ApiError(400,"Video User ID")
    }
    const userId = req.user?._id
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })
    if(existingLike){
        await existingLike.deleteOne()
        return res
        .status(200)
        .json(
            new ApiResponse(200,"Video Disliked Successfully")
        )
    }else{
        const like = await Like.create({
            video: videoId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,{like},"Video Liked Successfully")
        )
    }
    // //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400,"Comment Id not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(commentId)){
            throw new ApiError(400,"Comment User ID")
    }
    const userId = req.user?._id
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })
    if(existingLike){
        await existingLike.deleteOne()
        return res
        .status(200)
        .json(
            new ApiResponse(200,"Comment Disliked Successfully")
        )
    }else{
        const like = await Like.create({
            comment: commentId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,{like},"Comment Liked Successfully")
        )
    }
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400,"Tweet Id not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(tweetId)){
            throw new ApiError(400,"Tweet User ID")
    }
    const userId = req.user?._id
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })
    if(existingLike){
        await existingLike.deleteOne()
        return res
        .status(200)
        .json(
            new ApiResponse(200,"Tweet Disliked Successfully")
        )
    }else{
        const like = await Like.create({
            tweet: tweetId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,{like},"Tweet Liked Successfully")
        )
    }
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const user = req.user?._id

    if(!user){
        throw new ApiError(400,"User not Found!!!")
    }

    const likedVideosRaw = await Like.find({
    likedBy: user,
    video: { $exists: true }
   })
   .populate("video", "name description videoFile")
   .lean();

   const videos = likedVideosRaw.filter(like => like.video !== null)

    return res
    .status(200)
    .json(
        new ApiResponse(200,{videos},"Videos fetched successfully")
    )
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}