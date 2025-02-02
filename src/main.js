import { Grid } from './core/Grid.js';
import { Cursor } from './objects/Cursor.js';
import { StaticSquare } from './objects/StaticSquare.js';
import { Connection } from './objects/Connection.js';
import { ACCEPTED_KEYS, MOVE_DELAY } from './constants.js';
import { state, getSquareAt, isPositionOccupied } from './state/store.js';
import { getPreviewPathPoints } from './utils/pathfinding.js';
import { hasPathOverlap } from './utils/overlap.js';
import { SampleManager } from './audio/SampleManager.js';
import { ModeManager, MODES } from './modes/ModeManager.js';

//=============================================================================
// SETUP AND MAIN LOOP
//=============================================================================

async function setup() {
  createCanvas(windowWidth, windowHeight);
  state.grid = new Grid();
  state.cursor = new Cursor(state.grid);
  state.sampleManager = new SampleManager();
  state.modeManager = new ModeManager();
  await state.sampleManager.loadSamples();
  
  setupGridControls();
}

function setupGridControls() {
  const colsInput = document.getElementById('cols');
  const rowsInput = document.getElementById('rows');
  
  const updateGrid = () => {
    const cols = parseInt(colsInput.value);
    const rows = parseInt(rowsInput.value);
    if (!isNaN(cols) && !isNaN(rows)) {
      state.grid.setDimensions(cols, rows);
    }
  };
  
  colsInput.addEventListener('change', updateGrid);
  rowsInput.addEventListener('change', updateGrid);
}

function draw() {
  background(220);
  handleCursorMovement();
  state.modeManager.update();
  drawScene();
}

//=============================================================================
// MOVEMENT HANDLING
//=============================================================================

function handleCursorMovement() {
  if (millis() - state.lastMoveTime <= MOVE_DELAY) return;
  
  const movements = {
    [LEFT_ARROW]: [-1, 0],
    [RIGHT_ARROW]: [1, 0],
    [UP_ARROW]: [0, -1],
    [DOWN_ARROW]: [0, 1]
  };
  
  for (const [key, [dx, dy]] of Object.entries(movements)) {
    if (keyIsDown(key)) {
      state.cursor.move(dx, dy);
      state.lastMoveTime = millis();
      break;
    }
  }
}

//=============================================================================
// DRAWING FUNCTIONS
//=============================================================================

function drawScene() {
  // Only draw grid in arrange mode (trim mode handles its own grid drawing)
  if (state.modeManager.currentMode === MODES.ARRANGE) {
    state.grid.draw();
  }
  
  // Draw connections
  state.connections.forEach(conn => conn.draw(state.grid));
  
  if (state.connectMode && state.connectSourceSquare) {
    drawConnectionPreview();
  }
  
  drawSampleNames();
  state.modeManager.draw(state.grid);
  
  // Draw cursor last so it's always on top
  state.cursor.draw();
}

function drawConnectionPreview() {
  const previewPoints = getPreviewPathPoints(
    state.connectSourceSquare,
    state.connectVertices,
    state.cursor
  );
  
  drawPreviewPath(previewPoints);
  drawPreviewVertices();
}

function drawPreviewPath(previewPoints) {
  const hasOverlap = hasPathOverlap(previewPoints, state.connections);
  stroke(hasOverlap ? color(255, 0, 0, 64) : color(255, 0, 0, 128));
  strokeWeight(2);
  noFill();
  
  beginShape();
  previewPoints.forEach(p => {
    const pos = state.grid.getPointPosition(p.x, p.y);
    vertex(pos.x, pos.y);
  });
  endShape();
}

function drawPreviewVertices() {
  stroke(255, 0, 0);
  fill(255, 0, 0);
  state.connectVertices.forEach(v => {
    const pos = state.grid.getPointPosition(v.x, v.y);
    circle(pos.x, pos.y, 8);
  });
}

function drawSampleNames() {
  const sampleNames = state.sampleManager.getSampleNames();
  const keyMappings = state.sampleManager.getKeyMappings();
  const spacing = width / (sampleNames.length + 1);
  
  textAlign(CENTER, CENTER);
  textSize(14);
  fill(0);
  noStroke();
  
  sampleNames.forEach((name, i) => {
    const x = spacing * (i + 1);
    const y = 30;
    
    // Find the key for this sample
    const key = Object.entries(keyMappings).find(([k, n]) => n === name)?.[0];
    const displayText = key ? `${name} [${key}]` : name;
    
    text(displayText, x, y);
  });
}

//=============================================================================
// CONNECTION HANDLING
//=============================================================================

function handleConnectionStart(squareAtCursor) {
  state.connectMode = true;
  state.connectSourceSquare = squareAtCursor;
  state.connectVertices = [];
  console.log('Connection started from:', state.connectSourceSquare.key);
}

function handleConnectionComplete(squareAtCursor) {
  if (!isValidConnectionTarget(squareAtCursor)) return;
  
  const previewPoints = getPreviewPathPoints(
    state.connectSourceSquare,
    state.connectVertices,
    state.cursor
  );
  
  if (hasPathOverlap(previewPoints, state.connections)) {
    console.log('Cannot create connection with overlapping segments');
    return;
  }
  
  if (isConnectionDuplicate(squareAtCursor)) {
    console.log('Connection already exists between these squares');
    return;
  }
  
  createConnection(squareAtCursor);
}

function isValidConnectionTarget(square) {
  return square && square !== state.connectSourceSquare;
}

function isConnectionDuplicate(targetSquare) {
  return state.connections.some(conn => 
    conn.matches(state.connectSourceSquare, targetSquare)
  );
}

function createConnection(targetSquare) {
  console.log('Connected:', state.connectSourceSquare.key, 'to', targetSquare.key);
  state.connections.push(new Connection(
    state.connectSourceSquare,
    targetSquare,
    [...state.connectVertices]
  ));
}

function resetConnectionMode() {
  state.connectMode = false;
  state.connectSourceSquare = null;
  state.connectVertices = [];
}

//=============================================================================
// VERTEX HANDLING
//=============================================================================

function handleVertexPlacement(col, row) {
  if (getSquareAt(col, row)) return;
  
  const existingVertexIndex = findExistingVertex(col, row);
  
  if (existingVertexIndex !== -1) {
    removeVertex(existingVertexIndex);
  } else {
    tryAddVertex(col, row);
  }
}

function findExistingVertex(col, row) {
  return state.connectVertices.findIndex(v => 
    v.x === col && v.y === row
  );
}

function removeVertex(index) {
  state.connectVertices.splice(index, 1);
}

function tryAddVertex(col, row) {
  const testVertices = [...state.connectVertices, {x: col, y: row}];
  const testPoints = getPreviewPathPoints(
    state.connectSourceSquare,
    testVertices,
    state.cursor
  );
  
  if (!hasPathOverlap(testPoints, state.connections)) {
    state.connectVertices.push({x: col, y: row});
  } else {
    console.log('Cannot add vertex - would create overlapping segments');
  }
}

//=============================================================================
// SQUARE CREATION AND DELETION
//=============================================================================

function handleSquareCreation(key) {
  console.log('Creating square:', {
    mode: state.modeManager.currentMode,
    key,
    selectedSample: state.modeManager.selectedSampleKey
  });

  // In trim mode, only allow 't' key to create squares
  if (state.modeManager.currentMode === MODES.TRIM) {
    if (key === 't' && state.modeManager.selectedSampleKey) {
      const { col, row } = state.cursor;
      if (!isPositionOccupied(col, row)) {
        console.log('Creating trim marker at:', { col, row });
        state.staticSquares.push(
          new StaticSquare(
            state.grid, 
            col, 
            row, 
            't', 
            MODES.TRIM,
            state.modeManager.selectedSampleKey
          )
        );
      } else {
        console.log('Position occupied');
      }
    } else {
      console.log('Not creating trim marker:', { 
        isTKey: key === 't', 
        hasSelectedSample: Boolean(state.modeManager.selectedSampleKey) 
      });
    }
    return;
  }

  // In arrange mode, only allow sample keys to create squares
  if (state.modeManager.currentMode === MODES.ARRANGE && ACCEPTED_KEYS.includes(key)) {
    const { col, row } = state.cursor;
    if (!isPositionOccupied(col, row)) {
      console.log('Creating arrange square at:', { col, row, key });
      state.staticSquares.push(
        new StaticSquare(state.grid, col, row, key, MODES.ARRANGE)
      );
    }
  }
}

function handleDeletion() {
  const { col, row } = state.cursor;
  const currentMode = state.modeManager.currentMode;
  
  // Only delete squares from the current mode
  const squaresToDelete = state.staticSquares.filter(square => 
    square.col === col && 
    square.row === row && 
    square.mode === currentMode
  );

  // If deleting trim markers, update trim positions
  if (currentMode === MODES.TRIM && squaresToDelete.some(s => s.key === 't')) {
    const sampleName = state.sampleManager.getSampleForKey(state.modeManager.selectedSampleKey);
    if (sampleName) {
      // Remaining trim squares after deletion
      const remainingTrimSquares = state.staticSquares.filter(square => 
        square.mode === MODES.TRIM && 
        square.key === 't' &&
        !(square.col === col && square.row === row)
      );

      if (remainingTrimSquares.length > 0) {
        const sortedSquares = [...remainingTrimSquares].sort((a, b) => a.col - b.col);
        const startCol = sortedSquares[0].col;
        const endCol = sortedSquares.length > 1 ? sortedSquares[sortedSquares.length - 1].col : null;
        state.sampleManager.setTrimPositions(sampleName, startCol, endCol);
      } else {
        state.sampleManager.clearTrimPositions(sampleName);
      }
    }
  }

  state.staticSquares = state.staticSquares.filter(square => 
    !(square.col === col && 
      square.row === row && 
      square.mode === currentMode)
  );
  
  // Reset connection mode if active
  resetConnectionMode();
}

//=============================================================================
// KEY EVENT HANDLING
//=============================================================================

function keyPressed() {
  // Mode switching
  if (key === 't' && state.modeManager.currentMode === MODES.ARRANGE) {
    state.modeManager.switchMode(MODES.TRIM);
    return;
  } else if (key === 'q' && state.modeManager.currentMode === MODES.TRIM) {
    // Clear selected sample when exiting trim mode
    state.modeManager.selectedSampleKey = null;
    state.modeManager.switchMode(MODES.ARRANGE);
    return;
  }

  // Handle deletion in any mode
  if (key === 'x') {
    handleDeletion();
    return;
  }

  // Mode-specific key handling
  if (state.modeManager.currentMode === MODES.ARRANGE) {
    if (key === ' ') {
      state.modeManager.togglePlayback();
    } else if (ACCEPTED_KEYS.includes(key)) {
      handleSquareCreation(key);
    } else if (key === 'c') {
      handleConnectionKey();
    } else if (key === 'p') {
      handleVertexKey();
    }
  } else if (state.modeManager.currentMode === MODES.TRIM) {
    if (ACCEPTED_KEYS.includes(key)) {
      // Select sample in trim mode
      state.modeManager.selectedSampleKey = key;
    } else if (key === 't' && state.modeManager.selectedSampleKey) {
      handleSquareCreation(key);
    }
  }
}

function handleConnectionKey() {
  const squareAtCursor = getSquareAt(state.cursor.col, state.cursor.row);
  
  if (!state.connectMode && squareAtCursor) {
    handleConnectionStart(squareAtCursor);
  } else if (state.connectMode) {
    handleConnectionComplete(squareAtCursor);
    resetConnectionMode();
  }
}

function handleVertexKey() {
  if (state.connectMode) {
    handleVertexPlacement(state.cursor.col, state.cursor.row);
  }
}

//=============================================================================
// WINDOW HANDLING
//=============================================================================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  state.grid.updateDimensions();
}

//=============================================================================
// P5.JS GLOBAL BINDINGS
//=============================================================================

window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;
window.windowResized = windowResized; 