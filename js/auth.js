/**
 * Spotify Authentication Module
 * Implements Authorization Code Flow with PKCE
 * No backend server required - all client-side
 */

const SpotifyAuth = (function () {
    // Configuration
    const CLIENT_ID = '557282b44de24886a3c5c43092e3ad58';

    // Auto-detect environment: use current origin for redirect
    const REDIRECT_URI = window.location.origin + '/callback.html';
    const SCOPES = [
        'playlist-read-private',
        'playlist-read-collaborative',
        'user-library-read'  // For Liked Songs
    ].join(' ');

    const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
    const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

    /**
     * Generate a random string for code verifier
     */
    function generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], '');
    }

    /**
     * Generate SHA256 hash of the code verifier
     */
    async function sha256(plain) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return window.crypto.subtle.digest('SHA-256', data);
    }

    /**
     * Base64 URL encode the hash
     */
    function base64urlencode(arrayBuffer) {
        let str = '';
        const bytes = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    /**
     * Generate code challenge from verifier
     */
    async function generateCodeChallenge(verifier) {
        const hashed = await sha256(verifier);
        return base64urlencode(hashed);
    }

    /**
     * Initiate the login flow
     */
    async function login() {
        // Generate and store code verifier
        const codeVerifier = generateRandomString(128);
        sessionStorage.setItem('spotify_code_verifier', codeVerifier);

        // Generate code challenge
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // Build authorization URL
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: 'code',
            redirect_uri: REDIRECT_URI,
            scope: SCOPES,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            show_dialog: 'false'
        });

        // Redirect to Spotify
        window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async function exchangeCodeForToken(code) {
        const codeVerifier = sessionStorage.getItem('spotify_code_verifier');

        if (!codeVerifier) {
            throw new Error('Code verifier not found. Please try logging in again.');
        }

        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier
        });

        const response = await fetch(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error_description || 'Failed to exchange code for token');
        }

        return response.json();
    }

    /**
     * Get current access token
     */
    function getAccessToken() {
        const token = sessionStorage.getItem('spotify_access_token');
        const expiry = sessionStorage.getItem('spotify_token_expiry');

        // Check if token exists and hasn't expired
        if (token && expiry && Date.now() < parseInt(expiry)) {
            return token;
        }

        return null;
    }

    /**
     * Check if user is authenticated
     */
    function isAuthenticated() {
        return getAccessToken() !== null;
    }

    /**
     * Logout - clear all auth data
     */
    function logout() {
        sessionStorage.removeItem('spotify_access_token');
        sessionStorage.removeItem('spotify_token_expiry');
        sessionStorage.removeItem('spotify_code_verifier');
        window.location.reload();
    }

    // Public API
    return {
        login,
        exchangeCodeForToken,
        getAccessToken,
        isAuthenticated,
        logout
    };
})();
