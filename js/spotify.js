/**
 * Spotify API Module
 * Handles all API interactions with rate limiting and pagination
 */

const SpotifyAPI = (function () {
    const API_BASE = 'https://api.spotify.com/v1';

    // Rate limiting configuration
    const REQUEST_DELAY_MS = 100;  // Delay between requests to avoid 429
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY_MS = 1000;

    /**
     * Sleep helper for rate limiting
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Make an authenticated API request with retry logic
     */
    async function apiRequest(endpoint, retries = 0) {
        const token = SpotifyAuth.getAccessToken();

        if (!token) {
            throw new Error('Not authenticated');
        }

        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Handle rate limiting (429)
        if (response.status === 429) {
            if (retries >= MAX_RETRIES) {
                throw new Error('Too many requests. Please try again in a few minutes.');
            }

            // Get retry-after header or use exponential backoff
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter
                ? parseInt(retryAfter) * 1000
                : INITIAL_RETRY_DELAY_MS * Math.pow(2, retries);

            console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
            await sleep(waitTime);

            return apiRequest(endpoint, retries + 1);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get current user's profile
     */
    async function getUserProfile() {
        return apiRequest('/me');
    }

    /**
     * Get all user playlists with pagination
     */
    async function getAllPlaylists(onProgress) {
        const playlists = [];
        let url = '/me/playlists?limit=50';
        let page = 1;

        while (url) {
            const data = await apiRequest(url);
            playlists.push(...data.items);

            if (onProgress) {
                onProgress({
                    loaded: playlists.length,
                    total: data.total,
                    page: page
                });
            }

            url = data.next;
            page++;

            // Rate limit: wait between requests
            if (url) {
                await sleep(REQUEST_DELAY_MS);
            }
        }

        return playlists;
    }

    /**
     * Get all tracks from a playlist with pagination
     */
    async function getPlaylistTracks(playlistId, onProgress) {
        const tracks = [];
        let url = `/playlists/${playlistId}/tracks?limit=100`;
        let page = 1;
        let total = 0;

        while (url) {
            const data = await apiRequest(url);
            total = data.total;

            // Filter out null tracks (can happen with unavailable songs)
            const validTracks = data.items.filter(item => item.track !== null);
            tracks.push(...validTracks);

            if (onProgress) {
                onProgress({
                    loaded: tracks.length,
                    total: total,
                    page: page,
                    totalPages: Math.ceil(total / 100)
                });
            }

            url = data.next;
            page++;

            // Rate limit: wait between requests
            if (url) {
                await sleep(REQUEST_DELAY_MS);
            }
        }

        return tracks;
    }

    /**
     * Get all Liked Songs with pagination
     * Note: This uses a different endpoint than regular playlists
     */
    async function getLikedSongs(onProgress) {
        const tracks = [];
        let url = '/me/tracks?limit=50';
        let page = 1;
        let total = 0;

        while (url) {
            const data = await apiRequest(url);
            total = data.total;

            // Filter out null tracks
            const validTracks = data.items.filter(item => item.track !== null);
            tracks.push(...validTracks);

            if (onProgress) {
                onProgress({
                    loaded: tracks.length,
                    total: total,
                    page: page,
                    totalPages: Math.ceil(total / 50)
                });
            }

            url = data.next;
            page++;

            // Rate limit: wait between requests
            if (url) {
                await sleep(REQUEST_DELAY_MS);
            }
        }

        return tracks;
    }

    /**
     * Get total count of user's Liked Songs (for display)
     */
    async function getLikedSongsCount() {
        const data = await apiRequest('/me/tracks?limit=1');
        return data.total;
    }

    // Public API
    return {
        getUserProfile,
        getAllPlaylists,
        getPlaylistTracks,
        getLikedSongs,
        getLikedSongsCount
    };
})();
