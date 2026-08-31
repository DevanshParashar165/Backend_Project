import nodemailer from "nodemailer";
import { logger } from "./logger.js";

// Create transporter using environment variables or a mock/fallback transporter
let transporter;

const setupTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Fallback or Test Transporter
        logger.info("SMTP Credentials not provided. Falling back to console email logging.");
        transporter = null;
    }
};

setupTransporter();

export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        if (!transporter) {
            logger.info(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
            logger.info(`[EMAIL TEXT CONTENT]: ${text}`);
            logger.info(`[EMAIL HTML CONTENT]: ${html}`);
            return { messageId: "mock-id-123" };
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"DevConnect" <noreply@devconnect.com>',
            to,
            subject,
            text,
            html
        });

        logger.info(`Email sent successfully: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Error sending email to ${to}:`, error);
        throw error;
    }
};
