/**
 * CSV Generation Module
 */

const CSVGenerator = (function () {
    function escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    function formatDuration(ms) {
        if (!ms) return '';
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch { return dateString; }
    }

    function extractTrackData(item) {
        const track = item.track;
        if (!track) return null;
        return {
            name: track.name || '',
            artists: track.artists?.map(a => a.name).join(', ') || '',
            album: track.album?.name || '',
            releaseDate: track.album?.release_date || '',
            duration: formatDuration(track.duration_ms),
            popularity: track.popularity ?? '',
            explicit: track.explicit ? 'Yes' : 'No',
            addedAt: formatDate(item.added_at),
            spotifyUrl: track.external_urls?.spotify || ''
        };
    }

    function generateCSV(items) {
        const cols = ['Track Name', 'Artist(s)', 'Album', 'Release Date', 'Duration', 'Popularity', 'Explicit', 'Date Added', 'Spotify URL'];
        const keys = ['name', 'artists', 'album', 'releaseDate', 'duration', 'popularity', 'explicit', 'addedAt', 'spotifyUrl'];
        const rows = [cols.map(c => escapeCSV(c)).join(',')];

        for (const item of items) {
            const data = extractTrackData(item);
            if (!data) continue;
            rows.push(keys.map(k => escapeCSV(data[k])).join(','));
        }
        return rows.join('\n');
    }

    function downloadCSV(csvContent, filename) {
        // Create CSV with BOM for Excel compatibility
        const BOM = '\uFEFF';
        const fullContent = BOM + csvContent;

        // Create blob
        const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8' });

        // For Safari and older browsers, use msSaveBlob if available
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
            return;
        }

        // Create object URL
        const url = window.URL.createObjectURL(blob);

        // Create and configure link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';

        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();

        // Cleanup after a delay to ensure download starts
        window.setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 1000);
    }

    function generateFilename(name) {
        const sanitized = name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_').substring(0, 100);
        return `${sanitized}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    return { generateCSV, downloadCSV, generateFilename, extractTrackData };
})();
