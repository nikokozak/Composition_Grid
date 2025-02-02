const GRID_SPACING = 30; // Distance between dots
const GRID_PADDING = 40; // Padding from window edges
const CURSOR_SIZE = 20; // Size of the cursor square

class GridObject {
  constructor(grid, col = 0, row = 0, char = '') {
    this.grid = grid;
    this.col = col;
    this.row = row;
    this.char = char;
  }
  
  draw() {
    const pos = this.grid.getPointPosition(this.col, this.row);
    this.drawAtPosition(pos.x, pos.y);
    
    // Draw character
    if (this.char) {
      fill(0); // Black text
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(16);
      text(this.char, pos.x, pos.y);
    }
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

class StaticSquare extends GridObject {
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
let staticSquares = [];
const ACCEPTED_KEYS = ['a', 's', 'd', 'f', 'e', 'g'];
let lastMoveTime = 0;
const MOVE_DELAY = 150; // Milliseconds between moves
let connectMode = false;
let connectSourceSquare = null;

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
  // Draw all static squares
  staticSquares.forEach(square => square.draw());
  cursor.draw();
  
  // Draw connection preview if in connect mode
  if (connectMode && connectSourceSquare) {
    const sourcePos = grid.getPointPosition(connectSourceSquare.col, connectSourceSquare.row);
    const cursorPos = grid.getPointPosition(cursor.col, cursor.row);
    
    // Get path points
    const points = getGridPath(
      connectSourceSquare.col, connectSourceSquare.row,
      cursor.col, cursor.row
    );
    
    // Draw path
    stroke(255, 0, 0);
    strokeWeight(2);
    noFill();
    beginShape();
    points.forEach(p => {
      const pos = grid.getPointPosition(p.x, p.y);
      vertex(pos.x, pos.y);
    });
    endShape();
  }
}

function keyPressed() {
  // Handle connection mode
  if (key === 'c') {
    const squareAtCursor = getSquareAt(cursor.col, cursor.row);
    
    if (!connectMode && squareAtCursor) {
      // Start connection
      connectMode = true;
      connectSourceSquare = squareAtCursor;
      console.log('Connection started from:', connectSourceSquare.key);
    } else if (connectMode) {
      // Complete connection only if there's a valid target square
      if (squareAtCursor && squareAtCursor !== connectSourceSquare) {
        console.log('Connected:', connectSourceSquare.key, 'to', squareAtCursor.key);
      }
      // Reset connection mode regardless
      connectMode = false;
      connectSourceSquare = null;
    }
    return;
  }
  
  // Check if the pressed key is in the accepted keys list
  if (ACCEPTED_KEYS.includes(key)) {
    // Check if position is not occupied
    if (!isPositionOccupied(cursor.col, cursor.row)) {
      staticSquares.push(new StaticSquare(grid, cursor.col, cursor.row, key));
    }
  }
  
  // Handle deletion with 'x' key
  if (key === 'x') {
    // Find and remove any square at cursor position
    staticSquares = staticSquares.filter(square => 
      !(square.col === cursor.col && square.row === cursor.row)
    );
    // Reset connection mode if active
    connectMode = false;
    connectSourceSquare = null;
  }
}

function isPositionOccupied(col, row) {
  return staticSquares.some(square => 
    square.col === col && square.row === row
  );
}

function getSquareAt(col, row) {
  return staticSquares.find(square => 
    square.col === col && square.row === row
  );
}

function getGridPath(startX, startY, endX, endY) {
  const points = [];
  points.push({x: startX, y: startY});
  
  // First move horizontally
  const currentX = startX;
  while (points[points.length-1].x !== endX) {
    const nextX = points[points.length-1].x + Math.sign(endX - currentX);
    points.push({x: nextX, y: startY});
  }
  
  // Then move vertically
  while (points[points.length-1].y !== endY) {
    const nextY = points[points.length-1].y + Math.sign(endY - startY);
    points.push({x: endX, y: nextY});
  }
  
  return points;
}

// Add this to handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  grid.updateDimensions();
}
