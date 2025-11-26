/**
 * Script to check GEMINI_MODEL value from .env file
 * 
 * Usage:
 *   node scripts/check-env.js
 * 
 * This script helps debug which .env file is being loaded
 * and what value GEMINI_MODEL has.
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Checking .env files...\n');

// Check backend/.env
const backendEnvPath = path.join(__dirname, '..', '.env');
console.log(`📁 Checking: ${backendEnvPath}`);

if (fs.existsSync(backendEnvPath)) {
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  const geminiModelMatch = envContent.match(/^GEMINI_MODEL=(.+)$/m);
  
  if (geminiModelMatch) {
    console.log(`✅ Found GEMINI_MODEL: ${geminiModelMatch[1]}`);
  } else {
    console.log(`❌ GEMINI_MODEL not found in backend/.env`);
  }
  
  // Show all lines containing GEMINI
  const geminiLines = envContent.split('\n').filter(line => line.includes('GEMINI'));
  if (geminiLines.length > 0) {
    console.log(`\n📋 All GEMINI-related lines:`);
    geminiLines.forEach(line => console.log(`   ${line.trim()}`));
  }
} else {
  console.log(`❌ File does not exist`);
}

// Check root .env (if exists)
const rootEnvPath = path.join(__dirname, '..', '..', '.env');
console.log(`\n📁 Checking root: ${rootEnvPath}`);

if (fs.existsSync(rootEnvPath)) {
  const envContent = fs.readFileSync(rootEnvPath, 'utf8');
  const geminiModelMatch = envContent.match(/^GEMINI_MODEL=(.+)$/m);
  
  if (geminiModelMatch) {
    console.log(`✅ Found GEMINI_MODEL: ${geminiModelMatch[1]}`);
    console.log(`⚠️  WARNING: Root .env file exists and may override backend/.env`);
  } else {
    console.log(`ℹ️  GEMINI_MODEL not found in root/.env`);
  }
} else {
  console.log(`ℹ️  Root .env does not exist (this is OK)`);
}

// Check what dotenv will load
console.log(`\n🔍 Testing dotenv.config()...`);
require('dotenv').config({ path: backendEnvPath });

console.log(`\n📊 process.env.GEMINI_MODEL value:`);
console.log(`   Raw: "${process.env.GEMINI_MODEL}"`);
console.log(`   Type: ${typeof process.env.GEMINI_MODEL}`);
console.log(`   Length: ${process.env.GEMINI_MODEL?.length || 0}`);

if (process.env.GEMINI_MODEL) {
  console.log(`\n✅ Value loaded successfully: ${process.env.GEMINI_MODEL}`);
} else {
  console.log(`\n❌ GEMINI_MODEL is not set in process.env`);
  console.log(`   Default will be used: gemini-pro`);
}

