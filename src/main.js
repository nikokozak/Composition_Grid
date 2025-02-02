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
import { UIManager } from './ui/UIManager.js';
import { TimeManager } from './audio/TimeManager.js';

//=============================================================================
// SETUP AND MAIN LOOP
//=============================================================================

async function setup() {
  console.log('Setting up...');
  createCanvas(windowWidth, windowHeight);
  state.grid = new Grid();
  state.cursor = new Cursor(state.grid);
  state.sampleManager = new SampleManager();
  state.timeManager = new TimeManager();
  state.modeManager = new ModeManager();
  state.uiManager = new UIManager();
  console.log('Managers initialized');
  await state.sampleManager.loadSamples();
  console.log('Samples loaded');
  
  setupGridControls();
  console.log('Setup complete');
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
  
  // Calculate deltaTime in seconds
  const deltaTime = (millis() - state.lastFrameTime) / 1000;
  state.modeManager.update(deltaTime);
  state.lastFrameTime = millis();
  
  // Draw scene in order: grid -> mode content -> UI -> cursor
  state.grid.draw();
  state.modeManager.draw(state.grid);
  state.uiManager.draw();  // This should draw the sample names
  state.cursor.draw();
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
  // Handle mode switching
  if (key === 'v') {
    state.modeManager.switchMode('volume');
    return;
  }

  // Handle deletion in any mode
  if (key === 'x') {
    state.modeManager.handleObjectDeletion();
    return;
  }

  // Handle mode-specific key press
  if (state.modeManager.handleKeyPress(key)) return;

  // Handle object creation
  state.modeManager.handleObjectCreation(key);
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

// Bind all p5.js functions to window object
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;
window.windowResized = windowResized;

// Export for module system
export { setup, draw, keyPressed, windowResized }; 