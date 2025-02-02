import { GRID_SPACING, GRID_PADDING } from '../constants.js';

// Constants for grid layout
const SAMPLE_DISPLAY_HEIGHT = 60;  // Height reserved for sample names
const MIN_CELL_SIZE = 40;  // Minimum space between points
const POINT_SIZE = 4;

export class Grid {
  constructor(initialCols = 16, initialRows = 12) {
    this.numCols = initialCols;
    this.numRows = initialRows;
    this.updateDimensions();
  }
  
  updateDimensions() {
    // Calculate available space
    this.width = windowWidth - (GRID_PADDING * 2);
    this.height = windowHeight - (GRID_PADDING * 2) - SAMPLE_DISPLAY_HEIGHT;
    
    // Calculate cell size to fit within available space
    const horizontalSpacing = this.width / (this.numCols - 1);
    const verticalSpacing = this.height / (this.numRows - 1);
    
    // Use the smaller spacing to ensure grid fits in both dimensions
    this.cellSize = Math.min(horizontalSpacing, verticalSpacing);
    
    // Ensure minimum cell size
    if (this.cellSize < MIN_CELL_SIZE) {
      this.cellSize = MIN_CELL_SIZE;
      // Adjust grid dimensions if necessary
      this.numCols = Math.floor(this.width / MIN_CELL_SIZE) + 1;
      this.numRows = Math.floor(this.height / MIN_CELL_SIZE) + 1;
      
      // Update input fields to reflect adjusted dimensions
      this.updateInputFields();
    }
    
    // Center the grid
    this.offsetX = (windowWidth - ((this.numCols - 1) * this.cellSize)) / 2;
    this.offsetY = SAMPLE_DISPLAY_HEIGHT + (windowHeight - SAMPLE_DISPLAY_HEIGHT - ((this.numRows - 1) * this.cellSize)) / 2;
  }

  updateInputFields() {
    const colsInput = document.getElementById('cols');
    const rowsInput = document.getElementById('rows');
    if (colsInput) colsInput.value = this.numCols;
    if (rowsInput) rowsInput.value = this.numRows;
  }

  setDimensions(cols, rows) {
    // Calculate max possible dimensions based on minimum cell size
    const maxCols = Math.floor(this.width / MIN_CELL_SIZE) + 1;
    const maxRows = Math.floor(this.height / MIN_CELL_SIZE) + 1;
    
    // Clamp dimensions
    this.numCols = Math.min(Math.max(2, cols), maxCols);
    this.numRows = Math.min(Math.max(2, rows), maxRows);
    
    this.updateDimensions();
  }
  
  getPointPosition(col, row) {
    return {
      x: this.offsetX + col * this.cellSize,
      y: this.offsetY + row * this.cellSize
    };
  }
  
  draw() {
    fill(245, 245, 220); // Beige
    noStroke();
    
    for (let i = 0; i < this.numCols; i++) {
      for (let j = 0; j < this.numRows; j++) {
        const pos = this.getPointPosition(i, j);
        circle(pos.x, pos.y, POINT_SIZE);
      }
    }
  }
} 