const GRID_SPACING = 30; // Distance between dots
const GRID_PADDING = 40; // Padding from window edges
const CURSOR_SIZE = 20; // Size of the cursor square

class GridObject {
  constructor(grid, col = 0, row = 0) {
    this.grid = grid;
    this.col = col;
    this.row = row;
  }
  
  draw() {
    const pos = this.grid.getPointPosition(this.col, this.row);
    this.drawAtPosition(pos.x, pos.y);
  }
  
  // Override these in child classes
  drawAtPosition(x, y) {
    throw new Error('drawAtPosition must be implemented by child class');
  }
  
  move(deltaCol, deltaRow) {
    throw new Error('move must be implemented by child class');
  }
}

class Cursor extends GridObject {
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

// Example of object with different movement:
// class Bouncer extends GridObject {
//   move(deltaCol, deltaRow) {
//     this.col = (this.col + deltaCol + this.grid.cols) % this.grid.cols;
//     this.row = (this.row + deltaRow + this.grid.rows) % this.grid.rows;
//   }
// }

class Grid {
  constructor(spacing, padding) {
    this.spacing = spacing;
    this.padding = padding;
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

let grid;
let cursor;
let lastMoveTime = 0;
const MOVE_DELAY = 150; // Milliseconds between moves

function setup() {
  createCanvas(windowWidth, windowHeight);
  grid = new Grid(GRID_SPACING, GRID_PADDING);
  cursor = new Cursor(grid);
}

function draw() {
  background(220);
  
  // Only move if enough time has passed
  if (millis() - lastMoveTime > MOVE_DELAY) {
    if (keyIsDown(LEFT_ARROW)) {
      cursor.move(-1, 0);
      lastMoveTime = millis();
    }
    if (keyIsDown(RIGHT_ARROW)) {
      cursor.move(1, 0);
      lastMoveTime = millis();
    }
    if (keyIsDown(UP_ARROW)) {
      cursor.move(0, -1);
      lastMoveTime = millis();
    }
    if (keyIsDown(DOWN_ARROW)) {
      cursor.move(0, 1);
      lastMoveTime = millis();
    }
  }
  
  grid.draw();
  cursor.draw();
}

// Add this to handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  grid.updateDimensions();
}
