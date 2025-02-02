import { state } from '../state/store.js';
import { StaticSquare } from '../objects/StaticSquare.js';
import { ArrangeMode } from './ArrangeMode.js';
import { TrimMode } from './TrimMode.js';
import { VolumeMode } from './VolumeMode.js';
import { ArrangeRenderer } from '../rendering/ArrangeRenderer.js';
import { TrimRenderer } from '../rendering/TrimRenderer.js';
import { VolumeRenderer } from '../rendering/VolumeRenderer.js';

export const MODES = {
  ARRANGE: 'arrange',
  TRIM: 'trim',
  VOLUME: 'volume'
};

export class ModeManager {
  constructor() {
    // Initialize modes
    this.modes = {
      arrange: new ArrangeMode(),
      trim: new TrimMode(),
      volume: new VolumeMode()
    };

    // Initialize renderers
    this.renderers = {
      arrange: new ArrangeRenderer(),
      trim: new TrimRenderer(),
      volume: new VolumeRenderer()
    };

    this.currentMode = this.modes.arrange;
    this.selectedSampleKey = null; // For trim mode: tracks which sample is being edited
  }

  update(deltaTime) {
    // Update current mode
    this.currentMode.update(deltaTime);
  }

  draw(grid) {
    // Get the renderer for the current mode
    const renderer = this.renderers[this.currentMode.name];
    if (!renderer) {
      console.error(`No renderer found for mode: ${this.currentMode.name}`);
      return;
    }

    // Draw using the mode's renderer
    renderer.draw(grid, state);
    this.drawStatusText();
  }

  handleKeyPress(key) {
    // Handle mode switching
    switch(key) {
      case 'q':
        this.switchMode('arrange');
        return true;
      case 't':
        this.switchMode('trim');
        return true;
      case 'v':
        this.switchMode('volume');
        return true;
    }

    // If not a mode switch, let the current mode handle it
    return this.currentMode.handleKeyPress(key);
  }

  handleObjectCreation(key) {
    return this.currentMode.handleObjectCreation(key);
  }

  handleObjectDeletion() {
    if (!this.currentMode) {
      console.error('No current mode set');
      return false;
    }
    console.log('ModeManager handling deletion for mode:', this.currentMode.name);
    const result = this.currentMode.handleObjectDeletion();
    console.log('Deletion result:', result);
    return result;
  }

  switchMode(modeName) {
    if (!this.modes[modeName]) {
      console.error(`Invalid mode: ${modeName}`);
      return;
    }

    this.currentMode.onExit();
    this.currentMode = this.modes[modeName];
    this.currentMode.onEnter();
  }

  //=============================================================================
  // PLAYBACK CONTROL
  //=============================================================================

  togglePlayback() {
    if (state.timeManager.transport.state === 'started') {
      state.timeManager.stop();
    } else {
      state.timeManager.start();
    }
  }

  setTempo(bpm) {
    state.timeManager.setTempo(bpm);
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
      state.timeManager.setTimeSignature(...signatures[value]);
    }
  }

  //=============================================================================
  // PRIVATE METHODS
  //=============================================================================

  drawStatusText() {
    push();
    textAlign(LEFT, BOTTOM);
    textSize(14);
    fill(0);
    noStroke();
    text(this.currentMode.getStatusText(), 20, height - 20);
    pop();
  }
} 
 