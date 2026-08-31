import axios from "axios";
import { logger } from "../utils/logger.js";

class GitHubService {
    static async getPublicRepositories(username) {
        if (!username) return [];
        try {
            const url = `https://api.github.com/users/${username}/repos?sort=updated&per_page=30`;
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "DevConnect-App"
                }
            });

            // Parse repository information
            return response.data.map(repo => ({
                id: repo.id,
                name: repo.name,
                description: repo.description || "No description provided",
                url: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language || "TypeScript",
                updatedAt: repo.updated_at
            }));
        } catch (error) {
            logger.error(`Error fetching GitHub repos for ${username}:`, error.message);
            return [];
        }
    }

    static async getPinnedRepositories(username) {
        // Fallback: fetch top starred repos as pinned
        const repos = await this.getPublicRepositories(username);
        return repos.sort((a, b) => b.stars - a.stars).slice(0, 6);
    }
}

export { GitHubService };
