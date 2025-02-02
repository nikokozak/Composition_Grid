import { BaseMode } from './BaseMode.js';
import { state, isPositionOccupied, getSquareAt } from '../state/store.js';
import { StaticSquare } from '../objects/StaticSquare.js';
import { ACCEPTED_KEYS } from '../constants.js';

export class ArrangeMode extends BaseMode {
  constructor() {
    super('arrange');
    this.isPlaying = false;
    this.lastPlayToggleTime = 0;
    this.currentBeat = 0;
    this.tempo = 120; // BPM
    this.timeSignature = 1; // 1 = quarter notes
    this.lastTriggeredBeat = -1;
  }

  onEnter() {
    this.isPlaying = false;
    this.currentBeat = 0;
    this.lastTriggeredBeat = -1;
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    const beatsPerSecond = (this.tempo / 60) * this.timeSignature;
    const newBeat = this.currentBeat + (deltaTime * beatsPerSecond);
    
    if (Math.floor(newBeat) >= state.grid.numCols) {
      this.currentBeat = 0;
      this.lastTriggeredBeat = -1;
    } else {
      this.currentBeat = newBeat;
      
      const currentBeatIndex = Math.floor(this.currentBeat);
      if (currentBeatIndex !== this.lastTriggeredBeat) {
        this.triggerSamplesAtBeat(currentBeatIndex);
        this.lastTriggeredBeat = currentBeatIndex;
      }
    }
  }

  draw(grid) {
    // Draw arrange mode squares
    state.staticSquares
      .filter(square => square.mode === this.name)
      .forEach(square => square.draw(this.name));

    // Draw timing bar if playing
    if (this.isPlaying) {
      this.drawTimingBar(grid);
    }
  }

  handleKeyPress(key) {
    if (key === ' ') {
      this.togglePlayback();
      return true;
    } else if (key === 't') {
      state.modeManager.switchMode('trim');
      return true;
    } else if (key === 'c') {
      this.handleConnectionKey();
      return true;
    } else if (key === 'p') {
      this.handleVertexKey();
      return true;
    } else if (key === ',') {  // < decrease tempo
      this.decreaseTempo();
      return true;
    } else if (key === '.') {  // > increase tempo
      this.increaseTempo();
      return true;
    } else if (key === '[') {  // [ halve time signature
      this.halveTimeSignature();
      return true;
    } else if (key === ']') {  // ] double time signature
      this.doubleTimeSignature();
      return true;
    }
    return false;
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

  getStatusText() {
    const noteNames = {
      0.25: '16th',
      0.5: '8th',
      1: 'quarter',
      2: 'half'
    };
    return `${super.getStatusText()} | BPM: ${this.tempo} | Grid: ${noteNames[this.timeSignature]} notes`;
  }

  //=============================================================================
  // PRIVATE METHODS
  //=============================================================================

  triggerSamplesAtBeat(beatIndex) {
    console.log('Triggering samples at beat:', beatIndex);
    const squaresInColumn = state.staticSquares.filter(square => 
      square.col === beatIndex && square.mode === this.name
    );

    console.log('Found squares:', squaresInColumn);
    squaresInColumn.forEach(square => {
      const sampleName = state.sampleManager.getSampleForKey(square.key);
      console.log('Playing sample:', { key: square.key, name: sampleName });
      if (sampleName) {
        state.sampleManager.playSample(sampleName);
      }
    });
  }

  togglePlayback() {
    // Debounce space bar hits
    if (millis() - this.lastPlayToggleTime < 200) return;
    
    this.isPlaying = !this.isPlaying;
    this.lastPlayToggleTime = millis();
    
    if (!this.isPlaying) {
      this.currentBeat = 0;
      this.lastTriggeredBeat = -1;
    } else {
      // Reset beat counter when starting playback
      this.currentBeat = 0;
      this.lastTriggeredBeat = -1;
      // Trigger first beat immediately
      this.triggerSamplesAtBeat(0);
    }
  }

  drawTimingBar(grid) {
    const beatIndex = Math.floor(this.currentBeat);
    const x = grid.offsetX + (beatIndex * grid.cellSize);
    
    push();
    stroke(255, 0, 0);
    strokeWeight(2);
    line(x, grid.offsetY, x, grid.offsetY + ((grid.numRows - 1) * grid.cellSize));

    // Draw beat number
    textAlign(CENTER, TOP);
    textSize(12);
    fill(255, 0, 0);
    noStroke();
    text(`Beat: ${beatIndex + 1}`, x, grid.offsetY - 20);
    pop();
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

  //=============================================================================
  // TEMPO AND TIME SIGNATURE CONTROLS
  //=============================================================================

  setTempo(newTempo) {
    // Clamp tempo between reasonable values
    this.tempo = Math.max(30, Math.min(300, newTempo));
    console.log(`Tempo: ${this.tempo} BPM`);
  }

  increaseTempo() {
    this.setTempo(this.tempo + 5);
  }

  decreaseTempo() {
    this.setTempo(this.tempo - 5);
  }

  setTimeSignature(value) {
    // Common time signatures: 0.25 = 16th notes, 0.5 = 8th notes, 1 = quarter notes, 2 = half notes
    const validValues = [0.25, 0.5, 1, 2];
    if (validValues.includes(value)) {
      this.timeSignature = value;
      const noteNames = {
        0.25: '16th notes',
        0.5: '8th notes',
        1: 'quarter notes',
        2: 'half notes'
      };
      console.log(`Time signature: ${noteNames[value]}`);
    }
  }

  doubleTimeSignature() {
    const currentIndex = [0.25, 0.5, 1, 2].indexOf(this.timeSignature);
    if (currentIndex < 3) {
      this.setTimeSignature([0.25, 0.5, 1, 2][currentIndex + 1]);
    }
  }

  halveTimeSignature() {
    const currentIndex = [0.25, 0.5, 1, 2].indexOf(this.timeSignature);
    if (currentIndex > 0) {
      this.setTimeSignature([0.25, 0.5, 1, 2][currentIndex - 1]);
    }
  }
} 