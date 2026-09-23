import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { AuthService } from "../services/auth.service.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { parseUserAgent } from "../utils/userAgentParser.js";
import { Session } from "../models/session.model.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/"
};

const register = asyncHandler(async (req, res) => {
    const { username, email, fullname, password } = req.body;

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image file is required");
    }

    // Upload files to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(502, "Avatar image upload failed. Please try again.");
    }

    let coverImage = null;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!coverImage) {
            throw new ApiError(502, "Cover image upload failed. Please try again.");
        }
    }

    const createdUser = await AuthService.registerUser({
        username,
        email,
        fullname,
        password,
        avatar: {
            url: avatar.url,
            public_id: avatar.public_id
        },
        coverImage: coverImage ? {
            url: coverImage.url,
            public_id: coverImage.public_id
        } : undefined
    });

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully. Verification email sent.")
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) {
        throw new ApiError(400, "Verification token is required");
    }

    const result = await AuthService.verifyEmail(token);
    return res.status(200).json(
        new ApiResponse(200, result, "Email verified successfully")
    );
});

const login = asyncHandler(async (req, res) => {
    const { emailOrUsername, password } = req.body;
    const userAgent = req.header("User-Agent") || "";
    const ip = req.ip || req.headers["x-forwarded-for"] || "";
    const parserResult = parseUserAgent(userAgent);

    const { user, accessToken, refreshToken } = await AuthService.loginUser({
        emailOrUsername,
        password,
        userAgent,
        ip,
        parserResult
    });

    const refreshCookieOptions = {
        ...cookieOptions,
        maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days matching expiry
    };

    const accessCookieOptions = {
        ...cookieOptions,
        maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
    };

    return res.status(200)
        .cookie("accessToken", accessToken, accessCookieOptions)
        .cookie("refreshToken", refreshToken, refreshCookieOptions)
        .json(
            new ApiResponse(200, { user, accessToken, refreshToken }, "User logged in successfully")
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const userAgent = req.header("User-Agent") || "";
    const ip = req.ip || req.headers["x-forwarded-for"] || "";
    const parserResult = parseUserAgent(userAgent);

    const { accessToken, refreshToken } = await AuthService.refreshUserSession(
        incomingRefreshToken,
        userAgent,
        ip,
        parserResult
    );

    const refreshCookieOptions = {
        ...cookieOptions,
        maxAge: 10 * 24 * 60 * 60 * 1000
    };

    const accessCookieOptions = {
        ...cookieOptions,
        maxAge: 1 * 24 * 60 * 60 * 1000
    };

    return res.status(200)
        .cookie("accessToken", accessToken, accessCookieOptions)
        .cookie("refreshToken", refreshToken, refreshCookieOptions)
        .json(
            new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed successfully")
        );
});

const logout = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    await AuthService.logoutSession(incomingRefreshToken);

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(200, {}, "Logged out successfully")
        );
});

const logoutAll = asyncHandler(async (req, res) => {
    await AuthService.logoutAllSessions(req.user._id);

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(200, {}, "Logged out from all devices successfully")
        );
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const result = await AuthService.changePassword(req.user._id, oldPassword, newPassword);

    return res.status(200).json(
        new ApiResponse(200, result, "Password changed successfully")
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const result = await AuthService.forgotPassword(email);
    return res.status(200).json(
        new ApiResponse(200, result, "Reset link sent successfully")
    );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        throw new ApiError(400, "Token and new password are required");
    }

    const result = await AuthService.resetPassword(token, newPassword);
    return res.status(200).json(
        new ApiResponse(200, result, "Password reset successfully")
    );
});

const getActiveSessions = asyncHandler(async (req, res) => {
    const sessions = await Session.find({ user: req.user._id, isActive: true })
        .sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, sessions, "Active sessions retrieved successfully")
    );
});

const revokeSession = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const session = await Session.findOneAndUpdate(
        { _id: id, user: req.user._id, isActive: true },
        { isActive: false },
        { new: true }
    );

    if (!session) {
        throw new ApiError(404, "Session not found or already inactive");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Session revoked successfully")
    );
});

const deleteAccount = asyncHandler(async (req, res) => {
    const result = await AuthService.deleteUserAccount(req.user._id);

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(200, result, "Account deleted successfully")
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current user retrieved successfully")
    );
});

export {
    register,
    verifyEmail,
    login,
    refreshAccessToken,
    logout,
    logoutAll,
    changePassword,
    forgotPassword,
    resetPassword,
    getActiveSessions,
    revokeSession,
    deleteAccount,
    getCurrentUser
};
