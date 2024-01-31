import { roundNumberTo } from "../utils/math.utils";

enum SortBy {
    moving_time = "moving_time",
    num_activities = "num_activities",
    distance = "distance"
}

enum WeekOffset {
    last_week = 1,
    this_week = 0
}

const BASE_URL = `https://www.strava.com/clubs/{club_id}/leaderboard?week_offset={week_offset}&per_page={per_page}&sort_by={sort_by}`;

export class StravaService {

    static async requestLeaderBoard(clubId: string, sortBy: string = undefined, weekOffset: number = undefined, perPage: number = undefined) {

        let finalUrl = BASE_URL
            .replace("{club_id}", clubId)

        if (sortBy || weekOffset || perPage) {
            const params = new URLSearchParams()

            if (sortBy) {
                params.append("sort_by", sortBy)
            }
            if (weekOffset) {
                params.append("week_offset", weekOffset.toString())
            }
            if (perPage) {
                params.append("per_page", perPage.toString())
            }

            finalUrl += "?" + params.toString()
        }


        const response = await fetch(finalUrl, {
            headers: {
                "accept": "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Microsoft Edge\";v=\"121\", \"Chromium\";v=\"121\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "Referer": `https://www.strava.com/clubs/${clubId}/leaderboard`,
                "Referrer-Policy": "strict-origin-when-cross-origin"
            }
        });

        if (response.status === 200) {
            const jsonResponse = await response.json();
            return jsonResponse as StravaLeadboardAPIResponse;
        }

        throw new Error(`Erro ao buscar dados da API do Strava. Error: ${response.status} - ${response.statusText}`)
    }


    static asHoursAndMinutes(value: number) { 
        const totalTime = value / 3600
        const hours = Math.floor(totalTime);
        const minutes = roundNumberTo((totalTime - hours) * 60, 1);
        return `${hours}h${minutes}m`
    }

}

interface LeadBoardResponse {
    rank: number;
    athlete_id: number;
    athlete_firstname: string;
    athlete_lastname: string;
    athlete_picture_url: string;
    moving_time: number;
    num_activities: number;
    distance: number;


}

interface StravaLeadboardAPIResponse {
    data: LeadBoardResponse[]
}