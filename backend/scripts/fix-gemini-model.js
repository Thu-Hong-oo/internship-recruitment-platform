/**
 * Script to fix GEMINI_MODEL in .env file
 * 
 * Usage:
 *   node scripts/fix-gemini-model.js
 * 
 * This script will:
 * 1. Read backend/.env
 * 2. Replace GEMINI_MODEL=gemini-2.0-flash-exp with GEMINI_MODEL=gemini-1.5-flash
 * 3. Save the file
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

console.log('🔧 Fixing GEMINI_MODEL in .env file...\n');

// Check if file exists
if (!fs.existsSync(envPath)) {
  console.error(`❌ File not found: ${envPath}`);
  process.exit(1);
}

// Read file
let envContent = fs.readFileSync(envPath, 'utf8');

// Check current value
const currentMatch = envContent.match(/^GEMINI_MODEL=(.+)$/m);
if (currentMatch) {
  console.log(`📋 Current value: ${currentMatch[1]}`);
} else {
  console.log(`⚠️  GEMINI_MODEL not found, will add it`);
}

// Replace or add GEMINI_MODEL
if (envContent.includes('GEMINI_MODEL=')) {
  // Replace existing
  envContent = envContent.replace(
    /^GEMINI_MODEL=.*$/m,
    'GEMINI_MODEL=gemini-1.5-flash'
  );
  console.log('✅ Updated existing GEMINI_MODEL');
} else {
  // Add new line
  envContent += '\nGEMINI_MODEL=gemini-1.5-flash\n';
  console.log('✅ Added new GEMINI_MODEL');
}

// Save file
fs.writeFileSync(envPath, envContent, 'utf8');

// Verify
const verifyContent = fs.readFileSync(envPath, 'utf8');
const verifyMatch = verifyContent.match(/^GEMINI_MODEL=(.+)$/m);

if (verifyMatch && verifyMatch[1] === 'gemini-1.5-flash') {
  console.log('\n✅ SUCCESS! GEMINI_MODEL has been updated to: gemini-1.5-flash');
  console.log('\n📝 Next steps:');
  console.log('   1. Upload CV again (no need to restart server)');
  console.log('   2. Check log to verify model is now gemini-1.5-flash');
} else {
  console.error('\n❌ FAILED! GEMINI_MODEL was not updated correctly');
  console.log(`   Found: ${verifyMatch ? verifyMatch[1] : 'not found'}`);
  process.exit(1);
}

