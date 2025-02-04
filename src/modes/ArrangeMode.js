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
      return true;
    }

    // Tempo controls
    if (key === ',') {
      const newTempo = state.timeManager.transport.bpm.value - 5;
      state.timeManager.setTempo(newTempo);
      return true;
    }
    if (key === '.') {
      const newTempo = state.timeManager.transport.bpm.value + 5;
      state.timeManager.setTempo(newTempo);
      return true;
    }

    // Time signature controls
    if (key === '[') {
      const currentValue = state.timeManager.transport.timeSignature;
      const newValue = currentValue === 0.25 ? 0.25 : currentValue / 2;
      state.timeManager.setTimeSignature(newValue);
      return true;
    }
    if (key === ']') {
      const currentValue = state.timeManager.transport.timeSignature;
      const newValue = currentValue === 2 ? 2 : currentValue * 2;
      state.timeManager.setTimeSignature(newValue);
      return true;
    }

    return false;
  }

  getStatusText() {
    const noteNames = {
      0.25: '16th notes',
      0.5: '8th notes',
      1: 'quarter notes',
      2: 'half notes'
    };
    const currentTempo = Math.round(state.timeManager.transport.bpm.value);
    const currentTimeSignature = state.timeManager.transport.timeSignature;
    const timeDesc = noteNames[currentTimeSignature] || 'quarter notes';
    return `${super.getStatusText()} | ${currentTempo} BPM | ${timeDesc} | Space to ${state.timeManager.transport.state === 'started' ? 'stop' : 'play'} | [/] change timing | ,/. change tempo | t/v=modes`;
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

    // Clean up associated effects before deleting the square
    const key = squareAtPosition.key;
    
    // Clean up pitch shifts
    state.sampleManager.clearPitchShift(key, col);
    
    // Clean up volume settings
    state.sampleManager.setVolume(key, 0); // Reset to default volume
    
    // Clean up trim positions
    state.sampleManager.clearTrimPositions(state.sampleManager.getSampleForKey(key));

    // Remove associated effect squares
    state.staticSquares = state.staticSquares.filter(square => 
      !(square.col === col && (square.mode === MODES.PITCH || square.mode === MODES.VOLUME) && square.key === key)
    );

    // Remove the arrange square itself
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