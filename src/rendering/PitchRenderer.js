import { BaseRenderer } from './BaseRenderer.js';
import { MODES } from '../modes/ModeManager.js';
import { state } from '../state/store.js';

export class PitchRenderer extends BaseRenderer {
  draw(grid, state) {
    // Draw arrange mode squares with very light purple hue
    state.staticSquares
      .filter(square => square.mode === MODES.ARRANGE)
      .forEach(square => {
        push();
        fill(245, 240, 255, 200); // Much lighter purple with some transparency
        stroke(230, 225, 240, 200);
        square.draw(MODES.ARRANGE);
        pop();
      });

    // Draw pitch mode squares with light green hue and connecting lines
    state.staticSquares
      .filter(square => square.mode === MODES.PITCH)
      .forEach(square => {
        // Find corresponding arrange square in the same column
        const arrangeSquare = state.staticSquares.find(s => 
          s.mode === MODES.ARRANGE && 
          s.col === square.col &&
          s.key === square.key
        );

        if (arrangeSquare) {
          // Draw connecting dashed line
          push();
          stroke(150, 200, 150);
          strokeWeight(2);
          this.drawDashedLine(
            grid.offsetX + (square.col * grid.cellSize) + grid.cellSize/2,
            grid.offsetY + (square.row * grid.cellSize) + grid.cellSize/2,
            grid.offsetX + (arrangeSquare.col * grid.cellSize) + grid.cellSize/2,
            grid.offsetY + (arrangeSquare.row * grid.cellSize) + grid.cellSize/2
          );

          // Draw pitch interval number
          const interval = arrangeSquare.row - square.row;
          textAlign(CENTER, CENTER);
          textSize(12);
          fill(0);
          noStroke();
          text(
            interval > 0 ? `+${interval}` : interval,
            grid.offsetX + (square.col * grid.cellSize) + grid.cellSize/2,
            grid.offsetY + (square.row * grid.cellSize) - 10
          );
          pop();
        }

        // Draw pitch square
        push();
        fill(220, 255, 220);
        stroke(190, 220, 190);
        square.draw(MODES.PITCH);
        pop();
      });
  }

  drawDashedLine(x1, y1, x2, y2) {
    const dashLength = 5;
    const gapLength = 5;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(distance / (dashLength + gapLength));
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 0; i < steps; i++) {
      const startX = x1 + (i * stepX);
      const startY = y1 + (i * stepY);
      const endX = startX + (stepX * dashLength / (dashLength + gapLength));
      const endY = startY + (stepY * dashLength / (dashLength + gapLength));
      line(startX, startY, endX, endY);
    }
  }
} 