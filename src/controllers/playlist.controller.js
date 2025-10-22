import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name){
        throw new ApiError(400,"Name of the Playlist not found")
    }
    if(!description){
        throw new ApiError(400,"Description of playlist not found")
    }
    const owner = req.user?._id
    if(!owner){
        throw new ApiError(400,"Owner not found")
    }
    const videos = []
    const user = req.user?._id
    const playlist = await Playlist.create({
        name,
        description,
        videos,
        owner
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,{playlist},"Playlist created Successfully")
    )
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user._id
    if(!userId){
        throw new ApiError(400,"User ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400,"Invalid User ID")
    }
    const playlist = await Playlist.find({
        owner : userId
    })
    if(!playlist){
        throw new ApiError(400,"Playlist Not Found!!!")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,{playlist},"Playlist fetched successfully")
    )
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Playlist ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid Playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,{playlist},"Playlist Found")
    )
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Playlist ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid Playlist ID")
    }
    if(!videoId){
        throw new ApiError(400,"Video ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid Video ID")
    }
    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {$push : {videos : videoId}},
        {new : true}
    )
    if(!playlist){
        throw new ApiError(400,"Playlist not Found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,{playlist},"Video Added Successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Playlist ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid Playlist ID")
    }
    if(!videoId){
        throw new ApiError(400,"Video ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid Video ID")
    }
    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {$pull : {videos : videoId}},
        {new : true}
    )
    if(!playlist){
        throw new ApiError(400,"Playlist not Found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,{playlist},"Video Removed Successfully")
    )
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Playlist ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid Playlist ID")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,{playlistId},"Playlist Deleted Successfully!!!")
    )
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!playlistId){
        throw new ApiError(400,"Playlist ID not Found")
    }
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid Playlist ID")
    }
    if(!name){
        throw ApiError(400,"Api name not Found!!!")
    }
    if(!description){
        description = ""
    }
    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {$set : {name : name, description : description}},
        {new : true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,{playlist},"Playlist Updated Successfully!!!")
    )
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}