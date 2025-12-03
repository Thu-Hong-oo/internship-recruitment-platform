#!/usr/bin/env node

/**
 * Merge Synthetic + Kaggle CV datasets
 * Combines all data sources into single unified dataset
 */

const fs = require('fs').promises;
const path = require('path');

class DatasetMerger {
  constructor() {
    this.processedPath = path.join(__dirname, '../../../thesis/datasets/processed');
  }

  /**
   * Load all datasets
   */
  async loadDatasets() {
    console.log('📂 Loading datasets...');
    
    const datasets = {};
    
    // Load synthetic CVs
    const syntheticPath = path.join(this.processedPath, 'synthetic-cvs.json');
    datasets.synthetic = JSON.parse(await fs.readFile(syntheticPath, 'utf8'));
    console.log(`   ✅ Loaded ${datasets.synthetic.length} synthetic CVs`);
    
    // Load Kaggle resumes
    const kagglePath = path.join(this.processedPath, 'kaggle-resumes.json');
    datasets.kaggle = JSON.parse(await fs.readFile(kagglePath, 'utf8'));
    console.log(`   ✅ Loaded ${datasets.kaggle.length} Kaggle CVs`);
    
    // Load NER data (optional)
    try {
      const nerPath = path.join(this.processedPath, 'kaggle-ner.json');
      datasets.ner = JSON.parse(await fs.readFile(nerPath, 'utf8'));
      console.log(`   ✅ Loaded ${datasets.ner.length} NER annotations`);
    } catch (error) {
      datasets.ner = [];
      console.log('   ⚠️  NER data not found (optional)');
    }
    
    return datasets;
  }

  /**
   * Sample from large dataset to balance with synthetic
   */
  sampleDataset(data, size) {
    if (data.length <= size) return data;
    
    // Random sampling
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }

  /**
   * Merge all datasets
   */
  async mergeDatasets(datasets) {
    console.log('\n🔀 Merging datasets...');
    
    // Balance datasets: Use 500 synthetic + 2400 Kaggle (random sample)
    const synthetic = datasets.synthetic; // 500 CVs
    const kaggle = this.sampleDataset(datasets.kaggle, 2400); // Sample 2400 from 23K
    
    console.log(`   Selected ${synthetic.length} synthetic CVs`);
    console.log(`   Sampled ${kaggle.length} Kaggle CVs from ${datasets.kaggle.length} total`);
    
    // Merge and reindex
    const merged = [];
    let idCounter = 1;
    
    // Add synthetic data
    synthetic.forEach(item => {
      merged.push({
        ...item,
        id: idCounter++,
        dataSource: 'synthetic'
      });
    });
    
    // Add Kaggle data
    kaggle.forEach(item => {
      merged.push({
        ...item,
        id: idCounter++,
        dataSource: 'kaggle'
      });
    });
    
    // Shuffle to mix synthetic and real data
    const shuffled = merged.sort(() => 0.5 - Math.random());
    
    console.log(`   ✅ Merged total: ${shuffled.length} CVs`);
    
    return shuffled;
  }

  /**
   * Split into train/val/test
   */
  splitDataset(data, trainRatio = 0.7, valRatio = 0.15, testRatio = 0.15) {
    console.log('\n✂️  Splitting dataset (70/15/15)...');
    
    const total = data.length;
    const trainSize = Math.floor(total * trainRatio);
    const valSize = Math.floor(total * valRatio);
    
    const train = data.slice(0, trainSize);
    const val = data.slice(trainSize, trainSize + valSize);
    const test = data.slice(trainSize + valSize);
    
    console.log(`   Train: ${train.length} CVs (${(train.length/total*100).toFixed(1)}%)`);
    console.log(`   Val:   ${val.length} CVs (${(val.length/total*100).toFixed(1)}%)`);
    console.log(`   Test:  ${test.length} CVs (${(test.length/total*100).toFixed(1)}%)`);
    
    return { train, val, test };
  }

  /**
   * Save datasets
   */
  async save(splits) {
    console.log('\n💾 Saving split datasets...');
    
    const saves = [];
    
    for (const [split, data] of Object.entries(splits)) {
      // Save JSON
      const jsonPath = path.join(this.processedPath, `${split}.json`);
      saves.push(fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf8'));
      
      // Save JSONL
      const jsonlPath = path.join(this.processedPath, `${split}.jsonl`);
      const jsonl = data.map(item => JSON.stringify(item)).join('\n');
      saves.push(fs.writeFile(jsonlPath, jsonl, 'utf8'));
    }
    
    await Promise.all(saves);
    
    console.log(`   ✅ Saved train.json, train.jsonl`);
    console.log(`   ✅ Saved val.json, val.jsonl`);
    console.log(`   ✅ Saved test.json, test.jsonl`);
    
    return {
      train: path.join(this.processedPath, 'train.json'),
      val: path.join(this.processedPath, 'val.json'),
      test: path.join(this.processedPath, 'test.json')
    };
  }

  /**
   * Save full merged dataset
   */
  async saveFullDataset(data) {
    console.log('\n💾 Saving full merged dataset...');
    
    const jsonPath = path.join(this.processedPath, 'full-dataset.json');
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`   ✅ Saved full-dataset.json (${data.length} CVs)`);
    
    const jsonlPath = path.join(this.processedPath, 'full-dataset.jsonl');
    const jsonl = data.map(item => JSON.stringify(item)).join('\n');
    await fs.writeFile(jsonlPath, jsonl, 'utf8');
    console.log(`   ✅ Saved full-dataset.jsonl`);
  }

  /**
   * Generate statistics
   */
  getStatistics(data, splits) {
    const stats = {
      total: data.length,
      bySource: {},
      byIndustry: {},
      train: splits.train.length,
      val: splits.val.length,
      test: splits.test.length
    };

    data.forEach(item => {
      // Count by source
      const source = item.dataSource || 'unknown';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
      
      // Count by industry
      const industry = item.cv?.metadata?.industry || item.cv?.category || 'unknown';
      stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;
    });

    return stats;
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════╗
║   Dataset Merger & Splitter v1.0         ║
║   Synthetic + Kaggle → Train/Val/Test    ║
╚═══════════════════════════════════════════╝
  `);

  const merger = new DatasetMerger();

  try {
    // 1. Load all datasets
    const datasets = await merger.loadDatasets();
    
    // 2. Merge
    const merged = await merger.mergeDatasets(datasets);
    
    // 3. Split
    const splits = merger.splitDataset(merged);
    
    // 4. Save
    await merger.saveFullDataset(merged);
    const paths = await merger.save(splits);
    
    // 5. Statistics
    const stats = merger.getStatistics(merged, splits);
    
    console.log(`
╔═══════════════════════════════════════════╗
║         MERGE & SPLIT COMPLETE           ║
╚═══════════════════════════════════════════╝

📊 Dataset Statistics:
   Total CVs: ${stats.total}
   
   By Source:
   ${Object.entries(stats.bySource).map(([source, count]) => 
     `   - ${source}: ${count} (${((count/stats.total)*100).toFixed(1)}%)`
   ).join('\n   ')}
   
   By Industry (Top 10):
   ${Object.entries(stats.byIndustry)
     .sort((a, b) => b[1] - a[1])
     .slice(0, 10)
     .map(([industry, count]) => 
       `   - ${industry}: ${count} (${((count/stats.total)*100).toFixed(1)}%)`
     ).join('\n   ')}

📂 Split Distribution:
   Train: ${stats.train} CVs (70%)
   Val:   ${stats.val} CVs (15%)
   Test:  ${stats.test} CVs (15%)

💾 Output Files:
   ${paths.train}
   ${paths.val}
   ${paths.test}

✅ Dataset ready for PhoBERT training!

📝 Next Steps:
   1. Create PhoBERT fine-tuning script
   2. Upload to Google Colab
   3. Train model
   4. Evaluate results
    `);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
