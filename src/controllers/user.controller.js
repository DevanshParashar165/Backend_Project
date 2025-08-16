import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, `Something went wrong while generating refresh and access token, Error : ${error.message}`)
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    const { username, fullname, email, password } = req.body
    // console.log("Email : ", email, "Password :", password)
    //validation - not empty;
    if (
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    //check if user already exists : username,email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }
    //check for images ,check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //Upload them to cloudinary,avatar
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    //create user object-create entry in db
    const user = await User.create({
        fullname,
        avatar: {
            public_id: avatar.public_id,
            url: avatar.url
        },
        coverImage: {
            public_id: coverImage.public_id,
            url: coverImage.url
        },
        email,
        password,
        username: username.toLowerCase()
    })
    //remove passord and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdUser._id);
    //check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    const options = {
        httpOnly : true,
        secure : true
    }

    //return response
    return res.status(201)
              .cookie("accessToken",accessToken,options)
              .cookie("refreshToken",refreshToken,options)
              .json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //req body ->data
    const { username, email, password } = req.body
    console.log((username || email)," : Login successfully!!!!!")
    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }


    //check for username or email in database
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    //find the user
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }
    //password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials")
    }
    //access and refresh token

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //send cookies

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .cookie("username",loggedInUser.username)
    .json(
        new ApiResponse(200,{
            user : loggedInUser,
            accessToken,
            refreshToken,
            message : "User logged In successfully"

        })
    )

})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $unset : {refreshToken : 1}//this removes the fields from document
    })
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .clearCookie("username")
    .json(
        new ApiResponse(200,{},"User logged Out")
    )
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
   try {
     const incomingRefreshToken = req.cookies.refreshToken ||req.body.refreshToken
     if(!incomingRefreshToken){
         throw new ApiError(401,"Unauthorized request ")
     }
     const decodedToken = jwt.verify(
         incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
     )
     const user = await User.findById(decodedToken?._id)
     console.log(user);
 
     if(!user){
         throw new ApiError(401,"Invalid refreshToken")
     }
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh Token is expired or used")
     }
 
     const options = {
         httpOnly : true,
         secure : true
     }
     
     const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
 
     return res.status(200).cookie("accessToken",accessToken,options).cookie("RefreshToken",refreshToken,options).json(
         new ApiResponse(200,{accessToken,refreshToken},"Access Token refreshed Successfully !!!!")
     )
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid Refresh Token")
   }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave : false})
    
    return res
    .status(200)
    .json( new ApiResponse(200,{},"Password changed Successfully!!!"))
})
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse (200,req.user,"Current User fetched Successfully!!!"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body
    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname,
                email
            }
        },
        {new : true}
     ).select("-password")
     return res.status(200)
     .json(new ApiResponse(200,user,"Account details updated successfully!!!"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }
    
    const user = await User.findById(req.user?._id)
    if(user.avatar){
        await deleteFromCloudinary(user.avatar)
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar")
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {avatar : avatar.url}
        },
        {
            new : true
        }
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,updatedUser,"Avatar updated successfully!!!"))
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing");
    }

    const user = await User.findById(req.user?._id)
    if(user.coverImage){
        await deleteFromCloudinary(user.coverImage)
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover Image")
    }
    //TODO : delete old images 
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {coverImage : coverImage.url}
        },
        {
            new : true
        }
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,updatedUser,"Cover Image updated successfully!!!"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} =  req.params
    if(!username?.trim()){
        throw new ApiError(400,"Username is Missing")
    }
    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
             $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "channel",
            as : "subscribers"
        }
        },{
            $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "subscriber",
            as : "subscribedTo"
            }
        },{
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id,"$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },{
            $project : {
                fullname : 1,
                username : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"Channel does not exist!!!")
    }
    console.log(channel)
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User Channel fetched successfully!!!")
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
     const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
     ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"Warch History Fetched Successfully!!!")
    )
})

export { registerUser, loginUser,logoutUser,changeCurrentPassword,getCurrentUser,updateAccountDetails,refreshAccessToken,updateCoverImage,updateUserAvatar,getUserChannelProfile,getWatchHistory}