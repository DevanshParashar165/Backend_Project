import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";
import { ApiError } from "../utils/apiError.js";
import { sendEmail } from "../utils/email.service.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Helper to hash token for session comparison
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

class AuthService {
    static async registerUser({ username, email, fullname, password, avatar }) {
        // Validate duplicates
        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists");
        }

        // Generate email verification details
        const emailVerifyToken = crypto.randomBytes(32).toString("hex");
        const emailVerifyTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create User
        const user = await User.create({
            username: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
            fullname,
            password,
            avatar,
            isEmailVerified: false,
            emailVerifyToken,
            emailVerifyTokenExpiry
        });

        const createdUser = await User.findById(user._id).select("-password -emailVerifyToken -forgotPasswordToken");

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        // Send email
        const verificationLink = `${process.env.CORS_ORIGIN || "http://localhost:5173"}/verify-email?token=${emailVerifyToken}`;
        await sendEmail({
            to: user.email,
            subject: "Verify your DevConnect Account",
            text: `Please verify your account using this link: ${verificationLink}`,
            html: `<h3>Welcome to DevConnect!</h3><p>Please verify your account by clicking the button below:</p><a href="${verificationLink}" style="display:inline-block;padding:10px 20px;background-color:#6366f1;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a>`
        });

        return createdUser;
    }

    static async verifyEmail(token) {
        const user = await User.findOne({
            emailVerifyToken: token,
            emailVerifyTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            throw new ApiError(400, "Verification token is invalid or has expired");
        }

        user.isEmailVerified = true;
        user.emailVerifyToken = undefined;
        user.emailVerifyTokenExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        return { message: "Email verified successfully" };
    }

    static async loginUser({ emailOrUsername, password, userAgent, ip, parserResult }) {
        const query = emailOrUsername.includes("@") 
            ? { email: emailOrUsername.toLowerCase().trim() }
            : { username: emailOrUsername.toLowerCase().trim() };

        const user = await User.findOne(query);

        if (!user) {
            throw new ApiError(404, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }

        // Generate Tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save current refresh token in database (for backwards compatibility/easy access)
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Save Session
        const tokenHash = hashToken(refreshToken);
        const deviceType = parserResult?.device?.type || "desktop";
        const browser = parserResult?.browser?.name || "unknown";
        const os = parserResult?.os?.name || "unknown";

        await Session.create({
            user: user._id,
            tokenHash,
            userAgent,
            ip,
            deviceType,
            browser,
            os,
            isActive: true
        });

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        return {
            user: loggedInUser,
            accessToken,
            refreshToken
        };
    }

    static async refreshUserSession(incomingRefreshToken, userAgent, ip, parserResult) {
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Refresh token is missing");
        }

        // Verify incoming token
        let decoded;
        try {
            decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (error) {
            throw new ApiError(401, "Invalid or expired refresh token");
        }

        const oldTokenHash = hashToken(incomingRefreshToken);
        
        // Find existing session
        const session = await Session.findOne({ tokenHash: oldTokenHash, isActive: true });
        if (!session) {
            // Token Reuse Detection / Revocation
            // If the token is valid but no active session exists, someone is reusing an old/stolen token!
            // Forcefully revoke all sessions for this user for security
            await Session.updateMany({ user: decoded._id }, { isActive: false });
            throw new ApiError(403, "Compromised session. Revoked all device logins.");
        }

        const user = await User.findById(decoded._id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Generate New Tokens (Rotation)
        const newAccessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        // Rotate Session token hash
        session.tokenHash = hashToken(newRefreshToken);
        session.lastActive = Date.now();
        session.ip = ip;
        session.userAgent = userAgent;
        await session.save();

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }

    static async logoutSession(refreshToken) {
        if (!refreshToken) return;

        const tokenHash = hashToken(refreshToken);
        
        // Invalidate current session
        await Session.findOneAndUpdate({ tokenHash }, { isActive: false });
        
        // Clear user refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            if (decoded) {
                const user = await User.findById(decoded._id);
                if (user) {
                    user.refreshToken = undefined;
                    await user.save({ validateBeforeSave: false });
                }
            }
        } catch {}
    }

    static async logoutAllSessions(userId) {
        await Session.updateMany({ user: userId }, { isActive: false });
        const user = await User.findById(userId);
        if (user) {
            user.refreshToken = undefined;
            await user.save({ validateBeforeSave: false });
        }
    }

    static async forgotPassword(email) {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            throw new ApiError(404, "User with this email does not exist");
        }

        const forgotPasswordToken = crypto.randomBytes(32).toString("hex");
        const forgotPasswordTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 mins

        user.forgotPasswordToken = forgotPasswordToken;
        user.forgotPasswordTokenExpiry = forgotPasswordTokenExpiry;
        await user.save({ validateBeforeSave: false });

        const resetLink = `${process.env.CORS_ORIGIN || "http://localhost:5173"}/reset-password?token=${forgotPasswordToken}`;
        await sendEmail({
            to: user.email,
            subject: "Reset your DevConnect Password",
            text: `Reset your password using this link: ${resetLink}`,
            html: `<h3>DevConnect Password Reset</h3><p>Click the button below to reset your password. This link expires in 15 minutes:</p><a href="${resetLink}" style="display:inline-block;padding:10px 20px;background-color:#ef4444;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>`
        });

        return { message: "Password reset link sent to your email" };
    }

    static async resetPassword(token, newPassword) {
        const user = await User.findOne({
            forgotPasswordToken: token,
            forgotPasswordTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            throw new ApiError(400, "Reset token is invalid or has expired");
        }

        user.password = newPassword;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpiry = undefined;
        // Invalidate all active sessions for security when password is reset
        await Session.updateMany({ user: user._id }, { isActive: false });
        await user.save();

        return { message: "Password reset successfully. Please log in with your new password." };
    }

    static async changePassword(userId, oldPassword, newPassword) {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const isCorrect = await user.isPasswordCorrect(oldPassword);
        if (!isCorrect) {
            throw new ApiError(400, "Incorrect old password");
        }

        user.password = newPassword;
        // Keep current session, invalidate others
        await Session.updateMany({ user: userId, isActive: true }, { isActive: false });
        await user.save();

        return { message: "Password changed successfully" };
    }

    static async deleteUserAccount(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Delete user's active sessions
        await Session.deleteMany({ user: userId });
        
        // Remove User document
        await User.findByIdAndDelete(userId);

        return { message: "Account deleted successfully" };
    }
}

export { AuthService };
