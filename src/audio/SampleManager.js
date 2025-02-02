export class SampleManager {
  constructor() {
    this.samples = new Map();
    this.sampleNames = [];
    this.keyMap = new Map(); // Maps keys to sample names
    this.middleRowKeys = ['a','s','d','f','g','h','j','k','l']; // Standard keyboard middle row
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
    if (player) {
      player.start();
    }
  }

  // Get the sample name associated with a key
  getSampleForKey(key) {
    return this.keyMap.get(key);
  }

  // Get all key mappings for display
  getKeyMappings() {
    return Object.fromEntries(this.keyMap);
  }
} 