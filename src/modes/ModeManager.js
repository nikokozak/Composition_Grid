export const MODES = {
  ARRANGE: 'arrange',
  // We'll add more modes later
};

export class ModeManager {
  constructor() {
    this.currentMode = MODES.ARRANGE;
    this.isPlaying = false;
    this.lastPlayToggleTime = 0;
    this.currentBeat = 0;
    this.tempo = 120; // BPM
  }

  update() {
    if (this.isPlaying) {
      const beatsPerSecond = this.tempo / 60;
      const deltaTime = (millis() - this.lastPlayToggleTime) / 1000;
      const newBeat = deltaTime * beatsPerSecond;
      
      // If we've passed the last column, reset timing to maintain perfect sync
      if (Math.floor(newBeat) >= this.grid.numCols) {
        this.lastPlayToggleTime = millis();
        this.currentBeat = 0;
      } else {
        this.currentBeat = newBeat;
      }
    }
  }

  togglePlayback() {
    // Debounce space bar hits
    if (millis() - this.lastPlayToggleTime < 200) return;
    
    this.isPlaying = !this.isPlaying;
    this.lastPlayToggleTime = millis();
    
    if (!this.isPlaying) {
      this.currentBeat = 0;
    }
  }

  draw(grid) {
    // Store grid reference for update calculations
    this.grid = grid;

    // Draw mode indicator
    textAlign(LEFT, BOTTOM);
    textSize(14);
    fill(0);
    noStroke();
    text(`Mode: ${this.currentMode}`, 20, height - 20);

    // Draw timing bar in arrange mode
    if (this.currentMode === MODES.ARRANGE) {
      this.drawTimingBar(grid);
    }
  }

  drawTimingBar(grid) {
    // Calculate x position based on current beat
    const beatIndex = Math.floor(this.currentBeat);
    const x = grid.offsetX + (beatIndex * grid.cellSize);
    
    stroke(255, 0, 0);
    strokeWeight(2);
    line(x, grid.offsetY, x, grid.offsetY + ((grid.numRows - 1) * grid.cellSize));

    // Draw beat number
    textAlign(CENTER, TOP);
    textSize(12);
    fill(255, 0, 0);
    noStroke();
    text(`Beat: ${beatIndex + 1}`, x, grid.offsetY - 20);
  }

  handleKeyPress(key) {
    if (key === ' ') {
      this.togglePlayback();
    }
    // We'll add more key handlers for other modes later
  }
} 