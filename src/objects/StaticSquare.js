import { GridObject } from '../core/GridObject.js';
import { CURSOR_SIZE } from '../constants.js';

export class StaticSquare extends GridObject {
  constructor(grid, col, row, key, mode) {
    super(grid, col, row);
    this.key = key;
    this.mode = mode; // Store which mode this square belongs to
  }
  
  draw(currentMode) {
    const pos = this.grid.getPointPosition(this.col, this.row);
    
    // Set opacity based on whether we're in the same mode (25% opacity for other modes)
    const alpha = this.mode === currentMode ? 255 : 64;
    
    push(); // Save current drawing state
    
    fill(0, 150, 255, alpha);
    noStroke();
    rectMode(CENTER);
    square(pos.x, pos.y, CURSOR_SIZE);
    
    // Draw the key character
    fill(0, alpha);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(this.key, pos.x, pos.y);
    
    pop(); // Restore previous drawing state
  }
  
  move() { /* Static squares don't move */ }
} 