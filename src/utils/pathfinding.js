export function getGridPath(startX, startY, endX, endY) {
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

export function getPreviewPathPoints(connectSourceSquare, connectVertices, cursor) {
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