#!/usr/bin/env node

/**
 * Main script to generate synthetic CV dataset
 * Usage: node generateDataset.js [count]
 */

const SyntheticCVGenerator = require('./syntheticCVGenerator');

async function main() {
  const count = parseInt(process.argv[2]) || 500;
  
  console.log(`
╔═══════════════════════════════════════════╗
║   Synthetic CV Dataset Generator v1.0    ║
║   For Thesis Research - Option 3         ║
╚═══════════════════════════════════════════╝
  `);

  const generator = new SyntheticCVGenerator();
  
  try {
    // Generate dataset
    const startTime = Date.now();
    const dataset = await generator.generateDataset(count);
    const endTime = Date.now();
    
    // Save to files
    const files = await generator.save(dataset, 'synthetic-cvs.json');
    
    // Statistics
    const stats = generator.getStatistics(dataset);
    
    console.log(`
╔═══════════════════════════════════════════╗
║           GENERATION COMPLETE            ║
╚═══════════════════════════════════════════╝

📊 Statistics:
   Total CVs: ${stats.total}
   Time: ${((endTime - startTime) / 1000).toFixed(2)}s
   
   By Industry:
   ${Object.entries(stats.byIndustry).map(([industry, count]) => 
     `   - ${industry}: ${count} (${((count/stats.total)*100).toFixed(1)}%)`
   ).join('\n   ')}
   
   By Level:
   ${Object.entries(stats.byLevel).map(([level, count]) => 
     `   - ${level}: ${count} (${((count/stats.total)*100).toFixed(1)}%)`
   ).join('\n   ')}
   
   Average Skills per CV: ${stats.avgSkills}
   Average Projects per CV: ${stats.avgProjects}
   CVs with Experience: ${stats.withExperience} (${((stats.withExperience/stats.total)*100).toFixed(1)}%)

💾 Output Files:
   - ${files.json}
   - ${files.jsonl}

✅ Ready for training! Next steps:
   1. Download Kaggle datasets (see KAGGLE_DATASET_GUIDE.md)
   2. Merge with real CV data
   3. Split into train/val/test
   4. Fine-tune PhoBERT
    `);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating dataset:', error);
    process.exit(1);
  }
}

main();
