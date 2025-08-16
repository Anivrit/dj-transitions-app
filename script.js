class DJTransitionsApp {
    constructor() {
        this.transitions = [];
        this.songs = new Set();
        this.graph = new Map(); // Adjacency list representation
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateSongSelect();
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

        // Enter key support for form inputs
        document.getElementById('from-song').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('to-song').focus();
        });

        document.getElementById('to-song').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTransition();
        });
    }

    addTransition() {
        const fromSong = document.getElementById('from-song').value.trim();
        const toSong = document.getElementById('to-song').value.trim();
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
            timestamp: new Date().toISOString()
        };

        this.transitions.push(transition);
        this.songs.add(fromSong);
        this.songs.add(toSong);
        this.updateGraph();
        this.saveData();
        this.updateSongSelect();
        this.renderTransitions();
        this.clearForm();

        // Show success message
        this.showNotification('Transition added successfully!', 'success');
    }

    clearForm() {
        document.getElementById('from-song').value = '';
        document.getElementById('to-song').value = '';
        document.getElementById('transition-notes').value = '';
        document.getElementById('from-song').focus();
    }

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
        const selectedSong = document.getElementById('song-select').value;
        
        if (!selectedSong) {
            alert('Please select a song first');
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
            const chainItem = document.createElement('div');
            chainItem.className = 'chain-item';
            
            chainItem.innerHTML = `
                <div class="chain-number">${i + 1}</div>
                <div class="chain-song">${song}</div>
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

        // Simple force-directed graph layout
        const nodes = Array.from(this.songs);
        const positions = new Map();
        const nodeRadius = 20;
        
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
                
                if (length > nodeRadius * 2) {
                    const unitX = dx / length;
                    const unitY = dy / length;
                    
                    const startX = from.x + unitX * nodeRadius;
                    const startY = from.y + unitY * nodeRadius;
                    const endX = to.x - unitX * nodeRadius;
                    const endY = to.y - unitY * nodeRadius;
                    
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

        // Draw nodes (songs)
        ctx.setLineDash([]);
        for (const [song, pos] of positions) {
            // Node circle
            ctx.fillStyle = '#667eea';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Node border
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Song name
            ctx.fillStyle = '#2d3748';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(this.truncateText(song, 15), pos.x, pos.y + 4);
        }
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    updateSongSelect() {
        const songSelect = document.getElementById('song-select');
        const currentValue = songSelect.value;
        
        songSelect.innerHTML = '<option value="">Choose a song...</option>';
        
        for (const song of Array.from(this.songs).sort()) {
            const option = document.createElement('option');
            option.value = song;
            option.textContent = song;
            songSelect.appendChild(option);
        }
        
        songSelect.value = currentValue;
    }

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
            
            transitionElement.innerHTML = `
                <div class="transition-header">
                    <div class="transition-songs">
                        ${transition.from} <span class="transition-arrow">→</span> ${transition.to}
                    </div>
                    <button class="delete-btn" onclick="app.deleteTransition(${transition.id})">Delete</button>
                </div>
                ${transition.notes ? `<div class="transition-notes">${transition.notes}</div>` : ''}
            `;
            
            container.appendChild(transitionElement);
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
                this.updateSongSelect();
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
            this.graph.clear();
            this.saveData();
            this.updateSongSelect();
            this.renderTransitions();
            document.getElementById('results-section').style.display = 'none';
            document.getElementById('graph-container').style.display = 'none';
            
            this.showNotification('All data cleared successfully!', 'success');
        }
    }

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

    saveData() {
        try {
            localStorage.setItem('djTransitions', JSON.stringify({
                transitions: this.transitions,
                songs: Array.from(this.songs)
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
                this.updateGraph();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DJTransitionsApp();
}); 