/**
 * Script to index sample learning resources into ChromaDB
 * 
 * Usage:
 *   node scripts/index-sample-resources.js
 * 
 * This script:
 * 1. Initializes ChromaDB connection
 * 2. Indexes sample resources
 * 3. Shows statistics
 */

require('dotenv').config({ path: '../.env' });
const resourceIndexingService = require('../src/services/resourceIndexingService');
const { logger } = require('../src/utils/logger');

async function main() {
  try {
    console.log('🚀 Starting resource indexing...\n');

    // Index sample resources
    console.log('📚 Indexing sample resources...');
    const result = await resourceIndexingService.indexSampleResources();

    if (result.success) {
      console.log('✅ Indexing completed successfully!');
      console.log(`   - Indexed: ${result.indexed} resources`);
      console.log(`   - Failed: ${result.failed} resources\n`);
    } else {
      console.log('❌ Indexing failed:', result.message);
      console.log(`   - Failed: ${result.failed} resources\n`);
    }

    // Get statistics
    console.log('📊 Collection Statistics:');
    const stats = await resourceIndexingService.getStatistics();
    console.log(`   - Collection: ${stats.collectionName}`);
    console.log(`   - Total Resources: ${stats.resourceCount}`);
    console.log(`   - Status: ${stats.status}\n`);

    console.log('✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('Indexing script error:', error);
    process.exit(1);
  }
}

main();

