import { GridObject } from '../core/GridObject.js';
import { CURSOR_SIZE } from '../constants.js';

export class StaticSquare extends GridObject {
  constructor(grid, col, row, key) {
    super(grid, col, row);
    this.key = key;
  }
  
  drawAtPosition(x, y) {
    fill(0, 150, 255, 150);
    rectMode(CENTER);
    square(x, y, CURSOR_SIZE);
    
    // Draw the key character
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(16);
    text(this.key, x, y);
  }
  
  move() { /* Static squares don't move */ }
} 