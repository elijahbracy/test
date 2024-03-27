const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const keys = require('../config/keys');

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache TTL set to 1 hour

async function fetchYouTubeVideos() {
    const cachedVideos = cache.get('youtubeVideos');
    if (cachedVideos) {
        console.log("used cache");
        return cachedVideos;
    }

    const apiKey = keys.google.API_KEY;
    const youtube = google.youtube({ version: 'v3', auth: apiKey });

    try {
        const response = await youtube.search.list({
            part: 'snippet',
            channelId: 'UCvLxa8bjqPSAx8IKarFXPMQ',
            maxResults: 6,
            order: 'date'
        });

        const videos = response.data.items
            .filter(item => item.id.videoId) // Filter out items with undefined videoId
            .map(item => ({
                title: item.snippet.title,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                thumbnailUrl: item.snippet.thumbnails.default.url
            }));

        // Cache the videos for future requests
        cache.set('youtubeVideos', videos);

        return videos;
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
    }
}



// Define routes here
router.get('/', async (req, res) => {
    try {
        //const user = req.user;
        const videos = await fetchYouTubeVideos();
        //console.log(videos);
        res.render('main', { videos: videos, user: req.user });
        console.log(req.user);
        //res.render('main', { videos: [], user: req.user });
    } catch (error) {
        console.error('Error rendering main page:', error);
        res.render('main', { videos: [], user: req.user, error: error });
    }
});

module.exports = router;
