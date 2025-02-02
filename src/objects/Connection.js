import { getGridPath } from '../utils/pathfinding.js';

export class Connection {
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