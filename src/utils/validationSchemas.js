import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores"),
        email: z.string().email("Invalid email address"),
        fullname: z.string().min(2, "Full name must be at least 2 characters"),
        password: z.string().min(6, "Password must be at least 6 characters")
    })
});

export const loginSchema = z.object({
    body: z.object({
        emailOrUsername: z.string().min(1, "Username or Email is required"),
        password: z.string().min(1, "Password is required")
    })
});

export const updateProfileSchema = z.object({
    body: z.object({
        fullname: z.string().min(2).optional(),
        bio: z.string().max(160).optional(),
        about: z.string().max(1000).optional(),
        skills: z.array(z.string()).optional(),
        location: z.string().optional(),
        currentCompany: z.string().optional(),
        portfolioUrl: z.string().url().or(z.literal("")).optional(),
        githubUsername: z.string().optional(),
        linkedinUrl: z.string().url().or(z.literal("")).optional(),
        twitterUrl: z.string().url().or(z.literal("")).optional(),
        websiteUrl: z.string().url().or(z.literal("")).optional(),
        availability: z.enum(["full-time", "part-time", "contract", "none"]).optional(),
        isOpenToWork: z.boolean().optional(),
        achievements: z.array(z.string()).optional()
    })
});

export const createPostSchema = z.object({
    body: z.object({
        content: z.string().min(1, "Post content cannot be empty"),
        codeSnippet: z.object({
            code: z.string().default(""),
            language: z.string().default("")
        }).optional(),
        poll: z.object({
            question: z.string(),
            options: z.array(z.string()).min(2, "Polls must have at least 2 choices"),
            expiresAt: z.string().datetime().optional()
        }).optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        status: z.enum(["draft", "published", "scheduled"]).default("published"),
        scheduledAt: z.string().datetime().optional()
    })
});

export const commentSchema = z.object({
    body: z.object({
        content: z.string().min(1, "Comment content cannot be empty"),
        parentComment: z.string().uuid().or(z.string()).optional() // Check for string ID
    })
});
