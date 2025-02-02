import { BaseMode } from './BaseMode.js';
import { state, isPositionOccupied, getSquareAt } from '../state/store.js';
import { StaticSquare } from '../objects/StaticSquare.js';
import { ACCEPTED_KEYS } from '../constants.js';

export class TrimMode extends BaseMode {
  constructor() {
    super('trim');
    this.selectedSampleKey = null;
  }

  onEnter() {
    this.selectedSampleKey = null;
  }

  onExit() {
    this.selectedSampleKey = null;
  }

  draw(grid) {
    if (!this.selectedSampleKey) {
      grid.draw();
      return;
    }

    const sampleName = state.sampleManager.getSampleForKey(this.selectedSampleKey);
    if (!sampleName) {
      grid.draw();
      return;
    }

    // Draw waveform
    this.drawWaveform(grid, sampleName);
    
    // Draw grid on top of waveform
    grid.draw();

    // Draw trim markers and lines
    this.drawTrimMarkersAndLines(grid, sampleName);
  }

  handleKeyPress(key) {
    // If it's a valid sample key
    if (ACCEPTED_KEYS.includes(key)) {
      if (!this.selectedSampleKey) {
        // No sample selected yet - select this one
        this.selectedSampleKey = key;
        return true;
      } else if (key === this.selectedSampleKey) {
        // Same key as selected sample - create trim block
        return this.createTrimBlock();
      } else {
        // Different key - switch to that sample
        this.selectedSampleKey = key;
        return true;
      }
    }
    return false;
  }

  handleObjectCreation(key) {
    // We handle all creation through handleKeyPress now
    return false;
  }

  handleObjectDeletion() {
    const { col, row } = state.cursor;
    const squareAtPosition = getSquareAt(col, row);
    
    if (!squareAtPosition || 
        squareAtPosition.mode !== this.name || 
        squareAtPosition.sampleKey !== this.selectedSampleKey) {
      return false;
    }

    // Remove the square
    state.staticSquares = state.staticSquares.filter(square => 
      !(square.col === col && 
        square.row === row && 
        square.mode === this.name &&
        square.sampleKey === this.selectedSampleKey)
    );

    // Update trim positions
    this.updateTrimPositions();
    return true;
  }

  getStatusText() {
    const sampleName = this.selectedSampleKey ? 
      state.sampleManager.getSampleForKey(this.selectedSampleKey) : 
      'No sample selected';
    return `${super.getStatusText()} | Sample: ${sampleName} | q=arrange t/v=modes`;
  }

  //=============================================================================
  // PRIVATE METHODS
  //=============================================================================

  drawWaveform(grid, sampleName) {
    const buffer = state.sampleManager.getSampleBuffer(sampleName);
    if (!buffer) return;

    push();
    fill(200, 200, 255, 128);
    stroke(200, 200, 255, 200);
    strokeWeight(1);

    const channelData = buffer.getChannelData(0);
    const samplesPerColumn = Math.floor(channelData.length / grid.numCols);
    const centerY = grid.offsetY + ((grid.numRows - 1) * grid.cellSize / 2);
    const maxHeight = grid.cellSize * (grid.numRows - 1) / 2;

    beginShape();
    
    // Draw top half
    for (let col = 0; col < grid.numCols; col++) {
      const x = grid.offsetX + (col * grid.cellSize);
      let maxAmp = 0;
      const startSample = col * samplesPerColumn;
      const endSample = Math.min(startSample + samplesPerColumn, channelData.length);
      
      for (let i = startSample; i < endSample; i++) {
        maxAmp = Math.max(maxAmp, Math.abs(channelData[i]));
      }
      
      vertex(x, centerY - (maxAmp * maxHeight));
    }
    
    // Draw bottom half
    for (let col = grid.numCols - 1; col >= 0; col--) {
      const x = grid.offsetX + (col * grid.cellSize);
      let maxAmp = 0;
      const startSample = col * samplesPerColumn;
      const endSample = Math.min(startSample + samplesPerColumn, channelData.length);
      
      for (let i = startSample; i < endSample; i++) {
        maxAmp = Math.max(maxAmp, Math.abs(channelData[i]));
      }
      
      vertex(x, centerY + (maxAmp * maxHeight));
    }
    
    endShape(CLOSE);
    pop();
  }

  drawTrimMarkersAndLines(grid, sampleName) {
    // Get trim markers for current sample
    const trimSquares = state.staticSquares.filter(square => 
      square.mode === this.name && 
      square.key === 't' &&
      square.sampleKey === this.selectedSampleKey
    );

    // Draw squares
    trimSquares.forEach(square => square.draw(this.name));

    // Draw trim lines if we have markers
    if (trimSquares.length > 0) {
      const sortedSquares = [...trimSquares].sort((a, b) => a.col - b.col);
      const startCol = sortedSquares[0].col;
      const endCol = sortedSquares.length > 1 ? sortedSquares[sortedSquares.length - 1].col : null;
      
      // Update trim positions
      state.sampleManager.setTrimPositions(sampleName, startCol, endCol);
      
      // Draw lines
      push();
      stroke(255, 0, 0);
      strokeWeight(2);
      
      // Start line
      const startX = grid.offsetX + (startCol * grid.cellSize);
      line(startX, grid.offsetY, startX, grid.offsetY + ((grid.numRows - 1) * grid.cellSize));
      
      // End line (if exists)
      if (endCol !== null) {
        const endX = grid.offsetX + (endCol * grid.cellSize);
        line(endX, grid.offsetY, endX, grid.offsetY + ((grid.numRows - 1) * grid.cellSize));
      }
      pop();
    } else {
      state.sampleManager.clearTrimPositions(sampleName);
    }
  }

  updateTrimPositions() {
    if (!this.selectedSampleKey) return;

    const sampleName = state.sampleManager.getSampleForKey(this.selectedSampleKey);
    if (!sampleName) return;

    const trimSquares = state.staticSquares.filter(square => 
      square.mode === this.name && 
      square.key === 't' &&
      square.sampleKey === this.selectedSampleKey
    );

    if (trimSquares.length > 0) {
      const sortedSquares = [...trimSquares].sort((a, b) => a.col - b.col);
      const startCol = sortedSquares[0].col;
      const endCol = sortedSquares.length > 1 ? sortedSquares[sortedSquares.length - 1].col : null;
      state.sampleManager.setTrimPositions(sampleName, startCol, endCol);
    } else {
      state.sampleManager.clearTrimPositions(sampleName);
    }
  }

  createTrimBlock() {
    const { col, row } = state.cursor;
    if (isPositionOccupied(col, row)) return false;

    state.staticSquares.push(
      new StaticSquare(
        state.grid, 
        col, 
        row, 
        't', 
        this.name,
        this.selectedSampleKey
      )
    );

    // Update trim positions
    this.updateTrimPositions();
    return true;
  }
} 