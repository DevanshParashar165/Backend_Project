export const parseUserAgent = (userAgentString) => {
    if (!userAgentString) {
        return {
            device: { type: "unknown" },
            browser: { name: "unknown" },
            os: { name: "unknown" }
        };
    }

    const ua = userAgentString.toLowerCase();
    
    // Simple Device Type detection
    let deviceType = "desktop";
    if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
        deviceType = "mobile";
    } else if (/tablet|ipad/i.test(ua)) {
        deviceType = "tablet";
    }

    // Simple Browser detection
    let browser = "unknown";
    if (ua.includes("chrome") || ua.includes("crios")) {
        browser = "Chrome";
    } else if (ua.includes("safari") && !ua.includes("chrome")) {
        browser = "Safari";
    } else if (ua.includes("firefox")) {
        browser = "Firefox";
    } else if (ua.includes("edge")) {
        browser = "Edge";
    } else if (ua.includes("opr") || ua.includes("opera")) {
        browser = "Opera";
    }

    // Simple OS detection
    let os = "unknown";
    if (ua.includes("windows")) {
        os = "Windows";
    } else if (ua.includes("macintosh") || ua.includes("mac os")) {
        os = "macOS";
    } else if (ua.includes("android")) {
        os = "Android";
    } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
        os = "iOS";
    } else if (ua.includes("linux")) {
        os = "Linux";
    }

    return {
        device: { type: deviceType },
        browser: { name: browser },
        os: { name: os }
    };
};
