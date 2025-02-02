import { state } from '../state/store.js';

export class SampleManager {
  constructor() {
    this.samples = new Map();
    this.sampleNames = [];
    this.keyMap = new Map(); // Maps keys to sample names
    this.middleRowKeys = ['a','s','d','f','g','h','j','k','l']; // Standard keyboard middle row
    this.trimPositions = new Map(); // Maps sample names to {start, end} grid positions
  }

  async loadSamples() {
    const sampleFiles = [
      'Hat-Espeeeeee.wav',
      'Synth-AuroraBoreal.wav',
      'Synth-AfterHours.wav',
      'Synth-BlocySquare3.wav',
      'Basedrum-Eightsnap.wav'
    ];

    // Reset key mappings
    this.keyMap.clear();
    this.sampleNames = [];
    
    // Randomly assign keys to samples
    const availableKeys = [...this.middleRowKeys];
    for (const file of sampleFiles) {
      const player = new Tone.Player({
        url: `samples/${file}`,
        onload: () => console.log(`Loaded ${file}`),
      }).toDestination();

      const name = file.replace('.wav', '');
      this.samples.set(name, player);
      this.sampleNames.push(name);
      
      // Randomly assign a key if there are still keys available
      if (availableKeys.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableKeys.length);
        const key = availableKeys.splice(randomIndex, 1)[0];
        this.keyMap.set(key, name);
      }
    }

    await Tone.loaded();
    console.log('Key mappings:', Object.fromEntries(this.keyMap));
  }

  getSampleNames() {
    return this.sampleNames;
  }

  playSample(name) {
    const player = this.samples.get(name);
    if (!player) return;

    const trimPos = this.trimPositions.get(name);
    if (!trimPos) {
      // No trim positions set, play full sample
      player.start();
      return;
    }

    const buffer = player.buffer;
    if (!buffer) return;

    // Calculate time positions based on grid positions
    const samplesPerColumn = buffer.length / state.grid.numCols;
    const startTime = (trimPos.start * samplesPerColumn) / buffer.sampleRate;
    const endTime = trimPos.end ? 
      (trimPos.end * samplesPerColumn) / buffer.sampleRate : 
      buffer.duration;

    player.start(undefined, startTime, endTime - startTime);
  }

  // Get the sample name associated with a key
  getSampleForKey(key) {
    return this.keyMap.get(key);
  }

  // Get all key mappings for display
  getKeyMappings() {
    return Object.fromEntries(this.keyMap);
  }

  // Get the audio buffer for waveform visualization
  getSampleBuffer(name) {
    const player = this.samples.get(name);
    if (!player) return null;
    return player.buffer;
  }

  // Get trim positions for a sample
  getTrimPositions(name) {
    return this.trimPositions.get(name);
  }

  // Set trim positions for a sample
  setTrimPositions(name, startCol, endCol = null) {
    this.trimPositions.set(name, { start: startCol, end: endCol });
  }

  // Clear trim positions for a sample
  clearTrimPositions(name) {
    this.trimPositions.delete(name);
  }
} 