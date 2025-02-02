import { GRID_SPACING, GRID_PADDING } from '../constants.js';

// Constants for grid layout
const SAMPLE_DISPLAY_HEIGHT = 60;  // Height reserved for sample names
const CELL_SIZE = 40;
const POINT_SIZE = 4;

export class Grid {
  constructor() {
    this.updateDimensions();
  }
  
  updateDimensions() {
    this.width = windowWidth - (GRID_PADDING * 2);
    this.height = windowHeight - (GRID_PADDING * 2) - SAMPLE_DISPLAY_HEIGHT;
    this.cols = floor(this.width / CELL_SIZE);
    this.rows = floor(this.height / CELL_SIZE);
    this.offsetX = (windowWidth - (this.cols * CELL_SIZE)) / 2;
    this.offsetY = SAMPLE_DISPLAY_HEIGHT + (windowHeight - SAMPLE_DISPLAY_HEIGHT - (this.rows * CELL_SIZE)) / 2;
  }
  
  getPointPosition(col, row) {
    return {
      x: this.offsetX + col * CELL_SIZE,
      y: this.offsetY + row * CELL_SIZE
    };
  }
  
  draw() {
    fill(245, 245, 220); // Beige
    noStroke();
    
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const x = this.offsetX + i * CELL_SIZE;
        const y = this.offsetY + j * CELL_SIZE;
        circle(x, y, POINT_SIZE); // Small 4px diameter dots
      }
    }
  }
} 