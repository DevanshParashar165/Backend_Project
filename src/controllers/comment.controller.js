import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

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