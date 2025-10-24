require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const path = require('path');

const app = express();
const port = process.env.PORT || 8888;

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

app.get('/login', (req, res) => {
  const scopes = ['user-read-currently-playing', 'user-read-recently-played'];
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    res.send(`Refresh Token: ${refresh_token}`);
  } catch (err) {
    res.send('Error getting token: ' + err);
  }
});

app.get('/api/spotify', async (req, res) => {
  try {
    spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body['access_token']);
    const track = await spotifyApi.getMyCurrentPlayingTrack();
    if (!track.body.is_playing) {
      const recent = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 1 });
      res.json(recent.body.items[0].track);
    } else {
      res.json(track.body);
    }
  } catch (err) {
    res.status(500).send('Error fetching track');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});