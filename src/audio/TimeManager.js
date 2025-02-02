import { state } from '../state/store.js';

export class TimeManager {
  constructor() {
    this.transport = Tone.getTransport();
    this.transport.bpm.value = 120;
    this.transport.timeSignature = 4;
    
    // Schedule column triggers
    this.transport.scheduleRepeat(time => {
      this.triggerCurrentColumn(time);
    }, "16n");
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
    this.transport.bpm.value = bpm;
  }

  setTimeSignature(numerator, denominator = 4) {
    this.transport.timeSignature = [numerator, denominator];
  }

  triggerCurrentColumn(time) {
    const col = this.getCurrentColumn();
    // Trigger all samples in this column
    state.staticSquares
      .filter(square => square.col === col && square.mode === 'arrange')
      .forEach(square => {
        state.sampleManager.playSampleAtTime(square.key, time);
      });
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