/* ==========================================
   ALGOSPHERE APPLICATION LOGIC (app.js)
========================================== */

// 1. CONFIGURATION & CONSTANTS
const ROWS = 22;
const COLS = 40;
let START_ROW = 11;
let START_COL = 8;
let END_ROW = 11;
let END_COL = 31;

// App States
let currentMode = 'pathfinding'; // 'pathfinding' or 'sorting'
let isRunning = false;
let stopRequested = false;

// Speed Control mapping
const speedSlider = document.getElementById('speed-slider');
const speedValLabel = document.getElementById('speed-val');

function getDelay() {
    const val = parseInt(speedSlider.value);
    // Map slider 1-100 to delay in ms (100 -> 1ms, 1 -> 1000ms)
    if (val > 90) return 2;
    if (val > 80) return 10;
    if (val > 60) return 25;
    if (val > 40) return 60;
    if (val > 20) return 150;
    if (val > 5) return 400;
    return 800;
}

function updateSpeedLabel() {
    const val = parseInt(speedSlider.value);
    if (val > 85) speedValLabel.textContent = 'Turbo';
    else if (val > 65) speedValLabel.textContent = 'Fast';
    else if (val > 35) speedValLabel.textContent = 'Medium';
    else if (val > 10) speedValLabel.textContent = 'Slow';
    else speedValLabel.textContent = 'Snail';
}

speedSlider.addEventListener('input', updateSpeedLabel);
updateSpeedLabel();

// Helper Sleep Promise
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== TABS NAVIGATION ====================
const btnPathfinding = document.getElementById('btn-mode-pathfinding');
const btnSorting = document.getElementById('btn-mode-sorting');
const secPathfinding = document.getElementById('section-pathfinding');
const secSorting = document.getElementById('section-sorting');

btnPathfinding.addEventListener('click', () => {
    if (isRunning) return;
    currentMode = 'pathfinding';
    btnPathfinding.classList.add('active');
    btnSorting.classList.remove('active');
    secPathfinding.classList.add('active');
    secSorting.classList.remove('active');
});

btnSorting.addEventListener('click', () => {
    if (isRunning) return;
    currentMode = 'sorting';
    btnSorting.classList.add('active');
    btnPathfinding.classList.remove('active');
    secSorting.classList.add('active');
    secPathfinding.classList.remove('active');
});

// ==================== PATHFINDING WORKSPACE ====================
let grid = []; // 2D array representation
let isDrawingWall = false;
let isMovingStart = false;
let isMovingEnd = false;

const gridBoard = document.getElementById('pathfinding-grid');

function initPathfindingGrid() {
    gridBoard.innerHTML = '';
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.id = `cell-${r}-${c}`;
            cell.setAttribute('data-row', r);
            cell.setAttribute('data-col', c);
            
            // Place start/end styles
            if (r === START_ROW && c === START_COL) cell.classList.add('start');
            if (r === END_ROW && c === END_COL) cell.classList.add('end');

            // Mouse Events
            cell.addEventListener('mousedown', (e) => handleMouseDown(e, r, c));
            cell.addEventListener('mouseenter', (e) => handleMouseEnter(e, r, c));
            
            gridBoard.appendChild(cell);
            row.push({
                r,
                c,
                isWall: false,
                isVisited: false,
                distance: Infinity,
                heuristic: Infinity,
                totalDistance: Infinity,
                parent: null
            });
        }
        grid.push(row);
    }
    
    // Mouse Up globally
    document.addEventListener('mouseup', () => {
        isDrawingWall = false;
        isMovingStart = false;
        isMovingEnd = false;
    });
}

function handleMouseDown(e, r, c) {
    if (isRunning) return;
    e.preventDefault();
    if (r === START_ROW && c === START_COL) {
        isMovingStart = true;
    } else if (r === END_ROW && c === END_COL) {
        isMovingEnd = true;
    } else {
        isDrawingWall = true;
        toggleWall(r, c);
    }
}

function handleMouseEnter(e, r, c) {
    if (isRunning) return;
    if (isMovingStart) {
        moveStartEnd(r, c, true);
    } else if (isMovingEnd) {
        moveStartEnd(r, c, false);
    } else if (isDrawingWall) {
        toggleWall(r, c);
    }
}

function toggleWall(r, c) {
    if ((r === START_ROW && c === START_COL) || (r === END_ROW && c === END_COL)) return;
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    grid[r][c].isWall = !grid[r][c].isWall;
    if (grid[r][c].isWall) {
        cellEl.classList.add('wall');
    } else {
        cellEl.classList.remove('wall');
    }
}

function moveStartEnd(r, c, isStart) {
    if (grid[r][c].isWall) return;
    if (isStart) {
        if (r === END_ROW && c === END_COL) return;
        document.getElementById(`cell-${START_ROW}-${START_COL}`).classList.remove('start');
        START_ROW = r;
        START_COL = c;
        document.getElementById(`cell-${r}-${c}`).classList.add('start');
    } else {
        if (r === START_ROW && c === START_COL) return;
        document.getElementById(`cell-${END_ROW}-${END_COL}`).classList.remove('end');
        END_ROW = r;
        END_COL = c;
        document.getElementById(`cell-${r}-${c}`).classList.add('end');
    }
}

// Clear visual overlays (keep walls)
function clearPathVisuals() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cellEl = document.getElementById(`cell-${r}-${c}`);
            cellEl.classList.remove('visited', 'visiting', 'shortest-path');
            
            // Reset grid node values
            grid[r][c].isVisited = false;
            grid[r][c].distance = Infinity;
            grid[r][c].heuristic = Infinity;
            grid[r][c].totalDistance = Infinity;
            grid[r][c].parent = null;
        }
    }
    document.getElementById('stat-path-visited').textContent = '0';
    document.getElementById('stat-path-length').textContent = '0';
    setPathStatus('Idle');
}

// Full reset (wipes walls too)
function resetPathfindingBoard() {
    clearPathVisuals();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            grid[r][c].isWall = false;
            document.getElementById(`cell-${r}-${c}`).classList.remove('wall');
        }
    }
}

function setPathStatus(status, className = 'status-idle') {
    const el = document.getElementById('stat-path-status');
    el.textContent = status;
    el.className = `val ${className}`;
}

// ==================== PATHFINDING ALGORITHMS ====================

// Fetch neighbors
function getNeighbors(node) {
    const neighbors = [];
    const { r, c } = node;
    
    if (r > 0) neighbors.push(grid[r - 1][c]);
    if (r < ROWS - 1) neighbors.push(grid[r + 1][c]);
    if (c > 0) neighbors.push(grid[r][c - 1]);
    if (c < COLS - 1) neighbors.push(grid[r][c + 1]);
    
    return neighbors.filter(n => !n.isWall);
}

// Visual Backtracking of Path
async function animatePath(targetNode) {
    const path = [];
    let curr = targetNode;
    while (curr !== null) {
        path.unshift(curr);
        curr = curr.parent;
    }

    document.getElementById('stat-path-length').textContent = path.length.toString();

    for (let i = 0; i < path.length; i++) {
        if (stopRequested) return;
        const node = path[i];
        const cellEl = document.getElementById(`cell-${node.r}-${node.c}`);
        if (!cellEl.classList.contains('start') && !cellEl.classList.contains('end')) {
            cellEl.classList.add('shortest-path');
        }
        await sleep(25);
    }
}

async function runDijkstra() {
    const visitedNodesInOrder = [];
    const unvisitedNodes = [];
    
    // Setup Start Node
    grid[START_ROW][START_COL].distance = 0;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            unvisitedNodes.push(grid[r][c]);
        }
    }

    while (unvisitedNodes.length > 0) {
        if (stopRequested) return false;
        
        // Sort unvisited by distance
        unvisitedNodes.sort((a, b) => a.distance - b.distance);
        const closestNode = unvisitedNodes.shift();
        
        // If wall, skip
        if (closestNode.isWall) continue;
        // If distance is infinity, we're trapped
        if (closestNode.distance === Infinity) break;
        
        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);
        
        // Update stats counter
        document.getElementById('stat-path-visited').textContent = visitedNodesInOrder.length;

        // Animate visiting
        const cellEl = document.getElementById(`cell-${closestNode.r}-${closestNode.c}`);
        if (!cellEl.classList.contains('start') && !cellEl.classList.contains('end')) {
            cellEl.classList.add('visiting');
            await sleep(getDelay());
            cellEl.classList.remove('visiting');
            cellEl.classList.add('visited');
        }

        // Check destination reach
        if (closestNode.r === END_ROW && closestNode.c === END_COL) {
            await animatePath(closestNode);
            return true;
        }

        // Update neighbors
        const neighbors = getNeighbors(closestNode);
        for (const neighbor of neighbors) {
            const tentativeDistance = closestNode.distance + 1;
            if (tentativeDistance < neighbor.distance) {
                neighbor.distance = tentativeDistance;
                neighbor.parent = closestNode;
            }
        }
    }
    return false; // Path not found
}

async function runAStar() {
    const visitedNodesInOrder = [];
    const openSet = []; // Nodes to visit
    
    // Heuristic: Manhattan Distance
    const getHeuristic = (node) => Math.abs(node.r - END_ROW) + Math.abs(node.c - END_COL);
    
    const startNode = grid[START_ROW][START_COL];
    startNode.distance = 0;
    startNode.heuristic = getHeuristic(startNode);
    startNode.totalDistance = startNode.heuristic;
    openSet.push(startNode);

    while (openSet.length > 0) {
        if (stopRequested) return false;

        // Sort by f-score (totalDistance) then h-score
        openSet.sort((a, b) => a.totalDistance - b.totalDistance || a.heuristic - b.heuristic);
        const current = openSet.shift();

        if (current.isWall) continue;
        
        current.isVisited = true;
        visitedNodesInOrder.push(current);
        document.getElementById('stat-path-visited').textContent = visitedNodesInOrder.length;

        // Animate
        const cellEl = document.getElementById(`cell-${current.r}-${current.c}`);
        if (!cellEl.classList.contains('start') && !cellEl.classList.contains('end')) {
            cellEl.classList.add('visiting');
            await sleep(getDelay());
            cellEl.classList.remove('visiting');
            cellEl.classList.add('visited');
        }

        if (current.r === END_ROW && current.c === END_COL) {
            await animatePath(current);
            return true;
        }

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (neighbor.isVisited) continue;
            
            const gScore = current.distance + 1;
            
            if (gScore < neighbor.distance) {
                neighbor.distance = gScore;
                neighbor.heuristic = getHeuristic(neighbor);
                neighbor.totalDistance = neighbor.distance + neighbor.heuristic;
                neighbor.parent = current;
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    return false;
}

async function runBFS() {
    const queue = [];
    const visitedNodesInOrder = [];
    
    const startNode = grid[START_ROW][START_COL];
    startNode.isVisited = true;
    queue.push(startNode);

    while (queue.length > 0) {
        if (stopRequested) return false;

        const current = queue.shift();
        visitedNodesInOrder.push(current);
        document.getElementById('stat-path-visited').textContent = visitedNodesInOrder.length;

        // Animate
        const cellEl = document.getElementById(`cell-${current.r}-${current.c}`);
        if (!cellEl.classList.contains('start') && !cellEl.classList.contains('end')) {
            cellEl.classList.add('visiting');
            await sleep(getDelay());
            cellEl.classList.remove('visiting');
            cellEl.classList.add('visited');
        }

        if (current.r === END_ROW && current.c === END_COL) {
            await animatePath(current);
            return true;
        }

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited && !neighbor.isWall) {
                neighbor.isVisited = true;
                neighbor.parent = current;
                queue.push(neighbor);
            }
        }
    }
    return false;
}

async function runDFS() {
    const stack = [];
    const visitedNodesInOrder = [];
    
    const startNode = grid[START_ROW][START_COL];
    stack.push(startNode);

    while (stack.length > 0) {
        if (stopRequested) return false;

        const current = stack.pop();

        if (current.isVisited) continue;
        current.isVisited = true;
        visitedNodesInOrder.push(current);
        document.getElementById('stat-path-visited').textContent = visitedNodesInOrder.length;

        // Animate
        const cellEl = document.getElementById(`cell-${current.r}-${current.c}`);
        if (!cellEl.classList.contains('start') && !cellEl.classList.contains('end')) {
            cellEl.classList.add('visiting');
            await sleep(getDelay());
            cellEl.classList.remove('visiting');
            cellEl.classList.add('visited');
        }

        if (current.r === END_ROW && current.c === END_COL) {
            await animatePath(current);
            return true;
        }

        const neighbors = getNeighbors(current);
        // Push neighbors to stack
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited) {
                neighbor.parent = current;
                stack.push(neighbor);
            }
        }
    }
    return false;
}

// Generate Maze (Recursive Backtracker / Randomized DFS)
async function generateRandomMaze() {
    if (isRunning) return;
    isRunning = true;
    resetPathfindingBoard();
    setPathStatus('Generating Maze...', 'status-running');

    // Fill the grid with walls initially
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if ((r === START_ROW && c === START_COL) || (r === END_ROW && c === END_COL)) continue;
            grid[r][c].isWall = true;
            document.getElementById(`cell-${r}-${c}`).classList.add('wall');
        }
    }

    const wallsToOpen = [];
    const visited = Array(ROWS).fill().map(() => Array(COLS).fill(false));

    async function carve(r, c) {
        visited[r][c] = true;
        
        // Neighbors at distance 2
        const directions = [
            [-2, 0], [2, 0], [0, -2], [0, 2]
        ];
        
        // Shuffle directions
        directions.sort(() => Math.random() - 0.5);

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1) {
                if (!visited[nr][nc]) {
                    // Open cell and cell between
                    visited[nr][nc] = true;
                    
                    const betweenR = r + dr / 2;
                    const betweenC = c + dc / 2;

                    wallsToOpen.push({ r: nr, c: nc });
                    wallsToOpen.push({ r: betweenR, c: betweenC });
                    
                    await carve(nr, nc);
                }
            }
        }
    }

    // Start carving from near start point
    await carve(1, 1);

    // Open Start and Target surrounding
    wallsToOpen.push({ r: START_ROW, c: START_COL });
    wallsToOpen.push({ r: END_ROW, c: END_COL });
    // Carve pathways
    for (const wall of wallsToOpen) {
        grid[wall.r][wall.c].isWall = false;
        document.getElementById(`cell-${wall.r}-${wall.c}`).classList.remove('wall');
        await sleep(5);
    }

    setPathStatus('Maze Ready', 'status-complete');
    isRunning = false;
}

// Start Visualizing
const btnStartPath = document.getElementById('btn-path-start');
btnStartPath.addEventListener('click', async () => {
    if (isRunning) return;
    isRunning = true;
    stopRequested = false;
    clearPathVisuals();
    setPathStatus('Searching...', 'status-running');

    const algo = document.getElementById('algo-pathfinding').value;
    let found = false;

    if (algo === 'dijkstra') found = await runDijkstra();
    else if (algo === 'astar') found = await runAStar();
    else if (algo === 'bfs') found = await runBFS();
    else if (algo === 'dfs') found = await runDFS();

    if (stopRequested) {
        setPathStatus('Stopped', 'status-idle');
    } else if (found) {
        setPathStatus('Completed', 'status-complete');
        showToastNotification("Path found!");
    } else {
        setPathStatus('No path found!', 'status-error');
        showToastNotification("Path blocked!");
    }
    isRunning = false;
});

document.getElementById('btn-path-clear').addEventListener('click', () => {
    if (isRunning) {
        stopRequested = true;
        return;
    }
    clearPathVisuals();
});

document.getElementById('btn-path-reset').addEventListener('click', () => {
    if (isRunning) {
        stopRequested = true;
        return;
    }
    resetPathfindingBoard();
});

document.getElementById('btn-path-maze').addEventListener('click', generateRandomMaze);


// ==================== SORTING WORKSPACE ====================
let array = [];
let sortComparisons = 0;
let sortAccesses = 0;
let sortStartTime = 0;
let sortInterval = null;

const sortingContainer = document.getElementById('sorting-container');
const arraySizeSlider = document.getElementById('array-size-slider');
const arraySizeVal = document.getElementById('array-size-val');

function initSortingArray() {
    sortingContainer.innerHTML = '';
    array = [];
    sortComparisons = 0;
    sortAccesses = 0;
    updateSortStats(0);

    const size = parseInt(arraySizeSlider.value);
    arraySizeVal.textContent = size;

    for (let i = 0; i < size; i++) {
        const val = Math.floor(Math.random() * 92) + 8; // Values between 8 and 100 (%)
        array.push(val);

        const bar = document.createElement('div');
        bar.className = 'array-bar';
        bar.style.height = `${val}%`;
        bar.id = `bar-${i}`;
        sortingContainer.appendChild(bar);
    }
    setSortStatus('Idle');
}

arraySizeSlider.addEventListener('input', () => {
    if (isRunning) return;
    initSortingArray();
});

document.getElementById('btn-sort-shuffle').addEventListener('click', () => {
    if (isRunning) return;
    initSortingArray();
});

function updateSortStats(elapsed = 0) {
    document.getElementById('stat-sort-comparisons').textContent = sortComparisons;
    document.getElementById('stat-sort-accesses').textContent = sortAccesses;
    document.getElementById('stat-sort-time').textContent = `${elapsed}ms`;
}

function setSortStatus(status, className = 'status-idle') {
    const el = document.getElementById('stat-sort-status');
    el.textContent = status;
    el.className = `val ${className}`;
}

// Helpers for sorting animations
async function highlightComparing(indices, isComparing = true) {
    indices.forEach(idx => {
        const bar = document.getElementById(`bar-${idx}`);
        if (bar) {
            if (isComparing) bar.classList.add('comparing');
            else bar.classList.remove('comparing');
        }
    });
}

async function highlightWriting(index, val) {
    const bar = document.getElementById(`bar-${index}`);
    if (bar) {
        bar.classList.add('writing');
        bar.style.height = `${val}%`;
        await sleep(getDelay());
        bar.classList.remove('writing');
    }
}

// Swap values in DOM
async function swapBars(idx1, idx2) {
    const bar1 = document.getElementById(`bar-${idx1}`);
    const bar2 = document.getElementById(`bar-${idx2}`);
    
    if (bar1 && bar2) {
        bar1.classList.add('writing');
        bar2.classList.add('writing');
        
        const tempHeight = bar1.style.height;
        bar1.style.height = bar2.style.height;
        bar2.style.height = tempHeight;
        
        await sleep(getDelay());
        
        bar1.classList.remove('writing');
        bar2.classList.remove('writing');
    }
}

async function animateSortedCheck() {
    for (let i = 0; i < array.length; i++) {
        if (stopRequested) break;
        const bar = document.getElementById(`bar-${i}`);
        if (bar) bar.classList.add('sorted');
        await sleep(10);
    }
}

// ==================== SORTING ALGORITHMS ====================

// 1. Bubble Sort
async function bubbleSort() {
    const len = array.length;
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < len - i - 1; j++) {
            if (stopRequested) return;
            
            sortComparisons++;
            sortAccesses += 2;
            updateSortStats(Date.now() - sortStartTime);

            await highlightComparing([j, j + 1], true);
            await sleep(getDelay());

            if (array[j] > array[j + 1]) {
                const temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
                
                await swapBars(j, j + 1);
                sortAccesses += 2;
            }
            await highlightComparing([j, j + 1], false);
        }
    }
}

// 2. Insertion Sort
async function insertionSort() {
    const len = array.length;
    for (let i = 1; i < len; i++) {
        let key = array[i];
        let j = i - 1;
        sortAccesses++;
        
        await highlightComparing([i], true);
        
        while (j >= 0 && array[j] > key) {
            if (stopRequested) return;
            sortComparisons++;
            sortAccesses += 2;
            updateSortStats(Date.now() - sortStartTime);

            await highlightComparing([j, j + 1], true);
            array[j + 1] = array[j];
            
            await highlightWriting(j + 1, array[j]);
            await highlightComparing([j, j + 1], false);
            j = j - 1;
        }
        array[j + 1] = key;
        await highlightWriting(j + 1, key);
        sortAccesses++;
    }
}

// 3. Quick Sort
async function quickSort(start = 0, end = array.length - 1) {
    if (start >= end) return;
    if (stopRequested) return;

    let pivotIdx = await partition(start, end);
    await quickSort(start, pivotIdx - 1);
    await quickSort(pivotIdx + 1, end);
}

async function partition(start, end) {
    let pivotValue = array[end];
    let pivotIndex = start;
    sortAccesses++;

    for (let i = start; i < end; i++) {
        if (stopRequested) return;
        sortComparisons++;
        sortAccesses++;
        updateSortStats(Date.now() - sortStartTime);

        await highlightComparing([i, end], true);
        if (array[i] < pivotValue) {
            let temp = array[i];
            array[i] = array[pivotIndex];
            array[pivotIndex] = temp;
            
            await swapBars(i, pivotIndex);
            sortAccesses += 2;
            pivotIndex++;
        }
        await highlightComparing([i, end], false);
    }
    
    let temp = array[pivotIndex];
    array[pivotIndex] = array[end];
    array[end] = temp;
    
    await swapBars(pivotIndex, end);
    sortAccesses += 2;
    return pivotIndex;
}

// 4. Merge Sort
async function mergeSort(start = 0, end = array.length - 1) {
    if (start >= end) return;
    if (stopRequested) return;
    
    const mid = Math.floor((start + end) / 2);
    await mergeSort(start, mid);
    await mergeSort(mid + 1, end);
    await merge(start, mid, end);
}

async function merge(start, mid, end) {
    const left = array.slice(start, mid + 1);
    const right = array.slice(mid + 1, end + 1);
    sortAccesses += (left.length + right.length);

    let i = 0, j = 0, k = start;
    
    while (i < left.length && j < right.length) {
        if (stopRequested) return;
        sortComparisons++;
        sortAccesses += 2;
        updateSortStats(Date.now() - sortStartTime);

        await highlightComparing([start + i, mid + 1 + j], true);
        
        if (left[i] <= right[j]) {
            array[k] = left[i];
            await highlightWriting(k, left[i]);
            i++;
        } else {
            array[k] = right[j];
            await highlightWriting(k, right[j]);
            j++;
        }
        await highlightComparing([start + i - 1, mid + 1 + j - 1], false);
        k++;
    }

    while (i < left.length) {
        if (stopRequested) return;
        array[k] = left[i];
        await highlightWriting(k, left[i]);
        sortAccesses++;
        i++;
        k++;
    }

    while (j < right.length) {
        if (stopRequested) return;
        array[k] = right[j];
        await highlightWriting(k, right[j]);
        sortAccesses++;
        j++;
        k++;
    }
}

// Start Sorting Execution
const btnStartSort = document.getElementById('btn-sort-start');
btnStartSort.addEventListener('click', async () => {
    if (isRunning) {
        // Toggle stop requested
        stopRequested = true;
        return;
    }
    
    isRunning = true;
    stopRequested = false;
    
    // Reset bar visual styles
    document.querySelectorAll('.array-bar').forEach(bar => bar.className = 'array-bar');
    
    setSortStatus('Sorting...', 'status-running');
    btnStartSort.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg> Stop`;

    sortComparisons = 0;
    sortAccesses = 0;
    sortStartTime = Date.now();
    
    // Live ticking stats timer
    const statsTimer = setInterval(() => {
        updateSortStats(Date.now() - sortStartTime);
    }, 50);

    const algo = document.getElementById('algo-sorting').value;
    
    if (algo === 'bubble') await bubbleSort();
    else if (algo === 'insertion') await insertionSort();
    else if (algo === 'quick') await quickSort();
    else if (algo === 'merge') await mergeSort();

    clearInterval(statsTimer);
    updateSortStats(Date.now() - sortStartTime);

    if (stopRequested) {
        setSortStatus('Stopped', 'status-idle');
    } else {
        setSortStatus('Completed', 'status-complete');
        await animateSortedCheck();
        showToastNotification("Array sorted!");
    }

    btnStartSort.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Start Sorting`;
    isRunning = false;
});


// ==================== TOAST NOTIFICATION ====================
function showToastNotification(message) {
    const toast = document.getElementById('algoToast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}

// Initialize on Load
initPathfindingGrid();
initSortingArray();
