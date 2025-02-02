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
    const newCol = constrain(this.col + deltaCol, 0, this.grid.cols - 1);
    const newRow = constrain(this.row + deltaRow, 0, this.grid.rows - 1);
    this.col = newCol;
    this.row = newRow;
  }
} 