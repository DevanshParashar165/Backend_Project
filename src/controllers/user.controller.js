import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { UserService } from "../services/user.service.js";
import { GitHubService } from "../services/github.service.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudnary.js";

const getProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const currentUserId = req.user?._id || null;

    if (!username) {
        throw new ApiError(400, "Username parameter is required");
    }

    const profile = await UserService.getProfileByUsername(username, currentUserId);
    return res.status(200).json(
        new ApiResponse(200, profile, "Developer profile retrieved successfully")
    );
});

const updateProfile = asyncHandler(async (req, res) => {
    const updatedProfile = await UserService.updateProfile(req.user._id, req.body);
    return res.status(200).json(
        new ApiResponse(200, updatedProfile, "Developer profile updated successfully")
    );
});

const addTimelineItem = asyncHandler(async (req, res) => {
    const { type } = req.params; // e.g. experience, education, projects, certifications
    const items = await UserService.addTimelineItem(req.user._id, type, req.body);

    return res.status(201).json(
        new ApiResponse(201, items, `${type} item added successfully`)
    );
});

const deleteTimelineItem = asyncHandler(async (req, res) => {
    const { type, itemId } = req.params;
    const items = await UserService.deleteTimelineItem(req.user._id, type, itemId);

    return res.status(200).json(
        new ApiResponse(200, items, `${type} item deleted successfully`)
    );
});

const getSuggestions = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit || "5");
    const suggestions = await UserService.getSuggestedDevelopers(req.user._id, limit);

    return res.status(200).json(
        new ApiResponse(200, suggestions, "Suggested developers retrieved successfully")
    );
});

const getAnalytics = asyncHandler(async (req, res) => {
    const analytics = await UserService.getDashboardAnalytics(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, analytics, "Dashboard analytics retrieved successfully")
    );
});

const getGitHubRepos = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
        throw new ApiError(400, "GitHub username is required");
    }

    const repos = await GitHubService.getPinnedRepositories(username);
    return res.status(200).json(
        new ApiResponse(200, repos, "GitHub repositories retrieved successfully")
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error uploading avatar to Cloudinary");
    }

    // Delete old avatar if present
    if (req.user.avatar?.public_id) {
        await deleteFromCloudinary(req.user.avatar.public_id);
    }

    req.user.avatar = {
        url: avatar.url,
        public_id: avatar.public_id
    };
    await req.user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, req.user.avatar, "Avatar updated successfully")
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path;
    if (!coverLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const cover = await uploadOnCloudinary(coverLocalPath);
    if (!cover.url) {
        throw new ApiError(400, "Error uploading cover to Cloudinary");
    }

    // Delete old cover if present
    if (req.user.coverImage?.public_id) {
        await deleteFromCloudinary(req.user.coverImage.public_id);
    }

    req.user.coverImage = {
        url: cover.url,
        public_id: cover.public_id
    };
    await req.user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, req.user.coverImage, "Cover image updated successfully")
    );
});

const uploadResume = asyncHandler(async (req, res) => {
    const resumeLocalPath = req.file?.path;
    if (!resumeLocalPath) {
        throw new ApiError(400, "Resume file is missing");
    }

    // Upload PDF to cloudinary
    const uploadedFile = await uploadOnCloudinary(resumeLocalPath);
    if (!uploadedFile.url) {
        throw new ApiError(400, "Error uploading resume to Cloudinary");
    }

    // Clean old resume on Cloudinary
    if (req.user.resume?.public_id) {
        await deleteFromCloudinary(req.user.resume.public_id);
    }

    req.user.resume = {
        url: uploadedFile.url,
        public_id: uploadedFile.public_id
    };
    await req.user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, req.user.resume, "Resume uploaded successfully")
    );
});

export {
    getProfile,
    updateProfile,
    addTimelineItem,
    deleteTimelineItem,
    getSuggestions,
    getAnalytics,
    getGitHubRepos,
    updateAvatar,
    updateCoverImage,
    uploadResume
};