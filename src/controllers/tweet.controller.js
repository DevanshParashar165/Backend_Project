import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { populate } from "dotenv"

const createTweet = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    if(!owner){
        throw new ApiError(400,"User not Found!!!");
    }
    const {content} = req.body;
    if(!content){
        throw new ApiError(400,"Content not available")
    }
    const tweet = Tweet.create({
        owner,
        content
    })

    return res
    .status(200)
    .json(
       new ApiResponse(200,tweet,"Tweet Created Successfully")
    )
    //TODO: create tweet
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!userId){
        throw new ApiError(400,"Invalid User")
    }
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(200,"Invalid User Id ")
    }
    
    const tweets = await Tweet.find({owner : userId})
                              .sort({createdAt : 1})
                              .populate("owner", "username avatar") 
                              .lean();

    if(!tweets||tweets.length===0){
        return res.status(404).json(
            new ApiResponse(404,tweets,"No tweet found from the user")
        );
    }   
    return res
    .json(
        new ApiResponse(200,tweets,"Tweets fetched successfully!!!")
    )                       
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body
    if(!content){
        throw new ApiError(400,"Invalid Content")
    }
    const tweet = await Tweet.findByIdAndUpdate(tweetId,{
        $set : {
            content
        }
    },
    {new : true}
)
    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet Updated Successfully!!!")
    )
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400,"Tweet Id not found")
    }
    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400,"Invalid Tweet Id !!!")
    }
    const tweet = await Tweet.findByIdAndDelete(tweetId)
    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet Deleted Successfully")
    )
    //TODO: delete tweet
})

const getAllTweet = asyncHandler(async(req,res)=>{
    const tweets = await Tweet.find()
                              .populate({ path: 'owner', select: 'username avatar' })
                              .sort({ createdAt: -1 });

    if(!tweets){
        throw new ApiError(400,"Tweets not Found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweets,"Tweets fetched Successfully!!!")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweet
}