# 🎵 DJ Transitions Tracker

A web application for DJs to track song transitions and discover the longest possible chains of songs that work well together.

## ✨ Features

- **Add Transitions**: Input pairs of songs that transition well together
- **Graph Visualization**: Visual representation of your transition network
- **Longest Chain Finder**: Discover the longest possible chain starting from any song
- **Persistent Storage**: All data is saved locally in your browser
- **Modern UI**: Clean, responsive design that works on all devices
- **Notes Support**: Add notes explaining why transitions work well

## 🚀 How to Use

### 1. Getting Started
- Open `index.html` in your web browser
- No installation or setup required - it's a pure web application

### 2. Adding Transitions
1. In the "Add New Transition" section, enter the first song (e.g., "Daft Punk - Around the World")
2. Enter the second song (e.g., "Justice - Genesis")
3. Optionally add notes about why the transition works
4. Click "Add Transition"

### 3. Finding Longest Chains
1. Select a song from the dropdown in the "Find Longest Chain" section
2. Click "Find Longest Chain"
3. View the longest possible sequence of songs starting from your selection

### 4. Visualizing the Graph
- Click "Show/Hide Graph" to see a visual representation of your transitions
- Songs are represented as nodes, transitions as arrows
- The graph automatically updates as you add/remove transitions

### 5. Managing Your Data
- View all transitions in the "All Transitions" section
- Delete individual transitions as needed
- Use "Clear All Data" to start fresh

## 🔧 Technical Details

### Graph Algorithm
The application uses a **Directed Acyclic Graph (DAG)** to represent song transitions:
- Each song is a node
- Each transition is a directed edge
- The longest chain finder uses **Depth-First Search (DFS) with memoization** to efficiently find the longest path from any starting song

### Data Storage
- All data is stored locally in your browser's localStorage
- No external servers or databases required
- Data persists between browser sessions

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- No JavaScript frameworks required - pure vanilla JS
- Responsive design for mobile and desktop

## 📱 Example Usage

Here's how a DJ might use this app:

1. **Add some transitions:**
   - "Daft Punk - Around the World" → "Justice - Genesis"
   - "Justice - Genesis" → "Gesaffelstein - Pursuit"
   - "Gesaffelstein - Pursuit" → "SebastiAn - Motor"

2. **Find the longest chain:**
   - Select "Daft Punk - Around the World"
   - Discover it can lead to a 4-song chain

3. **Use for set planning:**
   - Plan your DJ sets based on proven transitions
   - Find alternative paths when you need to change direction
   - Build longer sets by connecting multiple chains

## 🎯 Use Cases

- **DJ Set Planning**: Plan your sets based on proven transitions
- **Music Discovery**: Find new song combinations that work well
- **Performance Analysis**: Track which transitions work best
- **Collaboration**: Share transition knowledge with other DJs
- **Practice**: Build muscle memory for smooth transitions

## 🛠️ Customization

The application is built with vanilla HTML, CSS, and JavaScript, making it easy to customize:

- Modify colors and styling in `styles.css`
- Add new features in `script.js`
- Change the layout in `index.html`

## 🔮 Future Enhancements

Potential improvements that could be added:
- BPM (beats per minute) tracking for harmonic mixing
- Key detection for musical compatibility
- Export/import functionality for sharing transition libraries
- Advanced graph algorithms for finding optimal paths
- Integration with music streaming services
- Mobile app version

## 📄 License

This project is open source and available under the MIT License.

---

**Happy mixing! 🎧🎵** 