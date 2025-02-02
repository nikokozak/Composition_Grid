import { BaseRenderer } from './BaseRenderer.js';
import { MODES } from '../modes/ModeManager.js';
import { state } from '../state/store.js';
import { getPreviewPathPoints } from '../utils/pathfinding.js';
import { hasPathOverlap } from '../utils/overlap.js';

export class ArrangeRenderer extends BaseRenderer {
  draw(grid, state) {
    // Draw arrange mode squares
    state.staticSquares
      .filter(square => square.mode === MODES.ARRANGE)
      .forEach(square => square.draw(MODES.ARRANGE));

    // Draw timing bar if playing
    const arrangeMode = state.modeManager.modes.arrange;
    if (arrangeMode.isPlaying) {
      this.drawTimingBar(grid, arrangeMode);
    }

    // Draw connections
    state.connections.forEach(conn => conn.draw(grid));
    
    // Draw connection preview if in connect mode
    if (state.connectMode && state.connectSourceSquare) {
      this.drawConnectionPreview(grid, state);
    }
  }

  //=============================================================================
  // PRIVATE METHODS
  //=============================================================================

  drawTimingBar(grid, arrangeMode) {
    const beatIndex = Math.floor(arrangeMode.currentBeat);
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

  drawConnectionPreview(grid, state) {
    const previewPoints = getPreviewPathPoints(
      state.connectSourceSquare,
      state.connectVertices,
      state.cursor
    );
    
    this.drawPreviewPath(grid, previewPoints, state.connections);
    this.drawPreviewVertices(grid, state.connectVertices);
  }

  drawPreviewPath(grid, previewPoints, connections) {
    const hasOverlap = hasPathOverlap(previewPoints, connections);
    
    push();
    stroke(hasOverlap ? color(255, 0, 0, 64) : color(255, 0, 0, 128));
    strokeWeight(2);
    noFill();
    
    beginShape();
    previewPoints.forEach(p => {
      const pos = grid.getPointPosition(p.x, p.y);
      vertex(pos.x, pos.y);
    });
    endShape();
    pop();
  }

  drawPreviewVertices(grid, vertices) {
    push();
    stroke(255, 0, 0);
    fill(255, 0, 0);
    vertices.forEach(v => {
      const pos = grid.getPointPosition(v.x, v.y);
      circle(pos.x, pos.y, 8);
    });
    pop();
  }
} 