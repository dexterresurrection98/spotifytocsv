# Spotify Playlist to CSV Exporter

A privacy-first, client-side web application that exports your Spotify playlists to CSV files.

![Preview](https://via.placeholder.com/800x400/1a1a2e/1DB954?text=Spotify+Playlist+Exporter)

## Features

- 🔒 **100% Private** - Your data never leaves your browser
- ♾️ **Unlimited Tracks** - No track limits, export playlists of any size
- ❤️ **Liked Songs Support** - Export your saved tracks library
- 📱 **Mobile Friendly** - Works on all devices
- ⚡ **Rate-Limited** - Built-in delays to prevent API throttling

## Quick Start

### 1. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in and create an app
3. Add redirect URI: `http://localhost:5500/callback.html`
4. Copy your Client ID

### 2. Configure the App

Open `js/auth.js` and update the `CLIENT_ID`:

```javascript
const CLIENT_ID = 'your_client_id_here';
```

### 3. Run Locally

**Option A: VS Code Live Server (Recommended)**
1. Install the "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"
3. App will open at `http://localhost:5500`

**Option B: Python**
```bash
python -m http.server 5500
# Open http://localhost:5500
```

**Option C: Node.js**
```bash
npx serve -p 5500
# Open http://localhost:5500
```

## Deployment

### GitHub Pages (Free)

1. Push code to GitHub repository
2. Go to Settings → Pages
3. Select "main" branch and save
4. Update Spotify Dashboard redirect URI to: `https://yourusername.github.io/repo-name/callback.html`
5. Update `CLIENT_ID` in `js/auth.js` if needed

### Netlify (Free)

1. Push to GitHub
2. Connect repo on [Netlify](https://netlify.com)
3. Deploy automatically
4. Update Spotify redirect URI

## CSV Fields

Each export includes:
- Track Name
- Artist(s)
- Album
- Release Date
- Duration
- Popularity
- Explicit (Yes/No)
- Date Added
- Spotify URL

## Tech Stack

- Pure HTML, CSS, JavaScript (no frameworks)
- Spotify Web API
- OAuth 2.0 with PKCE (no backend required)

## License

MIT License - free for personal and commercial use.
