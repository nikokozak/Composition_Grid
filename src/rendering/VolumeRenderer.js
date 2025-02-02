import { BaseRenderer } from './BaseRenderer.js';
import { MODES } from '../modes/ModeManager.js';
import { state } from '../state/store.js';

export class VolumeRenderer extends BaseRenderer {
  draw(grid, state) {
    // Draw volume mode squares
    state.staticSquares
      .filter(square => square.mode === MODES.VOLUME)
      .forEach(square => square.draw(MODES.VOLUME));

    // Draw volume labels on the left side
    this.drawVolumeLabels(grid);
  }

  //=============================================================================
  // PRIVATE METHODS
  //=============================================================================

  drawVolumeLabels(grid) {
    push();
    textAlign(RIGHT, CENTER);
    textSize(12);
    fill(0);
    noStroke();

    // Draw labels for each row
    for (let row = 0; row < grid.numRows; row++) {
      const y = grid.offsetY + (row * grid.cellSize);
      const db = this.rowToDb(row, grid.numRows);
      text(`${db.toFixed(1)} dB`, grid.offsetX - 10, y);
    }
    pop();
  }

  rowToDb(row, totalRows) {
    // Convert row position to dB value
    // Top row = +6dB, middle row = 0dB, bottom row = -infinity
    const normalizedPosition = 1 - (row / (totalRows - 1));
    if (normalizedPosition === 0) return -Infinity;
    return (normalizedPosition * 2 - 1) * 12; // Scale to ±12dB range
  }
} 