import { BaseRenderer } from './BaseRenderer.js';
import { MODES } from '../modes/ModeManager.js';
import { state } from '../state/store.js';

export class TrimRenderer extends BaseRenderer {
  draw(grid, state) {
    const trimMode = state.modeManager.modes.trim;
    if (!trimMode.selectedSampleKey) {
      grid.draw();
      return;
    }

    const sampleName = state.sampleManager.getSampleForKey(trimMode.selectedSampleKey);
    if (!sampleName) {
      grid.draw();
      return;
    }

    // Draw waveform
    this.drawWaveform(grid, sampleName, state.sampleManager);
    
    // Draw grid on top of waveform
    grid.draw();

    // Draw trim markers and lines
    this.drawTrimMarkersAndLines(grid, sampleName, trimMode.selectedSampleKey, state);
  }

  //=============================================================================
  // PRIVATE METHODS
  //=============================================================================

  drawWaveform(grid, sampleName, sampleManager) {
    const buffer = sampleManager.getSampleBuffer(sampleName);
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

  drawTrimMarkersAndLines(grid, sampleName, selectedSampleKey, state) {
    // Get trim markers for current sample
    const trimSquares = state.staticSquares.filter(square => 
      square.mode === MODES.TRIM && 
      square.key === 't' &&
      square.sampleKey === selectedSampleKey
    );

    // Draw squares
    trimSquares.forEach(square => square.draw(MODES.TRIM));

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
} 