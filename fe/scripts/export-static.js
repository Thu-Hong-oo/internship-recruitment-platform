/**
 * Script to export Next.js static files to out/ directory
 * This is needed because Next.js 15 with output: 'export' may not create out/ automatically
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../.next');
const outDir = path.join(__dirname, '../out');

// Create out directory if it doesn't exist
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
  console.log('✅ Created out/ directory');
}

// Copy static files from .next/static to out/_next/static
const staticSource = path.join(sourceDir, 'static');
const staticDest = path.join(outDir, '_next/static');

if (fs.existsSync(staticSource)) {
  if (!fs.existsSync(staticDest)) {
    fs.mkdirSync(staticDest, { recursive: true });
  }
  
  // Copy recursively
  function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyRecursive(staticSource, staticDest);
  console.log('✅ Copied static files to out/_next/static');
}

// Copy HTML files from .next/server/app to out/
const appSource = path.join(sourceDir, 'server/app');
const appDest = outDir;

if (fs.existsSync(appSource)) {
  function copyHTMLFiles(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyHTMLFiles(srcPath, destPath);
      } else if (entry.name.endsWith('.html')) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyHTMLFiles(appSource, appDest);
  console.log('✅ Copied HTML files to out/');
}

console.log('✅ Static export complete!');

