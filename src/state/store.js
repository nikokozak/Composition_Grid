// Global state
export const state = {
  grid: null,
  cursor: null,
  staticSquares: [],
  connections: [],
  lastMoveTime: 0,
  connectMode: false,
  connectSourceSquare: null,
  connectVertices: []
};

// Helper functions
export function getSquareAt(col, row) {
  return state.staticSquares.find(square => 
    square.col === col && 
    square.row === row && 
    square.mode === state.modeManager.currentMode
  );
}

export function isPositionOccupied(col, row) {
  // Only check for squares in the current mode
  return state.staticSquares.some(square => 
    square.col === col && 
    square.row === row && 
    square.mode === state.modeManager.currentMode
  );
} 