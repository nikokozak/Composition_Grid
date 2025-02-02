export function doSegmentsOverlap(a1, a2, b1, b2) {
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

export function hasPathOverlap(points, connections = [], ignoreExisting = false) {
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