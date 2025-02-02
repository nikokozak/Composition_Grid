const GRID_SPACING = 30; // Distance between dots
const GRID_PADDING = 40; // Padding from window edges

class Grid {
  constructor(spacing, padding) {
    this.spacing = spacing;
    this.padding = padding;
  }
  
  draw() {
    fill(245, 245, 220); // Beige
    noStroke();
    
    const cols = floor((width - 2 * this.padding) / this.spacing);
    const rows = floor((height - 2 * this.padding) / this.spacing);
    
    // Calculate actual padding to center the grid
    const actualPaddingX = (width - (cols - 1) * this.spacing) / 2;
    const actualPaddingY = (height - (rows - 1) * this.spacing) / 2;
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = actualPaddingX + i * this.spacing;
        const y = actualPaddingY + j * this.spacing;
        circle(x, y, 4); // Small 4px diameter dots
      }
    }
  }
}

let grid;

function setup() {
  createCanvas(windowWidth, windowHeight);
  grid = new Grid(GRID_SPACING, GRID_PADDING);
}

function draw() {
  background(220);
  grid.draw();
}

// Add this to handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
