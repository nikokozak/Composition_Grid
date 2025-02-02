import { BaseMode } from './BaseMode.js';
import { state, isPositionOccupied, getSquareAt } from '../state/store.js';
import { StaticSquare } from '../objects/StaticSquare.js';
import { ACCEPTED_KEYS } from '../constants.js';
import { MODES } from './ModeManager.js';

export class ArrangeMode extends BaseMode {
  constructor() {
    super();
    this.name = MODES.ARRANGE;
  }

  update(deltaTime) {
    // ArrangeMode no longer needs to handle playback - it's in ModeManager
  }

  handleKeyPress(key) {
    // Space bar toggles playback
    if (key === ' ') {
      state.modeManager.togglePlayback();
      return;
    }

    // Switch to trim mode
    if (key === 't') {
      state.modeManager.switchMode('trim');
      return true;
    }

    // Tempo controls
    if (key === ',') {
      state.modeManager.setTempo(state.modeManager.tempo - 5);
      return;
    }
    if (key === '.') {
      state.modeManager.setTempo(state.modeManager.tempo + 5);
      return;
    }

    // Time signature controls
    if (key === '[') {
      state.modeManager.halveTimeSignature();
      return;
    }
    if (key === ']') {
      state.modeManager.doubleTimeSignature();
      return;
    }

    // Handle other keys normally
    super.handleKeyPress(key);
  }

  getStatusText() {
    const noteNames = {
      0.25: '16th notes',
      0.5: '8th notes',
      1: 'quarter notes',
      2: 'half notes'
    };
    const timeDesc = noteNames[state.modeManager.timeSignature] || 'unknown';
    return `Arrange Mode | ${state.modeManager.tempo} BPM | ${timeDesc} | Space to ${state.modeManager.isPlaying ? 'stop' : 'play'} | [/] change timing | ,/. change tempo`;
  }

  handleObjectCreation(key) {
    if (!ACCEPTED_KEYS.includes(key)) return false;

    const { col, row } = state.cursor;
    if (isPositionOccupied(col, row)) return false;

    state.staticSquares.push(
      new StaticSquare(state.grid, col, row, key, this.name)
    );
    return true;
  }

  handleObjectDeletion() {
    const { col, row } = state.cursor;
    const squareAtPosition = getSquareAt(col, row);
    
    console.log('ArrangeMode deletion:', {
      cursorPos: { col, row },
      squareAtPosition,
      mode: this.name
    });
    
    if (!squareAtPosition || squareAtPosition.mode !== this.name) return false;

    state.staticSquares = state.staticSquares.filter(square => 
      !(square.col === col && square.row === row && square.mode === this.name)
    );
    
    console.log('Squares after deletion:', state.staticSquares);
    return true;
  }

  handleConnectionKey() {
    const squareAtCursor = getSquareAt(state.cursor.col, state.cursor.row);
    
    if (!state.connectMode && squareAtCursor) {
      state.handleConnectionStart(squareAtCursor);
    } else if (state.connectMode) {
      state.handleConnectionComplete(squareAtCursor);
      state.resetConnectionMode();
    }
  }

  handleVertexKey() {
    if (state.connectMode) {
      state.handleVertexPlacement(state.cursor.col, state.cursor.row);
    }
  }
} 