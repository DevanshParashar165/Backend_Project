import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRccessToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something ent wrong while generating refresh and access token, Error : ", error)
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
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    //remove passord and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    //check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }
    //return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //req body ->data
    const { username, email, password } = req.body
    if (!username || !email) {
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

    return res.status(200).cookie("accessToken : ",accessToken,options).cookie("refreshToken : ",refreshToken,options).json(
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
        $set : {refreshToken : undefined}
    })
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200).clearCookie("accessToken",options),clearCookie("refreshToken",options).json(
        new ApiResponse(200,{},"User logged Out")
    )
})

export { registerUser, loginUser,logoutUser }