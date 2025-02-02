import { state } from '../state/store.js';
import { StaticSquare } from '../objects/StaticSquare.js';
import { ArrangeMode } from './ArrangeMode.js';
import { TrimMode } from './TrimMode.js';
import { ArrangeRenderer } from '../rendering/ArrangeRenderer.js';
import { TrimRenderer } from '../rendering/TrimRenderer.js';

export const MODES = {
  ARRANGE: 'arrange',
  TRIM: 'trim'
};

export class ModeManager {
  constructor() {
    // Initialize modes
    this.modes = {
      arrange: new ArrangeMode(),
      trim: new TrimMode()
    };

    // Initialize renderers
    this.renderers = {
      arrange: new ArrangeRenderer(),
      trim: new TrimRenderer()
    };

    this.currentMode = this.modes.arrange;
    
    // Global playback state (moved from ArrangeMode)
    this.isPlaying = false;
    this.lastPlayToggleTime = 0;
    this.currentBeat = 0;
    this.tempo = 120; // BPM
    this.timeSignature = 1; // 1 = quarter notes
    this.lastTriggeredBeat = -1;
    this.selectedSampleKey = null; // For trim mode: tracks which sample is being edited
  }

  update(deltaTime) {
    // Update current mode
    this.currentMode.update(deltaTime);

    // Handle global playback if active
    if (this.isPlaying) {
      this.updatePlayback(deltaTime);
    }
  }

  updatePlayback(deltaTime) {
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
    // Get the renderer for the current mode
    const renderer = this.renderers[this.currentMode.name];
    if (!renderer) {
      console.error(`No renderer found for mode: ${this.currentMode.name}`);
      return;
    }

    // Draw using the mode's renderer
    renderer.draw(grid, state);
    this.drawStatusText();
  }

  handleKeyPress(key) {
    return this.currentMode.handleKeyPress(key);
  }

  handleObjectCreation(key) {
    return this.currentMode.handleObjectCreation(key);
  }

  handleObjectDeletion() {
    if (!this.currentMode) {
      console.error('No current mode set');
      return false;
    }
    console.log('ModeManager handling deletion for mode:', this.currentMode.name);
    const result = this.currentMode.handleObjectDeletion();
    console.log('Deletion result:', result);
    return result;
  }

  switchMode(modeName) {
    if (!this.modes[modeName]) {
      console.error(`Invalid mode: ${modeName}`);
      return;
    }

    this.currentMode.onExit();
    this.currentMode = this.modes[modeName];
    this.currentMode.onEnter();
  }

  //=============================================================================
  // PRIVATE METHODS
  //=============================================================================

  drawStatusText() {
    push();
    textAlign(LEFT, BOTTOM);
    textSize(14);
    fill(0);
    noStroke();
    text(this.currentMode.getStatusText(), 20, height - 20);
    pop();
  }

  setTempo(newTempo) {
    this.tempo = Math.max(30, Math.min(300, newTempo));
    console.log(`Tempo: ${this.tempo} BPM`);
  }

  setTimeSignature(value) {
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
    } else {
      // Reset beat counter when starting playback
      this.currentBeat = 0;
      this.lastTriggeredBeat = -1;
      // Trigger first beat immediately
      this.triggerSamplesAtBeat(0);
    }
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
    // Only draw waveform and trim markers for selected sample
    if (this.selectedSampleKey) {
      const sampleName = state.sampleManager.getSampleForKey(this.selectedSampleKey);
      if (sampleName) {
        this.drawWaveform(this.grid);
        
        // Draw trim markers for current sample
        const trimSquares = state.staticSquares.filter(square => 
          square.mode === MODES.TRIM && 
          square.key === 't' &&
          square.sampleKey === this.selectedSampleKey
        );

        // Sort by column to find start/end positions
        if (trimSquares.length > 0) {
          const sortedSquares = [...trimSquares].sort((a, b) => a.col - b.col);
          const startCol = sortedSquares[0].col;
          const endCol = sortedSquares.length > 1 ? sortedSquares[sortedSquares.length - 1].col : null;
          
          // Update trim positions in SampleManager
          state.sampleManager.setTrimPositions(sampleName, startCol, endCol);
          
          // Draw trim lines
          push();
          stroke(255, 0, 0);
          strokeWeight(2);
          
          // Start line
          const startX = this.grid.offsetX + (startCol * this.grid.cellSize);
          line(startX, this.grid.offsetY, startX, this.grid.offsetY + ((this.grid.numRows - 1) * this.grid.cellSize));
          
          // End line (if exists)
          if (endCol !== null) {
            const endX = this.grid.offsetX + (endCol * this.grid.cellSize);
            line(endX, this.grid.offsetY, endX, this.grid.offsetY + ((this.grid.numRows - 1) * this.grid.cellSize));
          }
          pop();
        } else {
          // No trim markers, clear trim positions
          state.sampleManager.clearTrimPositions(sampleName);
        }
      }
    }

    // Draw grid on top of waveform
    this.grid.draw();

    // Only draw trim squares for current sample
    state.staticSquares
      .filter(square => {
        if (square.mode !== MODES.TRIM) return false;
        if (!this.selectedSampleKey) return false;
        return square.key === 't' && square.sampleKey === this.selectedSampleKey;
      })
      .forEach(square => square.draw(this.currentMode));
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
    fill(200, 200, 255, 128); // Light blue fill with low opacity
    stroke(200, 200, 255, 200); // Slightly stronger stroke
    strokeWeight(1);

    const channelData = buffer.getChannelData(0); // Get first channel
    const samplesPerColumn = Math.floor(channelData.length / grid.numCols);
    const centerY = grid.offsetY + ((grid.numRows - 1) * grid.cellSize / 2);
    const maxHeight = grid.cellSize * (grid.numRows - 1) / 2;

    // Draw as a single closed shape
    beginShape();
    
    // Draw top half (left to right)
    for (let col = 0; col < grid.numCols; col++) {
      const x = grid.offsetX + (col * grid.cellSize);
      
      let maxAmp = 0;
      const startSample = col * samplesPerColumn;
      const endSample = Math.min(startSample + samplesPerColumn, channelData.length);
      
      for (let i = startSample; i < endSample; i++) {
        maxAmp = Math.max(maxAmp, Math.abs(channelData[i]));
      }
      
      const amplitude = maxAmp * maxHeight;
      vertex(x, centerY - amplitude);
    }
    
    // Draw bottom half (right to left)
    for (let col = grid.numCols - 1; col >= 0; col--) {
      const x = grid.offsetX + (col * grid.cellSize);
      
      let maxAmp = 0;
      const startSample = col * samplesPerColumn;
      const endSample = Math.min(startSample + samplesPerColumn, channelData.length);
      
      for (let i = startSample; i < endSample; i++) {
        maxAmp = Math.max(maxAmp, Math.abs(channelData[i]));
      }
      
      const amplitude = maxAmp * maxHeight;
      vertex(x, centerY + amplitude);
    }
    
    endShape(CLOSE); // CLOSE parameter connects end to start

    pop();
  }
} 
 