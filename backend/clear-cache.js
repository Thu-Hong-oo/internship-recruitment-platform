/**
 * Clear Redis Cache for Design Systems Resources
 * 
 * Purpose: Remove old cached resources that contain search URLs
 * These were cached before the fix that eliminates search URL fallbacks
 */

const Redis = require('ioredis');
require('dotenv').config();

// Parse Redis URL to get connection details
const redisUrl = process.env.REDIS_URL;
console.log(`\n🔄 Connecting to Redis...`);

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

async function clearCache() {
  try {
    await redis.ping();
    console.log(`✅ Redis connected\n`);

    // Pattern to match: intelligent_resources:design*
    console.log(`🔍 Scanning for keys matching: intelligent_resources:design*`);
    
    let cursor = '0';
    let totalDeleted = 0;
    const keysToDelete = [];

    // Scan for all matching keys
    do {
      const result = await redis.scan(cursor, 'MATCH', 'intelligent_resources:design*', 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      
      if (keys.length > 0) {
        keysToDelete.push(...keys);
        console.log(`   Found ${keys.length} keys in this batch`);
      }
    } while (cursor !== '0');

    console.log(`\n📋 Total keys found: ${keysToDelete.length}`);

    if (keysToDelete.length === 0) {
      console.log(`✅ No cache keys to delete - cache is already clean!`);
      await redis.quit();
      process.exit(0);
    }

    // Display keys that will be deleted
    console.log(`\n🗑️  Keys to delete:`);
    keysToDelete.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });

    // Delete all keys
    console.log(`\n🗑️  Deleting keys...`);
    for (const key of keysToDelete) {
      await redis.del(key);
      totalDeleted++;
      console.log(`   ✓ Deleted: ${key}`);
    }

    console.log(`\n✅ Successfully deleted ${totalDeleted} cache keys`);
    console.log(`\n💡 Next step: Generate a new roadmap to verify no search URLs remain`);
    
    await redis.quit();
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    await redis.quit();
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log(`\n\n⚠️  Interrupted - closing Redis connection...`);
  await redis.quit();
  process.exit(0);
});

clearCache();
