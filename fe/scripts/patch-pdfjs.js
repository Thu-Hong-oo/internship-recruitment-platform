#!/usr/bin/env node

/**
 * Patch pdfjs-dist to remove canvas require
 * This script should be run after npm install
 */

const fs = require('fs');
const path = require('path');

const pdfjsPath = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.js');

if (!fs.existsSync(pdfjsPath)) {
  console.log('⚠️ pdfjs-dist not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(pdfjsPath, 'utf8');

// Check if already patched
if (content.includes('// Patched: canvas module not available in browser')) {
  console.log('✅ pdfjs-dist already patched');
  process.exit(0);
}

// Patch NodeCanvasFactory
const oldCode = `class NodeCanvasFactory extends _base_factory.BaseCanvasFactory {
  _createCanvas(width, height) {
    const Canvas = require("canvas");
    return Canvas.createCanvas(width, height);
  }
}`;

const newCode = `class NodeCanvasFactory extends _base_factory.BaseCanvasFactory {
  _createCanvas(width, height) {
    // Patched: canvas module not available in browser
    // Browser will use native canvas API via react-pdf, so this factory is not used
    // Return a mock canvas object to prevent errors
    try {
      // Try to use browser's native canvas if available (shouldn't reach here in browser)
      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
      }
      // Fallback: return empty object (will be handled by react-pdf)
      return { width, height };
    } catch (e) {
      // If all else fails, return empty object
      return { width, height };
    }
  }
}`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(pdfjsPath, content, 'utf8');
  console.log('✅ Successfully patched pdfjs-dist');
} else {
  console.log('⚠️ Could not find NodeCanvasFactory to patch');
  process.exit(1);
}

