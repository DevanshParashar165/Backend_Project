import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudnary.js";
import { getVideoDurationInSeconds } from "../utils/duration.js";
import path from "path";
import fs from "fs";



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy="createdAt", sortType="desc", userId } = req.query

    const filters = {};

    if(query){
        filters.$or = [
            {title : {$regex : query , $options : 'i'}},
            {description :{$regex : query , $options : 'i'} }
        ]
    }

    if (userId) {
    filters.owner = userId;
}

    const sortOptions = {};

    sortOptions[sortBy] = sortType === 'asc'?1:-1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const videos = await Video.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Video.countDocuments(filters);
    
     return res.status(200).json(
        new ApiResponse(200,{total,
        page: parseInt(page),
        limit: parseInt(limit),
        videos},
    "Videos fetched Successfully")
     );
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    console.log("publishAVideo route hit");
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);

    let { title, description } = req.body;

    if (!title) {
        throw new ApiError(400, "Title of video is required");
    }

    if (!description) {
        description = `Created on ${new Date().toLocaleString()}`;
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Both video file and thumbnail are required");
    }

    // Use absolute paths for ffmpeg/ffprobe
    const absoluteVideoPath = path.resolve(videoLocalPath);
    const absoluteThumbnailPath = path.resolve(thumbnailLocalPath);

    // Check if video exists before processing
    if (!fs.existsSync(absoluteVideoPath)) {
        throw new ApiError(404, "Uploaded video file not found on server");
    }

    // Get duration from video
    const videoDuration = await getVideoDurationInSeconds(absoluteVideoPath);
    if (!videoDuration) {
        throw new ApiError(500, "Failed to get video duration");
    }

    // Upload to Cloudinary
    const videoFile = await uploadOnCloudinary(absoluteVideoPath);
    const thumbnailFile = await uploadOnCloudinary(absoluteThumbnailPath);

    if (!videoFile || !thumbnailFile) {
        throw new ApiError(500, "Cloudinary upload failed");
    }

    const owner = req.user?._id

    if(!owner){
        throw new ApiError(401, "User not authenticated");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url,
        isPublished: true,
        views: 0,
        duration: videoDuration,
        owner
    });

    return res.status(200).json(
        new ApiResponse(200, video, "Video uploaded successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"Video ID not found")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
    }

    const video = await Video.findById(videoId)
    //TODO: get video by id
    if(!video){
        throw new ApiError(404,"Video not Found")
    }

    console.log(video)

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video Found !!!")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title , description} = req.body
    console.log("Video Id : ",videoId)
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);
    if(!videoId){
        throw new ApiError(400,"Video ID not found")
    }

    if (!(mongoose.Types.ObjectId.isValid(videoId))) {
        throw new ApiError(400, "Invalid video ID format");
    }

    if(!title){
        throw new ApiError(400,"Title is required!!!")
    }

    if(!description){
        throw new ApiError(400,"Title is required!!!")
    }

    const thumbnailLocalPath = req.file?.path
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail not Found")
    }

    const video = await Video.findById(videoId)

    if(video.thumbnail){
        await deleteFromCloudinary(video.thumbnail)
    }
    
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnailFile?.url){
        throw new ApiError(400,"Error while uploading thumbnail!!!")
    }

    const updatedDetails = await Video.findByIdAndUpdate(videoId ,
        {
            $set : {
                title,
                description,
                thumbnail : thumbnailFile.url
            }
        },
        {new : true}
    )
        
    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedDetails,"Success while updating Details")
    )
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"Video ID not found!!!")
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video not Found!!!")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }
    
    if(video.videoFile){
    await deleteFromCloudinary(video.videoFile)
    }
    
    if(video.thumbnail){
        await deleteFromCloudinary(video.thumbnail)
    }
    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video Deleted Successfully!!!")
    )
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid or missing video ID");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished

    await video.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,`video is ${video.isPublished? "Published" : "Unpublished"} ` )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}