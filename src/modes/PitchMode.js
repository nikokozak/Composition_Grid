import { BaseMode } from './BaseMode.js';
import { state, isPositionOccupied, getSquareAt } from '../state/store.js';
import { StaticSquare } from '../objects/StaticSquare.js';
import { ACCEPTED_KEYS } from '../constants.js';
import { MODES } from './ModeManager.js';

export class PitchMode extends BaseMode {
  constructor() {
    super('pitch');
  }

  handleKeyPress(key) {
    if (!ACCEPTED_KEYS.includes(key)) return false;

    const { col, row } = state.cursor;
    const arrangeSquare = state.staticSquares.find(square => 
      square.mode === MODES.ARRANGE && 
      square.col === col && 
      square.key === key
    );

    if (!arrangeSquare) return false;

    // Check if we already have a pitch block for this arrange block
    const existingPitchBlock = state.staticSquares.find(square =>
      square.mode === MODES.PITCH &&
      square.col === col &&
      square.key === key
    );

    if (existingPitchBlock) return false;

    // Create pitch block at cursor position
    if (!isPositionOccupied(col, row)) {
      state.staticSquares.push(
        new StaticSquare(state.grid, col, row, key, MODES.PITCH)
      );

      // Calculate and set pitch shift with column
      const semitones = arrangeSquare.row - row;
      state.sampleManager.setPitchShift(key, semitones, col);
      return true;
    }

    return false;
  }

  handleObjectCreation(key) {
    return this.handleKeyPress(key);
  }

  handleObjectDeletion() {
    const { col, row } = state.cursor;
    const squareAtPosition = getSquareAt(col, row);
    
    if (!squareAtPosition || squareAtPosition.mode !== MODES.PITCH) {
      return false;
    }

    // Clear pitch shift before removing the square
    state.sampleManager.clearPitchShift(squareAtPosition.key, col);

    state.staticSquares = state.staticSquares.filter(square => 
      !(square.col === col && 
        square.row === row && 
        square.mode === MODES.PITCH)
    );
    
    return true;
  }

  getStatusText() {
    return `${super.getStatusText()} | Press sample key above/below arrange block to create pitch shift | q=arrange t/v/p=modes`;
  }
} 