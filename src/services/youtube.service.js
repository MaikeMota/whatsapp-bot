const youtubeUser = process.env.YOUTUBE_USER
const youtubeKey = process.env.YOUTUBE_KEY
const statisticsCacheTTLInMinuts = parseInt(process.env.STATISTICS_CACHE_TTL_IN_MINUTS || 60)

const { MessageMedia } = require('whatsapp-web.js');

let statisticsCache;
let statisticsCacheLastUpdate = new Date().getTime();

async function getLatestVideo() {
    const result = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${youtubeKey}&channelId=${youtubeUser}&part=snippet,id&order=date&maxResults=1`).then(r => r.json());
    const [item] = result.items;
    const { id: { videoId }, snippet: { title, thumbnails: { high: { url } } } } = item;

    const messageMedia = await MessageMedia.fromUrl(url);

    return {
        title,
        messageMedia,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}&ab_channel=VidadeAcionista`
    };
}

async function getChannelStatistics() {
    const now = Date.now();

    if (statisticsCache) {
        if (isStatisticCacheExpired(now)) {
            await updateStatisticCache(now);
        }
    } else {
        await updateStatisticCache(now);
    }

    return statisticsCache;
}

async function updateStatisticCache(now) {
    statisticsCache = await requestChannelStatistics();
    statisticsCacheLastUpdate = now;
}

function isStatisticCacheExpired(now) {
    return ((statisticsCacheLastUpdate + statisticsCacheTTLInMinuts) * 60 * 1000) > now;
}

async function requestChannelStatistics() {
    const subsResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${youtubeUser}&key=${youtubeKey}`)
        .then(response => response.json())

    const { subscriberCount, viewCount } = subsResponse["items"][0].statistics;
    return {
        subscriberCount: +subscriberCount,
        viewCount: +viewCount
    }
}

module.exports = { getLatestVideo, getChannelStatistics }
