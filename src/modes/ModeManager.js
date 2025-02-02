import { state } from '../state/store.js';
import { StaticSquare } from '../objects/StaticSquare.js';

export const MODES = {
  ARRANGE: 'arrange',
  TRIM: 'trim'
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
    this.selectedSampleKey = null; // For trim mode: tracks which sample is being edited
  }

  update() {
    if (this.isPlaying && this.currentMode === MODES.ARRANGE) {
      const beatsPerSecond = (this.tempo / 60) * this.timeSignature;
      const deltaTime = (millis() - this.lastPlayToggleTime) / 1000;
      const newBeat = deltaTime * beatsPerSecond;
      
      if (Math.floor(newBeat) >= this.grid.numCols) {
        this.lastPlayToggleTime = millis();
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
    // Only trigger samples from squares in arrange mode
    const squaresInColumn = state.staticSquares.filter(square => 
      square.col === beatIndex && square.mode === MODES.ARRANGE
    );

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
    this.grid = grid;

    // Draw mode-specific elements first
    if (this.currentMode === MODES.ARRANGE) {
      this.drawArrangeMode();
    } else if (this.currentMode === MODES.TRIM) {
      this.drawTrimMode();
    }

    // Draw status text last
    this.drawStatusText();
  }

  drawArrangeMode() {
    // Draw arrange mode squares
    state.staticSquares
      .filter(square => square.mode === MODES.ARRANGE)
      .forEach(square => square.draw(this.currentMode));

    // Draw timing bar
    if (this.isPlaying) {
      this.drawTimingBar(this.grid);
    }

    // Draw other mode squares with reduced opacity
    state.staticSquares
      .filter(square => square.mode !== MODES.ARRANGE)
      .forEach(square => square.draw(this.currentMode));
  }

  drawTrimMode() {
    // Draw waveform if sample is selected
    if (this.selectedSampleKey) {
      this.drawWaveform(this.grid);
    }

    // Draw trim mode squares
    state.staticSquares
      .filter(square => square.mode === MODES.TRIM)
      .forEach(square => square.draw(this.currentMode));

    // Draw other mode squares with reduced opacity
    state.staticSquares
      .filter(square => square.mode !== MODES.TRIM)
      .forEach(square => square.draw(this.currentMode));
  }

  drawStatusText() {
    textAlign(LEFT, BOTTOM);
    textSize(14);
    fill(0);
    noStroke();
    
    let statusText = `Mode: ${this.currentMode}`;
    
    if (this.currentMode === MODES.ARRANGE) {
      statusText += ` | BPM: ${this.tempo}`;
    } else if (this.currentMode === MODES.TRIM) {
      const sampleName = this.selectedSampleKey ? 
        state.sampleManager.getSampleForKey(this.selectedSampleKey) : 
        'No sample selected';
      statusText += ` | Sample: ${sampleName}`;
    }
    
    text(statusText, 20, height - 20);
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

  drawWaveform(grid) {
    const sampleName = state.sampleManager.getSampleForKey(this.selectedSampleKey);
    if (!sampleName) return;

    const buffer = state.sampleManager.getSampleBuffer(sampleName);
    if (!buffer) return;

    // Draw waveform behind grid
    push();
    noFill();
    stroke(200, 200, 255, 128);
    strokeWeight(1);

    const channelData = buffer.getChannelData(0); // Get first channel
    const samplesPerColumn = Math.floor(channelData.length / grid.numCols);
    
    for (let col = 0; col < grid.numCols - 1; col++) {
      const x1 = grid.offsetX + (col * grid.cellSize);
      const x2 = grid.offsetX + ((col + 1) * grid.cellSize);
      
      // Find max amplitude in this segment
      let maxAmp = 0;
      const startSample = col * samplesPerColumn;
      const endSample = startSample + samplesPerColumn;
      
      for (let i = startSample; i < endSample; i++) {
        maxAmp = Math.max(maxAmp, Math.abs(channelData[i]));
      }
      
      // Scale amplitude to grid height
      const amplitude = maxAmp * grid.cellSize * 2;
      const centerY = grid.offsetY + ((grid.numRows - 1) * grid.cellSize / 2);
      
      line(x1, centerY - amplitude, x2, centerY - amplitude);
      line(x1, centerY + amplitude, x2, centerY + amplitude);
    }
    pop();
  }

  switchMode(newMode) {
    this.currentMode = newMode;
    this.selectedSampleKey = null;
    if (newMode === MODES.ARRANGE) {
      this.isPlaying = false;
    }
  }
} 