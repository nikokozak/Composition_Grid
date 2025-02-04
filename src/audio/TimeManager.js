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
    // Store our simple value for UI/reference
    this.transport.timeSignature = value;

    // Convert to actual time signature and update timing
    switch(value) {
      case 0.25: // 16th notes
        this.transport.PPQ = this.transport.PPQ * 4;
        break;
      case 0.5: // 8th notes
        this.transport.PPQ = this.transport.PPQ * 2;
        break;
      case 1: // quarter notes (default)
        this.transport.PPQ = 192; // Tone.js default PPQ
        break;
      case 2: // half notes
        this.transport.PPQ = this.transport.PPQ / 2;
        break;
    }
  }

  triggerCurrentColumn(time) {
    const col = this.getCurrentColumn();
    // Cache filtered squares to avoid repeated filtering
    const activeSquares = state.staticSquares.filter(square => 
      square.col === col && 
      square.mode === 'arrange' && 
      state.sampleManager.players.get(square.key)?.loaded &&
      // Make sure the square still exists in arrange mode at this position
      state.staticSquares.some(s => 
        s.col === square.col && 
        s.row === square.row && 
        s.key === square.key && 
        s.mode === 'arrange'
      )
    );
    
    // Batch trigger all samples
    if (activeSquares.length > 0) {
      activeSquares.forEach(square => {
        state.sampleManager.playSampleAtTime(square.key, time);
      });
    }
  }

  getCurrentColumn() {
    // Convert transport position to grid column based on current time signature
    const timeSignature = this.transport.timeSignature;
    const multiplier = 4 / timeSignature; // Adjust for time signature
    return Math.floor(this.transport.ticks / this.transport.PPQ * multiplier) % state.grid.numCols;
  }

  // Helper method to convert grid position to time
  getTimeAtColumn(col) {
    // Convert grid column to 16th notes
    return Tone.Time(`${col}*16n`);
  }
} 