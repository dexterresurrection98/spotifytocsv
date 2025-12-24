/**
 * Main Application Controller
 */

const App = (function () {
    // State
    let playlists = [];
    let selectedIds = new Set();
    let likedSongsCount = 0;

    // DOM Elements
    const elements = {
        heroSection: document.getElementById('heroSection'),
        appSection: document.getElementById('appSection'),
        loginBtn: document.getElementById('loginBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        userProfile: document.getElementById('userProfile'),
        userAvatar: document.getElementById('userAvatar'),
        userName: document.getElementById('userName'),
        playlistsGrid: document.getElementById('playlistsGrid'),
        loadingState: document.getElementById('loadingState'),
        emptyState: document.getElementById('emptyState'),
        searchInput: document.getElementById('searchInput'),
        selectAllBtn: document.getElementById('selectAllBtn'),
        exportBtn: document.getElementById('exportBtn'),
        progressContainer: document.getElementById('progressContainer'),
        progressText: document.getElementById('progressText'),
        progressPercent: document.getElementById('progressPercent'),
        progressFill: document.getElementById('progressFill'),
        totalPlaylists: document.getElementById('totalPlaylists'),
        selectedCount: document.getElementById('selectedCount'),
        toastContainer: document.getElementById('toastContainer')
    };

    /**
     * Initialize the app
     */
    async function init() {
        setupEventListeners();

        if (SpotifyAuth.isAuthenticated()) {
            await showApp();
        } else {
            showHero();
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        elements.loginBtn.addEventListener('click', () => SpotifyAuth.login());
        elements.logoutBtn.addEventListener('click', () => SpotifyAuth.logout());
        elements.searchInput.addEventListener('input', handleSearch);
        elements.selectAllBtn.addEventListener('click', handleSelectAll);
        elements.exportBtn.addEventListener('click', handleExport);
    }

    /**
     * Show hero section (logged out state)
     */
    function showHero() {
        elements.heroSection.classList.remove('hidden');
        elements.appSection.classList.add('hidden');
        elements.userProfile.classList.add('hidden');
    }

    /**
     * Show app section (logged in state)
     */
    async function showApp() {
        elements.heroSection.classList.add('hidden');
        elements.appSection.classList.remove('hidden');
        elements.loadingState.classList.remove('hidden');
        elements.playlistsGrid.innerHTML = '';

        try {
            // Load user profile
            const user = await SpotifyAPI.getUserProfile();
            elements.userProfile.classList.remove('hidden');
            elements.userName.textContent = user.display_name;
            elements.userAvatar.src = user.images?.[0]?.url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231DB954"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 5v1h16v-1c0-2-2-5-8-5z"/></svg>';

            // Load liked songs count
            likedSongsCount = await SpotifyAPI.getLikedSongsCount();

            // Load playlists
            playlists = await SpotifyAPI.getAllPlaylists();

            elements.loadingState.classList.add('hidden');
            elements.totalPlaylists.textContent = playlists.length + 1; // +1 for Liked Songs

            renderPlaylists();

        } catch (error) {
            console.error('Failed to load app:', error);
            showToast('Failed to load playlists. Please try again.', 'error');
            elements.loadingState.classList.add('hidden');
        }
    }

    /**
     * Render playlists grid
     */
    function renderPlaylists(filter = '') {
        const filterLower = filter.toLowerCase();

        // Filter playlists
        const filtered = playlists.filter(p =>
            p.name.toLowerCase().includes(filterLower)
        );

        // Check if Liked Songs matches filter
        const showLikedSongs = 'liked songs'.includes(filterLower) || filter === '';

        if (filtered.length === 0 && !showLikedSongs) {
            elements.playlistsGrid.innerHTML = '';
            elements.emptyState.classList.remove('hidden');
            return;
        }

        elements.emptyState.classList.add('hidden');

        let html = '';

        // Liked Songs card
        if (showLikedSongs) {
            html += `
                <div class="playlist-card liked-songs ${selectedIds.has('liked') ? 'selected' : ''}" 
                     data-id="liked" data-name="Liked Songs">
                    <div class="playlist-image">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                    <div class="playlist-info">
                        <div class="playlist-name">Liked Songs</div>
                        <div class="playlist-meta">
                            <span class="playlist-tracks">${likedSongsCount} tracks</span>
                            <span>Your saved tracks</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Regular playlists
        for (const playlist of filtered) {
            const imageUrl = playlist.images?.[0]?.url || '';
            const isSelected = selectedIds.has(playlist.id);

            html += `
                <div class="playlist-card ${isSelected ? 'selected' : ''}" 
                     data-id="${playlist.id}" data-name="${playlist.name.replace(/"/g, '&quot;')}">
                    <img class="playlist-image" src="${imageUrl}" alt="" loading="lazy" 
                         onerror="this.style.background='linear-gradient(135deg, #333, #1a1a1a)'">
                    <div class="playlist-info">
                        <div class="playlist-name">${escapeHtml(playlist.name)}</div>
                        <div class="playlist-meta">
                            <span class="playlist-tracks">${playlist.tracks.total} tracks</span>
                            <span>by ${escapeHtml(playlist.owner.display_name)}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        elements.playlistsGrid.innerHTML = html;

        // Add click handlers
        elements.playlistsGrid.querySelectorAll('.playlist-card').forEach(card => {
            card.addEventListener('click', () => toggleSelection(card));
        });
    }

    /**
     * Toggle playlist selection
     */
    function toggleSelection(card) {
        const id = card.dataset.id;

        if (selectedIds.has(id)) {
            selectedIds.delete(id);
            card.classList.remove('selected');
        } else {
            selectedIds.add(id);
            card.classList.add('selected');
        }

        updateSelectionUI();
    }

    /**
     * Update selection UI
     */
    function updateSelectionUI() {
        elements.selectedCount.textContent = selectedIds.size;
        elements.exportBtn.disabled = selectedIds.size === 0;
        elements.selectAllBtn.textContent = selectedIds.size === playlists.length + 1
            ? 'Deselect All' : 'Select All';
    }

    /**
     * Handle search input
     */
    function handleSearch(e) {
        renderPlaylists(e.target.value);
    }

    /**
     * Handle select all
     */
    function handleSelectAll() {
        if (selectedIds.size === playlists.length + 1) {
            // Deselect all
            selectedIds.clear();
        } else {
            // Select all
            selectedIds.add('liked');
            playlists.forEach(p => selectedIds.add(p.id));
        }

        renderPlaylists(elements.searchInput.value);
        updateSelectionUI();
    }

    /**
     * Handle export
     */
    async function handleExport() {
        if (selectedIds.size === 0) return;

        elements.exportBtn.disabled = true;
        elements.progressContainer.classList.remove('hidden');

        let exported = 0;
        const total = selectedIds.size;

        try {
            for (const id of selectedIds) {
                const name = id === 'liked' ? 'Liked Songs' :
                    playlists.find(p => p.id === id)?.name || 'Playlist';

                updateProgress(`Fetching: ${name}...`, 0);

                // Fetch tracks
                let tracks;
                if (id === 'liked') {
                    tracks = await SpotifyAPI.getLikedSongs((p) => {
                        updateProgress(`Fetching: ${name} (page ${p.page}/${p.totalPages})...`,
                            Math.round((p.loaded / p.total) * 100));
                    });
                } else {
                    tracks = await SpotifyAPI.getPlaylistTracks(id, (p) => {
                        updateProgress(`Fetching: ${name} (page ${p.page}/${p.totalPages})...`,
                            Math.round((p.loaded / p.total) * 100));
                    });
                }

                // Generate and download CSV
                const csv = CSVGenerator.generateCSV(tracks);
                const filename = CSVGenerator.generateFilename(name);
                CSVGenerator.downloadCSV(csv, filename);

                exported++;
                showToast(`Exported: ${name} (${tracks.length} tracks)`, 'success');

                // Small delay between downloads
                if (exported < total) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            showToast(`Successfully exported ${exported} playlist(s)!`, 'success');

        } catch (error) {
            console.error('Export failed:', error);
            showToast(`Export failed: ${error.message}`, 'error');
        } finally {
            elements.progressContainer.classList.add('hidden');
            elements.exportBtn.disabled = false;
        }
    }

    /**
     * Update progress bar
     */
    function updateProgress(text, percent) {
        elements.progressText.textContent = text;
        elements.progressPercent.textContent = `${percent}%`;
        elements.progressFill.style.width = `${percent}%`;
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span class="toast-message">${escapeHtml(message)}</span>
        `;

        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();
