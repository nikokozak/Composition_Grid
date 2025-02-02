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

class Connection {
  constructor(sourceSquare, targetSquare, vertices = []) {
    this.sourceSquare = sourceSquare;
    this.targetSquare = targetSquare;
    this.vertices = vertices;
    this.path = this.calculatePath();
  }
  
  calculatePath() {
    const points = [];
    let currentPoint = {
      x: this.sourceSquare.col,
      y: this.sourceSquare.row
    };
    
    // Add path through each vertex
    const allPoints = [...this.vertices, {
      x: this.targetSquare.col,
      y: this.targetSquare.row
    }];
    
    for (const nextPoint of allPoints) {
      // Get path from current point to next point
      const segmentPoints = getGridPath(
        currentPoint.x, currentPoint.y,
        nextPoint.x, nextPoint.y
      );
      
      // Add all points except the last (to avoid duplicates)
      points.push(...segmentPoints.slice(0, -1));
      currentPoint = nextPoint;
    }
    
    // Add the final point
    points.push({
      x: this.targetSquare.col,
      y: this.targetSquare.row
    });
    
    return points;
  }
  
  draw(grid) {
    push(); // Save current drawing state
    stroke(255, 0, 0);
    strokeWeight(2);
    noFill();
    
    // Draw the path
    beginShape();
    this.path.forEach(p => {
      const pos = grid.getPointPosition(p.x, p.y);
      vertex(pos.x, pos.y);
    });
    endShape();
    
    // Draw an arrow at the end to show direction
    const lastPoint = this.path[this.path.length - 1];
    const secondLastPoint = this.path[this.path.length - 2];
    const lastPos = grid.getPointPosition(lastPoint.x, lastPoint.y);
    const angle = atan2(
      lastPoint.y - secondLastPoint.y,
      lastPoint.x - secondLastPoint.x
    );
    
    translate(lastPos.x, lastPos.y);
    rotate(angle);
    fill(255, 0, 0);
    noStroke();
    triangle(-8, -4, -8, 4, 0, 0);
    pop(); // Restore previous drawing state
  }
  
  containsPoint(col, row) {
    return this.path.some(p => p.x === col && p.y === row);
  }
  
  // Check if this connection connects the same squares (in either direction)
  matches(square1, square2) {
    return (
      (this.sourceSquare === square1 && this.targetSquare === square2) ||
      (this.sourceSquare === square2 && this.targetSquare === square1)
    );
  }
}

let grid;
let cursor;
let staticSquares = [];
let connections = [];
const ACCEPTED_KEYS = ['a', 's', 'd', 'f', 'e', 'g'];
let lastMoveTime = 0;
const MOVE_DELAY = 150; // Milliseconds between moves
let connectMode = false;
let connectSourceSquare = null;
let connectVertices = []; // Store vertices during connection creation

function setup() {
  createCanvas(windowWidth, windowHeight);
  grid = new Grid(GRID_SPACING, GRID_PADDING);
  cursor = new Cursor(grid);
}

// Helper function to check if two line segments overlap
function doSegmentsOverlap(a1, a2, b1, b2) {
  // If segments share an endpoint, they don't count as overlapping
  if ((a1.x === b1.x && a1.y === b1.y) || 
      (a1.x === b2.x && a1.y === b2.y) ||
      (a2.x === b1.x && a2.y === b1.y) ||
      (a2.x === b2.x && a2.y === b2.y)) {
    return false;
  }
  
  // Check if segments are on the same line (horizontal or vertical)
  const isHorizontal = a1.y === a2.y && b1.y === b2.y && a1.y === b1.y;
  const isVertical = a1.x === a2.x && b1.x === b2.x && a1.x === b1.x;
  
  if (isHorizontal) {
    // Sort x coordinates
    const [aMin, aMax] = [a1.x, a2.x].sort((a, b) => a - b);
    const [bMin, bMax] = [b1.x, b2.x].sort((a, b) => a - b);
    return !(aMax <= bMin || bMax <= aMin);
  }
  
  if (isVertical) {
    // Sort y coordinates
    const [aMin, aMax] = [a1.y, a2.y].sort((a, b) => a - b);
    const [bMin, bMax] = [b1.y, b2.y].sort((a, b) => a - b);
    return !(aMax <= bMin || bMax <= aMin);
  }
  
  return false;
}

// Check if a path has overlaps with itself or existing connections
function hasPathOverlap(points, ignoreExisting = false) {
  // Check self-overlaps first
  for (let i = 0; i < points.length - 1; i++) {
    const seg1Start = points[i];
    const seg1End = points[i + 1];
    
    // Check against later segments in the same path
    for (let j = i + 2; j < points.length - 1; j++) {
      const seg2Start = points[j];
      const seg2End = points[j + 1];
      
      if (doSegmentsOverlap(seg1Start, seg1End, seg2Start, seg2End)) {
        return true;
      }
    }
    
    // Check against existing connections if not ignored
    if (!ignoreExisting) {
      for (const conn of connections) {
        for (let j = 0; j < conn.path.length - 1; j++) {
          const seg2Start = conn.path[j];
          const seg2End = conn.path[j + 1];
          
          if (doSegmentsOverlap(seg1Start, seg1End, seg2Start, seg2End)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Get preview path points
function getPreviewPathPoints() {
  const points = [];
  let currentPoint = {
    x: connectSourceSquare.col,
    y: connectSourceSquare.row
  };
  
  // Add path through each vertex
  for (const vertex of connectVertices) {
    const segmentPoints = getGridPath(
      currentPoint.x, currentPoint.y,
      vertex.x, vertex.y
    );
    points.push(...segmentPoints.slice(0, -1));
    currentPoint = vertex;
  }
  
  // Add path to cursor
  const toTarget = getGridPath(
    currentPoint.x, currentPoint.y,
    cursor.col, cursor.row
  );
  points.push(...toTarget);
  
  return points;
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
  connections.forEach(conn => conn.draw(grid));
  staticSquares.forEach(square => square.draw());
  
  // Draw connection preview if in connect mode
  if (connectMode && connectSourceSquare) {
    const previewPoints = getPreviewPathPoints();
    
    // Draw preview path
    stroke(hasPathOverlap(previewPoints) ? color(255, 0, 0, 64) : color(255, 0, 0, 128));
    strokeWeight(2);
    noFill();
    beginShape();
    previewPoints.forEach(p => {
      const pos = grid.getPointPosition(p.x, p.y);
      vertex(pos.x, pos.y);
    });
    endShape();
    
    // Draw vertices
    stroke(255, 0, 0);
    fill(255, 0, 0);
    connectVertices.forEach(v => {
      const pos = grid.getPointPosition(v.x, v.y);
      circle(pos.x, pos.y, 8);
    });
  }
  
  cursor.draw();
}

function keyPressed() {
  if (key === 'c') {
    const squareAtCursor = getSquareAt(cursor.col, cursor.row);
    
    if (!connectMode && squareAtCursor) {
      // Start connection
      connectMode = true;
      connectSourceSquare = squareAtCursor;
      connectVertices = []; // Clear vertices
      console.log('Connection started from:', connectSourceSquare.key);
    } else if (connectMode) {
      // Complete connection only if there's a valid target square
      if (squareAtCursor && squareAtCursor !== connectSourceSquare) {
        const previewPoints = getPreviewPathPoints();
        
        if (!hasPathOverlap(previewPoints)) {
          const isDuplicate = connections.some(conn => 
            conn.matches(connectSourceSquare, squareAtCursor)
          );
          
          if (!isDuplicate) {
            console.log('Connected:', connectSourceSquare.key, 'to', squareAtCursor.key);
            connections.push(new Connection(connectSourceSquare, squareAtCursor, [...connectVertices]));
          } else {
            console.log('Connection already exists between these squares');
          }
        } else {
          console.log('Cannot create connection with overlapping segments');
        }
      }
      // Reset connection mode
      connectMode = false;
      connectSourceSquare = null;
      connectVertices = [];
    }
    return;
  }
  
  if (key === 'p' && connectMode) {
    const col = cursor.col;
    const row = cursor.row;
    
    // Don't allow vertices on squares
    if (getSquareAt(col, row)) return;
    
    // Check if there's already a vertex at this position
    const existingVertexIndex = connectVertices.findIndex(v => 
      v.x === col && v.y === row
    );
    
    if (existingVertexIndex !== -1) {
      // Remove the vertex if it exists
      connectVertices.splice(existingVertexIndex, 1);
    } else {
      // Test if adding this vertex would create overlaps
      const testVertices = [...connectVertices, {x: col, y: row}];
      let currentPoint = {
        x: connectSourceSquare.col,
        y: connectSourceSquare.row
      };
      
      const testPoints = [];
      for (const vertex of testVertices) {
        const segmentPoints = getGridPath(
          currentPoint.x, currentPoint.y,
          vertex.x, vertex.y
        );
        testPoints.push(...segmentPoints.slice(0, -1));
        currentPoint = vertex;
      }
      
      if (!hasPathOverlap(testPoints)) {
        // Add new vertex if no overlaps
        connectVertices.push({x: col, y: row});
      } else {
        console.log('Cannot add vertex - would create overlapping segments');
      }
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
    const col = cursor.col;
    const row = cursor.row;
    
    // Remove any connections at cursor position
    connections = connections.filter(conn => !conn.containsPoint(col, row));
    
    // Remove any squares at cursor position
    staticSquares = staticSquares.filter(square => 
      !(square.col === col && square.row === row)
    );
    
    // Reset connection mode if active
    connectMode = false;
    connectSourceSquare = null;
    connectVertices = [];
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
