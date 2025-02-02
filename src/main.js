import { Grid } from './core/Grid.js';
import { Cursor } from './objects/Cursor.js';
import { StaticSquare } from './objects/StaticSquare.js';
import { Connection } from './objects/Connection.js';
import { ACCEPTED_KEYS, MOVE_DELAY } from './constants.js';
import { state, getSquareAt, isPositionOccupied } from './state/store.js';
import { getPreviewPathPoints } from './utils/pathfinding.js';
import { hasPathOverlap } from './utils/overlap.js';

//=============================================================================
// SETUP AND MAIN LOOP
//=============================================================================

function setup() {
  createCanvas(windowWidth, windowHeight);
  state.grid = new Grid();
  state.cursor = new Cursor(state.grid);
}

function draw() {
  background(220);
  handleCursorMovement();
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
  state.grid.draw();
  state.connections.forEach(conn => conn.draw(state.grid));
  state.staticSquares.forEach(square => square.draw());
  
  if (state.connectMode && state.connectSourceSquare) {
    drawConnectionPreview();
  }
  
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
  if (!ACCEPTED_KEYS.includes(key)) return;
  
  const { col, row } = state.cursor;
  if (!isPositionOccupied(col, row)) {
    state.staticSquares.push(
      new StaticSquare(state.grid, col, row, key)
    );
  }
}

function handleDeletion() {
  const { col, row } = state.cursor;
  
  state.connections = state.connections.filter(conn => 
    !conn.containsPoint(col, row)
  );
  
  state.staticSquares = state.staticSquares.filter(square => 
    !(square.col === col && square.row === row)
  );
  
  resetConnectionMode();
}

//=============================================================================
// KEY EVENT HANDLING
//=============================================================================

function keyPressed() {
  const handlers = {
    'c': handleConnectionKey,
    'p': handleVertexKey,
    'x': handleDeletion
  };
  
  const handler = handlers[key];
  if (handler) {
    handler();
    return;
  }
  
  handleSquareCreation(key);
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