const youtubeUser = process.env.YOUTUBE_USER
const youtubeKey = process.env.YOUTUBE_KEY

const { MessageMedia } = require('whatsapp-web.js');


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

async function getChannelSubs() {
    const subsResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${youtubeUser}&key=${youtubeKey}`)
        .then(response => response.json())

    return subsResponse["items"][0].statistics.subscriberCount;
}

module.exports = { getLatestVideo, getChannelSubs }
