export class GridObject {
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