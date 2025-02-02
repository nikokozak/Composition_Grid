import { GridObject } from '../core/GridObject.js';
import { CURSOR_SIZE } from '../constants.js';

export class Cursor extends GridObject {
  constructor(grid, col = 0, row = 0) {
    super(grid, col, row, '@'); // Cursor uses @ symbol
  }
  
  drawAtPosition(x, y) {
    fill(255, 0, 0, 150);
    rectMode(CENTER);
    square(x, y, CURSOR_SIZE);
  }
  
  move(deltaCol, deltaRow) {
    // Use modulo to wrap around grid edges
    this.col = (this.col + deltaCol + this.grid.numCols) % this.grid.numCols;
    this.row = (this.row + deltaRow + this.grid.numRows) % this.grid.numRows;
  }
} 