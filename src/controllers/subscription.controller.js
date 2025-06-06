import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400,"Channel ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400,"Invalid Channel ID")
    }
     
    const subscriberId = req.user?._id
    if(!subscriberId){
        throw new ApiError(400,"User Account not found")
    }
    if(subscriberId.toString()===channelId){
        throw new ApiError(400,"Cannot subscribe to self account")
    }

    let Subscribe;

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });
    
    let subscribed;
    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id);
        subscribed = false;
    } else {
        Subscribe = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        })
        subscribed = true;
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,{ subscribed },
        subscribed ? "Subscribed successfully" : "Unsubscribed successfully")
    )
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400,"Channel ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400,"Invalid Channel ID")
    }
    const channelSubscriber = await Subscription.find({channel : channelId})
                                                .populate("subscriber","fullname username avatar")
                                                .lean()
    return res
    .status(200)
    .json(
        new ApiResponse(200,{channelSubscriber},"User Channel Subscriber Fetched Successfully")
    )                                             
})       

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId || !mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "Invalid or missing subscriber ID");
    }
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "fullname username avatar coverImage") // only fetch these fields
        .lean();
    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}