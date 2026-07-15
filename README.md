# 🔮 Algosphere

> An interactive, premium web visualizer for pathfinding and sorting algorithms. Built using clean modular structures with zero heavy library overhead.

**Algosphere** makes complex computational algorithms intuitive through color-coded status highlights, dynamic bar charts, customizable node grids, and real-time execution speeds.

---

## 🚀 Two Visualization Modes

### 1. Pathfinding Grid Visualizer
A 22x40 node-traversal canvas where you can build your own mazes, drag starting/ending coordinates, and watch graph search solvers explore pathways.
*   **Dijkstra's Algorithm**: Weighted pathfinder that guarantees the shortest route.
*   **A\* Search**: Heuristic-guided explorer (Manhattan distance) for fast path calculation.
*   **Breadth-First Search (BFS)**: Level-order search that guarantees the shortest path on unweighted grids.
*   **Depth-First Search (DFS)**: Deep-first exploration that probes corridors (does not guarantee shortest path).
*   **Recursive Backtracker Maze Generator**: Instantly generates complex wall corridors dynamically.

### 2. Sorting Array Visualizer
A dynamic bar chart array where you can select, shuffle, resize, and execute classical array sorting algorithms step-by-step.
*   **Quick Sort**: Partition-based dividing pivot sort (O(n log n)).
*   **Merge Sort**: Recursive splitting divide-and-conquer sort (O(n log n)).
*   **Insertion Sort**: Sequential shifting card-style sort (O(n²)).
*   **Bubble Sort**: Consecutive comparative swapping sort (O(n²)).
*   **Real-time Statistics**: Shows total comparative steps, array accesses, and timer milliseconds.

---

## ⚡ UX & Design Settings

*   **Fluid Transitions**: Pulse animations when visiting nodes, flashing cyan path markers, and green bars signifying sorted elements.
*   **Interactive Controls**: Click-and-drag to draw obstacles, slide element limits (10 to 120 elements), or adjust speed delays (Turbo to Snail).
*   **Cancel & Abort Safely**: Play, stop, or reset variables anytime. Running logic is automatically destroyed to prevent browser overlap thread conflicts.
*   **Clean Styling**: Minimal OKLCH color palettes with slate backgrounds and neon highlights.

---

## 💻 Local Setup & Running

Algosphere runs natively in modern web browsers without any prerequisite installation.

1.  Clone this repository:
    ```bash
    git clone https://github.com/your-username/algosphere.git
    cd algosphere
    ```
2.  Open `index.html` directly in a browser, or run Vite dev server:
    *   **Install Vite**: `npm install`
    *   **Start Local Dev**: `npm run dev`

---

## 🌐 Free Deployments

You can host Algosphere on **GitHub Pages** instantly:
1.  Push the files to a public GitHub repository.
2.  Go to **Settings** > **Pages** > Select the **main branch** as source.
3.  Deploy! Your interactive visualizer is now live.

---

## 🤝 Contributing

Contributions are welcome! If you would like to add new algorithms (e.g., A* Diagonal weights, Heap Sort, Radix Sort) or tweak the glassmorphic theme:
1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/CoolAlgorithm`).
3. Commit and push.
4. Submit a Pull Request.

---

## 📄 License

MIT License. See `LICENSE` for details.
