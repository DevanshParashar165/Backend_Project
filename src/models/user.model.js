import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        url: {
            type: String, //cloudinary url
            required: true,
        },
        public_id: {
            type: String,
            required: true
        }
    },
    coverImage: {
        url: { type: String },
        public_id: { type: String }
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    },
    // Security and Roles
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerifyToken: String,
    emailVerifyTokenExpiry: Date,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,

    // Profile Details
    bio: {
        type: String,
        default: ""
    },
    about: {
        type: String,
        default: ""
    },
    skills: {
        type: [String],
        default: []
    },
    location: {
        type: String,
        default: ""
    },
    currentCompany: {
        type: String,
        default: ""
    },
    portfolioUrl: {
        type: String,
        default: ""
    },
    resume: {
        url: { type: String },
        public_id: { type: String }
    },
    // Social Links
    githubUsername: {
        type: String,
        default: ""
    },
    linkedinUrl: {
        type: String,
        default: ""
    },
    twitterUrl: {
        type: String,
        default: ""
    },
    websiteUrl: {
        type: String,
        default: ""
    },
    // Availability
    availability: {
        type: String,
        enum: ["full-time", "part-time", "contract", "none"],
        default: "none"
    },
    isOpenToWork: {
        type: Boolean,
        default: false
    },
    // Work Experience
    experience: [
        {
            title: String,
            company: String,
            location: String,
            from: Date,
            to: Date,
            current: Boolean,
            description: String
        }
    ],
    // Education
    education: [
        {
            school: String,
            degree: String,
            fieldOfStudy: String,
            from: Date,
            to: Date,
            current: Boolean,
            description: String
        }
    ],
    // Projects
    projects: [
        {
            title: String,
            description: String,
            link: String,
            repo: String,
            techStack: [String],
            from: Date,
            to: Date
        }
    ],
    // Certifications
    certifications: [
        {
            name: String,
            issuer: String,
            issueDate: Date,
            expirationDate: Date,
            credentialId: String,
            credentialUrl: String
        }
    ],
    // Achievements
    achievements: {
        type: [String],
        default: []
    },
    // Metrics / Analytics
    profileVisits: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname,
        role: this.role
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)