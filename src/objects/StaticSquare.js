import { GridObject } from '../core/GridObject.js';
import { CURSOR_SIZE } from '../constants.js';

export class StaticSquare extends GridObject {
  constructor(grid, col, row, key, mode, sampleKey = null) {
    super(grid, col, row);
    this.key = key;
    this.mode = mode;
    this.sampleKey = sampleKey;
    console.log('Created StaticSquare:', { col, row, key, mode, sampleKey });
  }
  
  draw(currentMode) {
    const pos = this.grid.getPointPosition(this.col, this.row);
    
    // Set opacity based on whether we're in the same mode (25% opacity for other modes)
    const alpha = this.mode === currentMode ? 255 : 64;
    
    push();
    
    // Draw square
    fill(0, 150, 255, alpha);
    noStroke();
    rectMode(CENTER);
    square(pos.x, pos.y, CURSOR_SIZE);
    
    // Draw key character
    fill(0, alpha);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(this.key, pos.x, pos.y);
    
    pop();
  }
  
  move() { /* Static squares don't move */ }
} 