import { GRID_SPACING, GRID_PADDING } from '../constants.js';

export class Grid {
  constructor() {
    this.spacing = GRID_SPACING;
    this.padding = GRID_PADDING;
    this.updateDimensions();
  }
  
  updateDimensions() {
    this.cols = floor((width - 2 * this.padding) / this.spacing);
    this.rows = floor((height - 2 * this.padding) / this.spacing);
    this.actualPaddingX = (width - (this.cols - 1) * this.spacing) / 2;
    this.actualPaddingY = (height - (this.rows - 1) * this.spacing) / 2;
  }
  
  getPointPosition(col, row) {
    return {
      x: this.actualPaddingX + col * this.spacing,
      y: this.actualPaddingY + row * this.spacing
    };
  }
  
  draw() {
    fill(245, 245, 220); // Beige
    noStroke();
    
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const x = this.actualPaddingX + i * this.spacing;
        const y = this.actualPaddingY + j * this.spacing;
        circle(x, y, 4); // Small 4px diameter dots
      }
    }
  }
} 