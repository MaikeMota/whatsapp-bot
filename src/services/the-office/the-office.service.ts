

export const TheOfficeAPI = {
    BASE_URL: "https://officeapi.akashrajpurohit.com",
    RANDON_QUOTE_URL: "/quote/random",
    SEASON_URL: "/season/:id",
    EPISODE_URL: "/season/:id/episode/:id",
    TOTAL_SEASONS: 9,
    getRandomQuoteUrl() {
        return this.BASE_URL + this.RANDON_QUOTE_URL;
    },
    getSeasonUrl(seasonId: number) {
        return this.BASE_URL + this.SEASON_URL.replace(":id", seasonId.toString());
    },
    getEpisodeUrl(seasonId: number, episodeId: number) {
        return this.BASE_URL + this.EPISODE_URL.replace(":id", seasonId.toString()).replace(":id", episodeId.toString());
    },

} as const

export class TheOfficeService {

    static async getRandomQuote() {
        const response = await fetch(TheOfficeAPI.getRandomQuoteUrl());
        return (await response.json()) as TheOfficeApiQuoteResponse;
    }

    static async getSeason(seasonId: number) {
        const response = await fetch(TheOfficeAPI.getSeasonUrl(seasonId));
        return (await response.json()) as TheOfficeApiEpisodeResponse[];
    }

    static async getEpisode(seasonId: number, episodeId: number) {
        const response = await fetch(TheOfficeAPI.getEpisodeUrl(seasonId, episodeId));
        return (await response.json()) as TheOfficeApiEpisodeResponse;
    }

}

interface TheOfficeApiQuoteResponse {
    id: number;
    character: string;
    quote: string;
    character_avatar_url: string;
}

interface TheOfficeApiEpisodeResponse {
    season: number;
    episode: number;
    title: string;
    description: string;
    airDate: string;
    imdbRating: number;
    totalVotes: number;
    directedBy: string;
    writtenBy: string;
}