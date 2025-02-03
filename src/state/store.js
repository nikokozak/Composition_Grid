// Global state
export const state = {
  grid: null,
  cursor: null,
  staticSquares: [],
  connections: [],
  lastMoveTime: {},      // Tracks last move time per key
  lastKeyPressTime: {},  // Tracks initial press time per key
  connectMode: false,
  connectSourceSquare: null,
  connectVertices: [],
  sampleManager: null,
  modeManager: null,
  timeManager: null,
  uiManager: null
};

// Helper functions
export function getSquareAt(col, row) {
  const currentMode = state.modeManager.currentMode.name;
  return state.staticSquares.find(square => 
    square.col === col && 
    square.row === row && 
    square.mode === currentMode
  );
}

export function isPositionOccupied(col, row) {
  const currentMode = state.modeManager.currentMode.name;
  return state.staticSquares.some(square => 
    square.col === col && 
    square.row === row && 
    square.mode === currentMode
  );
} 