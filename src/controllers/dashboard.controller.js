import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const user = req.user?._id

    const subscribers = await Subscription.countDocuments({
        channel : user
    })

    const videos = await Video.countDocuments({
        owner : user
    })

    const likes = await Like.countDocuments({
        video : user
    })

    const result = await Video.aggregate([
        {
            $match : {owner : user}
        },
        {
            $group : {
                _id : null,
                totalViews : {$sum : "$views"}
            }
        }
    ])

    const totalViews = result[0]?.totalViews || 0;

    return res
    .status(200)
    .json(
        new ApiResponse(200,{videos,subscribers,likes,totalViews},"Dashboard Data Fetched Successfully!!!")
    )
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const user = req.user?._id

    if(!user){
        throw new ApiError(400,"User not Found!!!")
    }

    const video = await Video.find({
        owner : user
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,{video},"All videos of Channel are fetched Successfully")
    )
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }