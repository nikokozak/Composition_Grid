import { state } from '../state/store.js';

export class TimeManager {
  constructor() {
    this.transport = Tone.getTransport();
    this.transport.bpm.value = 120;
    this.transport.timeSignature = 1; // Default to quarter notes
    this.lastTriggeredColumn = -1;
    
    // Schedule column triggers with lookahead
    this.transport.scheduleRepeat(time => {
      const currentColumn = this.getCurrentColumn();
      // Only trigger if column has changed
      if (currentColumn !== this.lastTriggeredColumn) {
        this.triggerCurrentColumn(time);
        this.lastTriggeredColumn = currentColumn;
      }
    }, "32n"); // Increased resolution for more precise timing
  }

  start() {
    // Ensure audio context is started
    Tone.start();
    this.transport.start();
  }

  stop() {
    this.transport.stop();
  }

  setTempo(bpm) {
    this.transport.bpm.value = Math.max(20, Math.min(300, bpm)); // Clamp between 20 and 300 BPM
  }

  setTimeSignature(value) {
    // Convert our simple value to actual time signature
    const signatures = {
      0.25: [1, 16], // 16th notes
      0.5: [1, 8],   // 8th notes
      1: [1, 4],     // quarter notes
      2: [1, 2]      // half notes
    };
    
    if (signatures[value]) {
      const [numerator, denominator] = signatures[value];
      this.transport.timeSignature = value;
      this.transport.setTimeSignature(numerator, denominator);
    }
  }

  triggerCurrentColumn(time) {
    const col = this.getCurrentColumn();
    // Cache filtered squares to avoid repeated filtering
    const activeSquares = state.staticSquares.filter(square => 
      square.col === col && 
      square.mode === 'arrange' && 
      state.sampleManager.players.get(square.key)?.loaded
    );
    
    // Batch trigger all samples
    if (activeSquares.length > 0) {
      activeSquares.forEach(square => {
        state.sampleManager.playSampleAtTime(square.key, time);
      });
    }
  }

  getCurrentColumn() {
    // Convert transport position to grid column
    // 4 = number of 16th notes per beat
    return Math.floor(this.transport.ticks / this.transport.PPQ * 4) % state.grid.numCols;
  }

  // Helper method to convert grid position to time
  getTimeAtColumn(col) {
    // Convert grid column to 16th notes
    return Tone.Time(`${col}*16n`);
  }
} 