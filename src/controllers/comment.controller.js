import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10,query} = req.query
    if(!videoId){
        throw new ApiError(400,"Video Id not found")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid Video Id")
    }
    const filters = {}
     if (query) {
        filters.$or = [
            { content: { $regex: query, $options: 'i' } }
        ];
    }

    filters.video = videoId

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comment = await Comment.find(filters)
                                 .skip(skip)
                                 .limit(parseInt(limit));

    const total = await Comment.countDocuments(filters);
        
    return res
    .status(200)
    .json(
        new ApiResponse(200,{total,
            page: parseInt(page),
            limit: parseInt(limit),
            comment},
        "Comment fetched Successfully")
         );                             
})

const addComment = asyncHandler(async (req, res) => {
    const {content} = req.body;
    if(!content){
        throw ApiError(400,"Comment not found!!!")
    }
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"Video Id not found")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

    const owner = req.user?._id
    
    if(!owner){
        throw new ApiError(400,"Owner not found!!!!")
    }
    
    const comment = await Comment.create({
        owner,
        video : videoId,
        content
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"Comment added successfully")
    )
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
     if(!commentId){
        throw new ApiError(400,"Comment Id not Found!!!")
    }
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid Comment Id")
    }
    const {content} = req.body;
    if(!content){
        throw new ApiError(400,"Content not found")
    }
    const comment = await Comment.findByIdAndUpdate(commentId,
        {
            $set : {
                content
            }
        },
        {new : true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"Comment Updated Successfully!!!")
    )
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400,"Comment Id not Found!!!")
    }
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid Comment Id")
    }
    const comment = await Comment.findByIdAndDelete(commentId);
    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"Comment deleted Successfully!!!")
    )
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }