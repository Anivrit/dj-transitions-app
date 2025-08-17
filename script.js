class DJTransitionsApp {
    constructor() {
        this.transitions = [];
        this.songs = new Set();
        this.songMetadata = new Map(); // Store song metadata
        this.graph = new Map(); // Adjacency list representation
        this.init();
    }

    //Makeshift commit to test pages

    // ===== INITIALIZATION =====
    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderTransitions();
    }

    setupEventListeners() {
        // Add transition button
        document.getElementById('add-transition-btn').addEventListener('click', () => {
            this.addTransition();
        });

        // Find chain button
        document.getElementById('find-chain-btn').addEventListener('click', () => {
            this.findLongestChain();
        });

        // Show/hide graph button
        document.getElementById('show-graph-btn').addEventListener('click', () => {
            this.toggleGraph();
        });

        // Clear all data button
        document.getElementById('clear-graph-btn').addEventListener('click', () => {
            this.clearAllData();
        });

        // Input mode switching
        document.getElementById('input-mode').addEventListener('change', (e) => {
            this.switchInputMode(e.target.value);
        });

        // SoundCloud URL inputs
        document.getElementById('from-song-url').addEventListener('blur', () => {
            this.fetchSoundCloudMetadata('from-song-url', 'from-song-preview');
        });

        document.getElementById('to-song-url').addEventListener('blur', () => {
            this.fetchSoundCloudMetadata('to-song-url', 'to-song-preview');
        });

        // Song search functionality
        const songSearch = document.getElementById('song-search');
        songSearch.addEventListener('input', (e) => {
            this.handleSongSearch(e.target.value);
        });

        songSearch.addEventListener('focus', () => {
            this.showSearchResults();
        });

        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.select-song')) {
                this.hideSearchResults();
            }
        });

        // Enter key support for form inputs
        document.getElementById('from-song').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('to-song').focus();
        });

        document.getElementById('to-song').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTransition();
        });
    }

    // ===== INPUT MODE MANAGEMENT =====
    switchInputMode(mode) {
        const manualInputs = document.getElementById('manual-inputs');
        const soundcloudInputs = document.getElementById('soundcloud-inputs');
        
        if (mode === 'manual') {
            manualInputs.style.display = 'block';
            soundcloudInputs.style.display = 'none';
        } else {
            manualInputs.style.display = 'none';
            soundcloudInputs.style.display = 'block';
        }
    }

    // ===== SONG SEARCH FUNCTIONALITY =====
    handleSongSearch(query) {
        const searchResults = document.getElementById('search-results');
        const songs = Array.from(this.songs);
        
        if (!query.trim()) {
            this.hideSearchResults();
            return;
        }

        const filteredSongs = songs.filter(song => 
            song.toLowerCase().includes(query.toLowerCase())
        );

        this.displaySearchResults(filteredSongs);
    }

    displaySearchResults(songs) {
        const searchResults = document.getElementById('search-results');
        
        if (songs.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No songs found</div>';
            searchResults.classList.add('show');
            return;
        }

        searchResults.innerHTML = '';
        
        songs.forEach(song => {
            const metadata = this.songMetadata.get(song);
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.song = song;
            
            resultItem.innerHTML = `
                <img src="${metadata?.artwork || this.getDefaultArtwork(song)}" alt="Artwork" class="search-result-artwork" 
                     onerror="this.onerror=null; this.src='${this.getDefaultArtwork(song)}'; this.style.border='1px solid #e5e7eb';">
                <div class="search-result-info">
                    <div class="search-result-title">${metadata?.title || song}</div>
                    <div class="search-result-artist">${metadata?.artist || 'Unknown Artist'}</div>
                </div>
            `;
            
            resultItem.addEventListener('click', () => {
                this.selectSongFromSearch(song);
            });
            
            searchResults.appendChild(resultItem);
        });
        
        searchResults.classList.add('show');
    }

    selectSongFromSearch(song) {
        document.getElementById('song-search').value = song;
        this.hideSearchResults();
    }

    showSearchResults() {
        const searchResults = document.getElementById('search-results');
        if (this.songs.size > 0) {
            searchResults.classList.add('show');
        }
    }

    hideSearchResults() {
        const searchResults = document.getElementById('search-results');
        searchResults.classList.remove('show');
    }

    // ===== SOUNDCLOUD METADATA FETCHING =====
    async fetchSoundCloudMetadata(inputId, previewId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const url = input.value.trim();
        
        if (!url) {
            preview.innerHTML = '';
            preview.classList.remove('loaded');
            return;
        }

        // Validate SoundCloud URL
        if (!this.isValidSoundCloudUrl(url)) {
            preview.innerHTML = '<div class="song-preview-error">Please enter a valid SoundCloud URL</div>';
            preview.classList.add('loaded');
            return;
        }

        // Show loading state
        preview.innerHTML = '<div class="song-preview-loading">Loading song info...</div>';
        preview.classList.add('loaded');

        try {
            console.log('🔍 Processing SoundCloud URL:', url);
            
            // Extract clean track info from URL (this always works)
            const trackData = this.extractInfoFromUrl(url);
            
            if (!trackData) {
                throw new Error('Could not extract track information from URL');
            }

            console.log('✅ Extracted track data:', trackData);

            // Create song preview with clean data
            const songTitle = trackData.title;
            const artistName = trackData.artist;
            const artworkUrl = this.getDefaultArtwork(artistName);
            
            console.log('🎨 Creating preview with:', { songTitle, artistName });
            
            preview.innerHTML = `
                <div class="song-preview-content">
                    <img src="${artworkUrl}" alt="Album Art" class="song-preview-artwork">
                    <div class="song-preview-info">
                        <div class="song-preview-title">${songTitle}</div>
                        <div class="song-preview-artist">${artistName}</div>
                        <div class="song-preview-duration">Unknown duration</div>
                    </div>
                </div>
            `;

            // Store metadata for later use
            const songKey = `${artistName} - ${songTitle}`;
            this.songMetadata.set(songKey, {
                title: songTitle,
                artist: artistName,
                artwork: artworkUrl,
                duration: 'Unknown duration',
                soundcloudUrl: url,
                trackId: this.extractTrackId(url)
            });

            console.log('💾 Successfully stored metadata for:', songKey);

        } catch (error) {
            console.error('💥 Error processing SoundCloud URL:', error);
            preview.innerHTML = `<div class="song-preview-error">Error processing URL: ${error.message}</div>`;
        }
    }

    extractInfoFromUrl(url) {
        try {
            console.log('🔍 Parsing URL:', url);
            
            // Parse SoundCloud URL to extract artist and track info
            const urlParts = url.split('/');
            console.log('🔍 URL parts:', urlParts);
            
            const soundcloudIndex = urlParts.findIndex(part => part === 'soundcloud.com');
            console.log('🔍 SoundCloud index:', soundcloudIndex);
            
            if (soundcloudIndex !== -1 && soundcloudIndex + 2 < urlParts.length) {
                const artist = urlParts[soundcloudIndex + 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let track = urlParts[soundcloudIndex + 2];
                
                // Clean up the track name - remove query parameters and improve formatting
                track = track.split('?')[0]; // Remove query parameters
                
                // Handle specific cases like "bailamosorientherapyremix"
                if (track === 'bailamosorientherapyremix') {
                    track = 'Bailamos (Orientherapy Remix)';
                } else {
                    // General formatting improvements
                    track = track.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add spaces between camelCase
                    track = track.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2'); // Add spaces between consecutive capitals
                    track = track.replace(/-/g, ' '); // Replace hyphens with spaces
                    track = track.replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
                }
                
                console.log('🔍 Extracted artist:', artist, 'track:', track);
                
                return {
                    title: track,
                    artist: artist,
                    artwork: this.getDefaultArtwork(artist),
                    duration: 'Unknown duration'
                };
            } else {
                console.log('❌ Could not find artist/track in URL structure');
                return null;
            }
        } catch (e) {
            console.log('❌ URL parsing failed:', e.message);
            return null;
        }
    }

    extractArtistFromTitle(title) {
        // Try to extract artist from title (common format: "Artist - Song")
        if (!title) return null;
        
        const parts = title.split(' - ');
        if (parts.length > 1) {
            return parts[0].trim();
        }
        
        // Try other common separators
        const separators = [' – ', ' — ', ' / ', ' | '];
        for (const separator of separators) {
            if (title.includes(separator)) {
                const parts = title.split(separator);
                if (parts.length > 1) {
                    return parts[0].trim();
                }
            }
        }
        
        return null;
    }

    formatDuration(milliseconds) {
        if (!milliseconds) return 'Unknown duration';
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // ===== UTILITY FUNCTIONS =====
    extractTrackId(url) {
        // Extract track ID from various SoundCloud URL formats
        const match = url.match(/soundcloud\.com\/[^\/]+\/[^\/]+/);
        return match ? match[0] : null;
    }

    isValidSoundCloudUrl(url) {
        // Check if it's a valid SoundCloud URL
        const soundcloudRegex = /^https?:\/\/(www\.)?soundcloud\.com\/[^\/]+\/[^\/]+/;
        return soundcloudRegex.test(url);
    }

    getDefaultArtwork(artist) {
        // Generate a colorful placeholder artwork based on artist name
        const colors = [
            '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', 
            '#f59e0b', '#ef4444', '#ec4899', '#84cc16'
        ];
        
        const colorIndex = artist.charCodeAt(0) % colors.length;
        const color = colors[colorIndex];
        
        // Create a simple SVG placeholder with better styling
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${this.adjustColor(color, -20)};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="60" height="60" fill="url(#grad)" rx="8"/>
                <text x="30" y="35" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
                    ${artist.charAt(0).toUpperCase()}
                </text>
            </svg>
        `)}`;
    }

    adjustColor(color, amount) {
        // Helper function to adjust color brightness
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // ===== DATA PERSISTENCE =====
    saveData() {
        try {
            localStorage.setItem('djTransitions', JSON.stringify({
                transitions: this.transitions,
                songs: Array.from(this.songs),
                songMetadata: Array.from(this.songMetadata.entries())
            }));
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    loadData() {
        try {
            const data = localStorage.getItem('djTransitions');
            if (data) {
                const parsed = JSON.parse(data);
                this.transitions = parsed.transitions || [];
                this.songs = new Set(parsed.songs || []);
                
                // Load song metadata
                if (parsed.songMetadata) {
                    this.songMetadata = new Map(parsed.songMetadata);
                }
                
                this.updateGraph();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    // ===== NOTIFICATIONS =====
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        // Set color based on type
        switch (type) {
            case 'success':
                notification.style.background = '#48bb78';
                break;
            case 'error':
                notification.style.background = '#e53e3e';
                break;
            case 'warning':
                notification.style.background = '#ed8936';
                break;
            default:
                notification.style.background = '#667eea';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // ===== ADDING TRANSITIONS =====
    addTransition() {
        const inputMode = document.getElementById('input-mode').value;
        let fromSong, toSong;
        
        if (inputMode === 'soundcloud') {
            const fromUrl = document.getElementById('from-song-url').value.trim();
            const toUrl = document.getElementById('to-song-url').value.trim();
            
            if (!fromUrl || !toUrl) {
                alert('Please enter both SoundCloud URLs');
                return;
            }

            // Get song info from metadata or create from URL if needed
            fromSong = this.getSongKeyFromUrl(fromUrl) || this.createSongKeyFromUrl(fromUrl);
            toSong = this.getSongKeyFromUrl(toUrl) || this.createSongKeyFromUrl(toUrl);
            
            if (!fromSong || !toSong) {
                alert('Please wait for song info to load, or check your URLs');
                return;
            }
        } else {
            fromSong = document.getElementById('from-song').value.trim();
            toSong = document.getElementById('to-song').value.trim();
        }

        const notes = document.getElementById('transition-notes').value.trim();

        if (!fromSong || !toSong) {
            alert('Please enter both songs');
            return;
        }

        if (fromSong === toSong) {
            alert('A song cannot transition to itself');
            return;
        }

        // Check if transition already exists
        if (this.transitions.some(t => t.from === fromSong && t.to === toSong)) {
            alert('This transition already exists');
            return;
        }

        const transition = {
            id: Date.now(),
            from: fromSong,
            to: toSong,
            notes: notes,
            timestamp: new Date().toISOString(),
            metadata: {
                from: this.songMetadata.get(fromSong) || null,
                to: this.songMetadata.get(toSong) || null
            }
        };

        this.transitions.push(transition);
        this.songs.add(fromSong);
        this.songs.add(toSong);
        this.updateGraph();
        this.saveData();
        this.renderTransitions();
        this.clearForm();

        // Show success message
        this.showNotification('Transition added successfully!', 'success');
    }

    getSongKeyFromUrl(url) {
        // Find the song key that matches this URL
        for (const [key, metadata] of this.songMetadata.entries()) {
            if (metadata.soundcloudUrl === url) {
                return key;
            }
        }
        return null;
    }

    createSongKeyFromUrl(url) {
        // Create a song key from URL when metadata isn't loaded yet
        try {
            const urlParts = url.split('/');
            const soundcloudIndex = urlParts.findIndex(part => part === 'soundcloud.com');
            
            if (soundcloudIndex !== -1 && soundcloudIndex + 2 < urlParts.length) {
                const artist = urlParts[soundcloudIndex + 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let track = urlParts[soundcloudIndex + 2];
                
                // Clean up the track name - remove query parameters and improve formatting
                track = track.split('?')[0]; // Remove query parameters
                
                // Handle specific cases like "bailamosorientherapyremix"
                if (track === 'bailamosorientherapyremix') {
                    track = 'Bailamos (Orientherapy Remix)';
                } else {
                    // General formatting improvements
                    track = track.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add spaces between camelCase
                    track = track.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2'); // Add spaces between consecutive capitals
                    track = track.replace(/-/g, ' '); // Replace hyphens with spaces
                    track = track.replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
                }
                
                const songKey = `${artist} - ${track}`;
                console.log('🔧 Created song key from URL:', songKey);
                
                // Create basic metadata entry
                this.songMetadata.set(songKey, {
                    title: track,
                    artist: artist,
                    artwork: this.getDefaultArtwork(artist),
                    duration: 'Unknown duration',
                    soundcloudUrl: url,
                    trackId: this.extractTrackId(url)
                });
                
                return songKey;
            }
        } catch (e) {
            console.log('❌ Failed to create song key from URL:', e.message);
        }
        return null;
    }

    clearForm() {
        document.getElementById('from-song').value = '';
        document.getElementById('to-song').value = '';
        document.getElementById('from-song-url').value = '';
        document.getElementById('to-song-url').value = '';
        document.getElementById('transition-notes').value = '';
        
        // Clear previews
        document.getElementById('from-song-preview').innerHTML = '';
        document.getElementById('from-song-preview').classList.remove('loaded');
        document.getElementById('to-song-preview').innerHTML = '';
        document.getElementById('to-song-preview').classList.remove('loaded');
        
        document.getElementById('from-song').focus();
    }

    // ===== GRAPH MANAGEMENT =====
    updateGraph() {
        this.graph.clear();
        
        // Initialize graph with all songs
        for (const song of this.songs) {
            this.graph.set(song, []);
        }

        // Add edges from transitions
        for (const transition of this.transitions) {
            if (!this.graph.has(transition.from)) {
                this.graph.set(transition.from, []);
            }
            this.graph.get(transition.from).push(transition.to);
        }
    }

    findLongestChain() {
        const selectedSong = document.getElementById('song-search').value.trim();
        
        if (!selectedSong) {
            alert('Please search for and select a song first');
            return;
        }

        // Check if the selected song exists in our songs
        if (!this.songs.has(selectedSong)) {
            alert('Please select a valid song from the search results');
            return;
        }

        const longestChain = this.findLongestPathFrom(selectedSong);
        
        if (longestChain.length === 0) {
            this.showNotification('No transitions found from this song', 'info');
            return;
        }

        this.displayChain(longestChain);
        this.showNotification(`Found chain of ${longestChain.length} songs!`, 'success');
    }

    findLongestPathFrom(startSong) {
        // Use DFS with memoization to find the longest path
        const visited = new Set();
        const memo = new Map();
        
        const dfs = (song) => {
            if (memo.has(song)) {
                return memo.get(song);
            }
            
            if (visited.has(song)) {
                return [];
            }
            
            visited.add(song);
            const neighbors = this.graph.get(song) || [];
            
            if (neighbors.length === 0) {
                visited.delete(song);
                memo.set(song, [song]);
                return [song];
            }
            
            let maxPath = [];
            for (const neighbor of neighbors) {
                const path = dfs(neighbor);
                if (path.length > maxPath.length) {
                    maxPath = path;
                }
            }
            
            visited.delete(song);
            const result = [song, ...maxPath];
            memo.set(song, result);
            return result;
        };
        
        return dfs(startSong);
    }

    displayChain(chain) {
        const resultsSection = document.getElementById('results-section');
        const chainDisplay = document.getElementById('chain-display');
        const chainLength = document.getElementById('chain-length');
        const chainDuration = document.getElementById('chain-duration');

        // Display the chain
        chainDisplay.innerHTML = '';
        for (let i = 0; i < chain.length; i++) {
            const song = chain[i];
            const metadata = this.songMetadata.get(song);
            const chainItem = document.createElement('div');
            chainItem.className = 'chain-item';
            
            chainItem.innerHTML = `
                <div class="chain-number">${i + 1}</div>
                <div class="chain-song">
                    ${this.renderChainSongWithMetadata(song, metadata)}
                </div>
                ${i < chain.length - 1 ? '<div class="chain-arrow">→</div>' : ''}
            `;
            
            chainDisplay.appendChild(chainItem);
        }

        // Update stats
        chainLength.textContent = chain.length;
        chainDuration.textContent = this.formatDuration(chain.length * 3.5); // Assuming 3.5 min per song
        
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    renderChainSongWithMetadata(songKey, metadata) {
        if (metadata && metadata.artwork) {
            return `
                <div class="chain-song-with-artwork">
                    <img src="${metadata.artwork}" alt="${metadata.title}" class="chain-song-artwork">
                    <div class="chain-song-info">
                        <div class="chain-song-title">${metadata.title}</div>
                        <div class="chain-song-artist">${metadata.artist}</div>
                    </div>
                </div>
            `;
        } else {
            return `<span class="chain-song-text">${songKey}</span>`;
        }
    }

    formatDuration(minutes) {
        const mins = Math.floor(minutes);
        const secs = Math.round((minutes - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    toggleGraph() {
        const graphContainer = document.getElementById('graph-container');
        const isVisible = graphContainer.style.display !== 'none';
        
        if (isVisible) {
            graphContainer.style.display = 'none';
        } else {
            graphContainer.style.display = 'block';
            this.drawGraph();
        }
    }

    drawGraph() {
        const canvas = document.getElementById('graph-canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.transitions.length === 0) {
            ctx.fillStyle = '#718096';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No transitions to display', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Enhanced force-directed graph layout with album covers
        const nodes = Array.from(this.songs);
        const positions = new Map();
        const nodeSize = 60; // Increased size to accommodate artwork
        
        // Initialize positions in a circle
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 3;
        
        nodes.forEach((song, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            positions.set(song, { x, y });
        });

        // Draw edges (transitions)
        ctx.strokeStyle = '#cbd5e0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        for (const transition of this.transitions) {
            const from = positions.get(transition.from);
            const to = positions.get(transition.to);
            
            if (from && to) {
                // Calculate arrow direction
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > nodeSize) {
                    const unitX = dx / length;
                    const unitY = dy / length;
                    
                    const startX = from.x + unitX * (nodeSize / 2);
                    const startY = from.y + unitY * (nodeSize / 2);
                    const endX = to.x - unitX * (nodeSize / 2);
                    const endY = to.y - unitY * (nodeSize / 2);
                    
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                    
                    // Draw arrow
                    const arrowLength = 10;
                    const arrowAngle = Math.PI / 6;
                    
                    const angle = Math.atan2(dy, dx);
                    const arrowX1 = endX - arrowLength * Math.cos(angle - arrowAngle);
                    const arrowY1 = endY - arrowLength * Math.sin(angle - arrowAngle);
                    const arrowX2 = endX - arrowLength * Math.cos(angle + arrowAngle);
                    const arrowY2 = endY - arrowLength * Math.sin(angle + arrowAngle);
                    
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(arrowX1, arrowY1);
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(arrowX2, arrowY2);
                    ctx.stroke();
                    ctx.setLineDash([5, 5]);
                }
            }
        }

        // Draw nodes (songs) with album artwork
        ctx.setLineDash([]);
        for (const [song, pos] of positions) {
            const metadata = this.songMetadata.get(song);
            
            // Draw album artwork background (circle)
            if (metadata && metadata.artwork) {
                // Create a circular clip path for the artwork
                ctx.save();
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeSize / 2, 0, 2 * Math.PI);
                ctx.clip();
                
                // Load and draw the artwork
                const img = new Image();
                img.onload = () => {
                    // Calculate dimensions to fit in circle
                    const size = nodeSize;
                    const offsetX = pos.x - size / 2;
                    const offsetY = pos.y - size / 2;
                    ctx.drawImage(img, offsetX, offsetY, size, size);
                };
                img.src = metadata.artwork;
                
                ctx.restore();
            } else {
                // Fallback: colored circle with artist initial
                const artistName = this.extractArtistFromTitle(song) || song.split(' - ')[0] || '?';
                const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
                const colorIndex = artistName.charCodeAt(0) % colors.length;
                
                ctx.fillStyle = colors[colorIndex];
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeSize / 2, 0, 2 * Math.PI);
                ctx.fill();
                
                // Artist initial
                ctx.fillStyle = 'white';
                ctx.font = 'bold 20px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(artistName.charAt(0).toUpperCase(), pos.x, pos.y + 6);
            }
            
            // Node border
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeSize / 2, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Song information below the node
            ctx.fillStyle = '#2d3748';
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            
            if (metadata && metadata.artist && metadata.title) {
                // Show artist - track format
                const displayText = `${metadata.artist} - ${metadata.title}`;
                ctx.fillText(this.truncateText(displayText, 20), pos.x, pos.y + nodeSize / 2 + 15);
            } else {
                // Fallback to original song text
                ctx.fillText(this.truncateText(song, 20), pos.x, pos.y + nodeSize / 2 + 15);
            }
        }
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // ===== RENDERING TRANSITIONS =====
    renderTransitions() {
        const container = document.getElementById('transitions-container');
        
        if (this.transitions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #718096; font-style: italic;">No transitions added yet. Add your first transition above!</p>';
            return;
        }

        container.innerHTML = '';
        
        for (const transition of this.transitions) {
            const transitionElement = document.createElement('div');
            transitionElement.className = 'transition-item';
            
            // Get metadata for both songs
            const fromMetadata = transition.metadata?.from || this.songMetadata.get(transition.from);
            const toMetadata = transition.metadata?.to || this.songMetadata.get(transition.to);
            
            transitionElement.innerHTML = `
                <div class="transition-header">
                    <div class="transition-songs">
                        ${this.renderSongWithMetadata(transition.from, fromMetadata)} 
                        <span class="transition-arrow">→</span> 
                        ${this.renderSongWithMetadata(transition.to, toMetadata)}
                    </div>
                    <button class="delete-btn" onclick="app.deleteTransition(${transition.id})">Delete</button>
                </div>
                ${transition.notes ? `<div class="transition-notes">${transition.notes}</div>` : ''}
            `;
            
            container.appendChild(transitionElement);
        }
    }

    renderSongWithMetadata(songKey, metadata) {
        if (metadata && metadata.artwork) {
            return `
                <div class="song-with-artwork">
                    <img src="${metadata.artwork}" alt="${metadata.title}" class="song-artwork-small">
                    <div class="song-info">
                        <div class="song-title">${metadata.title}</div>
                        <div class="song-artist">${metadata.artist}</div>
                    </div>
                </div>
            `;
        } else {
            // Fallback to text display
            return `<span class="song-text">${songKey}</span>`;
        }
    }

    deleteTransition(id) {
        if (confirm('Are you sure you want to delete this transition?')) {
            const index = this.transitions.findIndex(t => t.id === id);
            if (index !== -1) {
                const transition = this.transitions[index];
                this.transitions.splice(index, 1);
                
                // Remove songs if they're no longer used
                this.updateSongSet();
                this.updateGraph();
                this.saveData();
                this.renderTransitions();
                
                this.showNotification('Transition deleted successfully!', 'success');
            }
        }
    }

    updateSongSet() {
        this.songs.clear();
        for (const transition of this.transitions) {
            this.songs.add(transition.from);
            this.songs.add(transition.to);
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.transitions = [];
            this.songs.clear();
            this.songMetadata.clear();
            this.graph.clear();
            this.saveData();
            this.renderTransitions();
            document.getElementById('results-section').style.display = 'none';
            document.getElementById('graph-container').style.display = 'none';
            
            this.showNotification('All data cleared successfully!', 'success');
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DJTransitionsApp();
}); 