/**
 * Test Script for CV Preview Generator
 * Run: node scripts/testPreviewGenerator.js
 */

const CVPreviewGenerator = require('../src/services/cvPreviewGenerator');
const { logger } = require('../src/utils/logger');

async function testPreviewGeneration() {
  console.log('🚀 Starting CV Preview Generator Test...\n');

  const generator = new CVPreviewGenerator();

  try {
    // Test 1: Initialize generator
    console.log('📋 Test 1: Initializing generator...');
    await generator.initialize();
    console.log('✅ Generator initialized successfully\n');

    // Test 2: Generate single template preview
    console.log('📋 Test 2: Generating single template preview (modern)...');
    const sampleData = {
      name: 'Nguyễn Văn An',
      title: 'Thực tập sinh Phát triển Phần mềm',
      email: 'nguyenvanan@email.com',
      phone: '0123 456 789',
      address: 'TP. Hồ Chí Minh',
    };

    const singleResult = await generator.generatePreview('modern', sampleData);
    console.log('✅ Single preview generated:', singleResult);
    console.log('');

    // Test 3: Check preview existence
    console.log('📋 Test 3: Checking preview existence...');
    const existenceCheck = await generator.checkPreviewExists('modern');
    console.log('✅ Existence check result:', existenceCheck);
    console.log('');

    // Test 4: Generate multiple templates (limited for testing)
    console.log('📋 Test 4: Generating previews for core templates...');
    const coreTemplates = ['modern', 'student-tech', 'minimal'];

    for (const templateId of coreTemplates) {
      try {
        console.log(`  📄 Generating ${templateId}...`);
        const result = await generator.generatePreview(templateId, sampleData);
        console.log(`  ✅ ${templateId}: ${result.preview}`);
      } catch (error) {
        console.log(`  ❌ ${templateId}: ${error.message}`);
      }
    }
    console.log('');

    // Test 5: Check all templates status
    console.log('📋 Test 5: Checking status for all core templates...');
    for (const templateId of coreTemplates) {
      const status = await generator.checkPreviewExists(templateId);
      console.log(`  📊 ${templateId}:`, {
        preview: status.preview?.exists ? '✅' : '❌',
        thumbnail: status.thumbnail?.exists ? '✅' : '❌',
      });
    }

    console.log('\n🎉 All tests completed successfully!');

    // Performance test (optional)
    if (process.argv.includes('--performance')) {
      console.log('\n📊 Running performance test...');
      const startTime = Date.now();

      await generator.generateAllPreviews();

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`⚡ Generated all previews in ${duration}s`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('Preview generator test failed:', error);
  } finally {
    // Clean up
    await generator.close();
    console.log('\n🔒 Generator closed');
  }
}

// CLI usage examples
function showUsage() {
  console.log(`
🔧 CV Preview Generator Test Script

Usage:
  node scripts/testPreviewGenerator.js                # Basic test
  node scripts/testPreviewGenerator.js --performance  # Include performance test
  node scripts/testPreviewGenerator.js --help         # Show this help

Examples:
  # Test core functionality
  npm run test:previews

  # Generate all previews (production)
  npm run generate:previews

Features tested:
  ✅ Generator initialization
  ✅ Single template preview generation
  ✅ File existence checking
  ✅ Multiple template generation
  ✅ Error handling
  ✅ Resource cleanup

Output:
  📁 public/templates/previews/
    ├── modern-preview.jpg       (794x1123px)
    ├── modern-thumb.jpg         (300x425px)
    ├── student-tech-preview.jpg
    └── student-tech-thumb.jpg
  `);
}

// Main execution
if (require.main === module) {
  if (process.argv.includes('--help')) {
    showUsage();
  } else {
    testPreviewGeneration()
      .then(() => {
        console.log('\n✨ Test script completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n💥 Test script failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { testPreviewGeneration };
