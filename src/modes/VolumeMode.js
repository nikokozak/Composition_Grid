import { BaseMode } from './BaseMode.js';
import { state, isPositionOccupied, getSquareAt } from '../state/store.js';
import { StaticSquare } from '../objects/StaticSquare.js';
import { ACCEPTED_KEYS } from '../constants.js';
import { MODES } from './ModeManager.js';

export class VolumeMode extends BaseMode {
  constructor() {
    super('volume');
    this.initializeVolumeSquares();
  }

  onEnter() {
    // Make sure volume squares exist
    if (!this.hasVolumeSquares()) {
      this.initializeVolumeSquares();
    }
  }

  handleKeyPress(key) {
    // If it's a loaded sample key, create/update its volume square
    if (state.sampleManager.players.has(key)) {
      this.handleVolumeSquareCreation(key);
      return true;
    }
    return false;
  }

  handleObjectCreation(key) {
    if (state.sampleManager.players.has(key)) {
      this.handleVolumeSquareCreation(key);
      return true;
    }
    return false;
  }

  getStatusText() {
    return `${super.getStatusText()} | Press sample key to create/move volume control | q=arrange t/v=modes`;
  }

  //=============================================================================
  // PRIVATE METHODS
  //=============================================================================

  hasVolumeSquares() {
    return state.staticSquares.some(square => square.mode === MODES.VOLUME);
  }

  handleVolumeSquareCreation(key) {
    // Remove any existing volume square for this key
    state.staticSquares = state.staticSquares.filter(square => 
      !(square.mode === MODES.VOLUME && square.key === key)
    );

    // Create new volume square at cursor position
    const { col, row } = state.cursor;
    state.staticSquares.push(
      new StaticSquare(state.grid, col, row, key, MODES.VOLUME)
    );

    // Update volume based on row position
    const dbValue = this.rowToDb(row);
    state.sampleManager.setVolume(key, dbValue);
  }

  rowToDb(row) {
    // Convert row position to dB value using a more musical scale
    const normalizedPosition = 1 - (row / (state.grid.numRows - 1));
    
    // Bottom 20% of grid = silence
    if (normalizedPosition < 0.2) return -Infinity;
    
    // Remap remaining range (0.2 to 1.0) to exponential dB scale
    // Map 0.2->1.0 to -40->+6 dB with exponential scaling
    const remappedPos = (normalizedPosition - 0.2) / 0.8; // Now 0->1
    const dbValue = -40 + (46 * Math.pow(remappedPos, 1.5)); // Exponential curve
    
    return Math.min(6, Math.max(-40, dbValue)); // Clamp between -40 and +6 dB
  }

  initializeVolumeSquares() {
    // Clear any existing volume squares
    state.staticSquares = state.staticSquares.filter(square => square.mode !== MODES.VOLUME);
    
    // Get only the loaded sample keys
    const loadedKeys = Array.from(state.sampleManager.players.keys());
    const spacing = Math.floor(state.grid.numCols / (loadedKeys.length + 1));
    
    // Create volume squares evenly spaced
    loadedKeys.forEach((key, index) => {
      const col = spacing * (index + 1);
      const row = Math.floor(state.grid.numRows / 2); // Start in middle row (0 dB)
      
      state.staticSquares.push(
        new StaticSquare(state.grid, col, row, key, MODES.VOLUME)
      );

      // Initialize volume to 0 dB
      state.sampleManager.setVolume(key, 0);
    });
  }
} 