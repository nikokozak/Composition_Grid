import { state } from '../state/store.js';

export const MODES = {
  ARRANGE: 'arrange',
  // We'll add more modes later
};

export class ModeManager {
  constructor() {
    this.currentMode = MODES.ARRANGE;
    this.isPlaying = false;
    this.lastPlayToggleTime = 0;
    this.currentBeat = 0;
    this.tempo = 120; // BPM
    this.timeSignature = 1; // 1 = quarter notes, 0.5 = eighth notes, 2 = half notes
    this.lastTriggeredBeat = -1; // Track last beat where we triggered samples
  }

  update() {
    if (this.isPlaying) {
      const beatsPerSecond = (this.tempo / 60) * this.timeSignature;
      const deltaTime = (millis() - this.lastPlayToggleTime) / 1000;
      const newBeat = deltaTime * beatsPerSecond;
      
      // If we've passed the last column, reset timing to maintain perfect sync
      if (Math.floor(newBeat) >= this.grid.numCols) {
        this.lastPlayToggleTime = millis();
        this.currentBeat = 0;
        this.lastTriggeredBeat = -1;
      } else {
        this.currentBeat = newBeat;
        
        // Check if we've moved to a new beat
        const currentBeatIndex = Math.floor(this.currentBeat);
        if (currentBeatIndex !== this.lastTriggeredBeat) {
          this.triggerSamplesAtBeat(currentBeatIndex);
          this.lastTriggeredBeat = currentBeatIndex;
        }
      }
    }
  }

  setTempo(newTempo) {
    // Clamp tempo between reasonable values
    this.tempo = Math.max(30, Math.min(300, newTempo));
  }

  setTimeSignature(value) {
    // Common time signatures: 0.25 = 16th notes, 0.5 = 8th notes, 1 = quarter notes, 2 = half notes
    const validValues = [0.25, 0.5, 1, 2];
    if (validValues.includes(value)) {
      this.timeSignature = value;
    }
  }

  // Convenience methods for quick tempo changes
  increaseTempo() {
    this.setTempo(this.tempo + 5);
  }

  decreaseTempo() {
    this.setTempo(this.tempo - 5);
  }

  // Convenience methods for time signature changes
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

  triggerSamplesAtBeat(beatIndex) {
    // Get all squares in the current column
    const squaresInColumn = state.staticSquares.filter(square => 
      square.col === beatIndex
    );

    // Trigger samples for each square
    squaresInColumn.forEach(square => {
      const sampleName = state.sampleManager.getSampleForKey(square.key);
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
    }
  }

  draw(grid) {
    // Store grid reference for update calculations
    this.grid = grid;

    // Draw mode indicator and tempo
    textAlign(LEFT, BOTTOM);
    textSize(14);
    fill(0);
    noStroke();
    
    const timeNames = {
      0.25: '16th',
      0.5: '8th',
      1: '1/4',
      2: '1/2'
    };
    
    text(`Mode: ${this.currentMode} | BPM: ${this.tempo} | Note: ${timeNames[this.timeSignature]}`, 20, height - 20);

    // Draw timing bar in arrange mode
    if (this.currentMode === MODES.ARRANGE) {
      this.drawTimingBar(grid);
    }
  }

  drawTimingBar(grid) {
    // Calculate x position based on current beat
    const beatIndex = Math.floor(this.currentBeat);
    const x = grid.offsetX + (beatIndex * grid.cellSize);
    
    stroke(255, 0, 0);
    strokeWeight(2);
    line(x, grid.offsetY, x, grid.offsetY + ((grid.numRows - 1) * grid.cellSize));

    // Draw beat number
    textAlign(CENTER, TOP);
    textSize(12);
    fill(255, 0, 0);
    noStroke();
    text(`Beat: ${beatIndex + 1}`, x, grid.offsetY - 20);
  }

  handleKeyPress(key) {
    if (key === ' ') {
      this.togglePlayback();
    } else if (key === '[') {
      this.decreaseTempo();
    } else if (key === ']') {
      this.increaseTempo();
    } else if (key === '.') {
      this.doubleTimeSignature();
    } else if (key === ',') {
      this.halveTimeSignature();
    }
    // We'll add more key handlers for other modes later
  }
} 