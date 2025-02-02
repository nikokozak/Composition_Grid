import { state } from '../state/store.js';

/**
 * UIManager - Handles global UI elements that are mode-independent
 */
export class UIManager {
  constructor() {}

  /**
   * Draw all global UI elements
   */
  draw() {
    this.drawSampleNames();
  }

  /**
   * Draw the sample names and their key mappings at the top of the screen
   */
  drawSampleNames() {
    const sampleNames = state.sampleManager.getSampleNames();
    const keyMappings = state.sampleManager.getKeyMappings();
    const spacing = width / (sampleNames.length + 1);
    
    push();
    textAlign(CENTER, CENTER);
    textSize(14);
    fill(0);
    noStroke();
    
    sampleNames.forEach((name, i) => {
      const x = spacing * (i + 1);
      const y = 30;
      
      // Find the key for this sample
      const key = Object.entries(keyMappings).find(([k, n]) => n === name)?.[0];
      const displayText = key ? `${name} [${key}]` : name;
      
      text(displayText, x, y);
    });
    pop();
  }
} 