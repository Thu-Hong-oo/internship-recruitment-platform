#!/usr/bin/env node

/**
 * Kaggle Dataset Downloader
 * Downloads Resume Dataset and NER Dataset from Kaggle
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

class KaggleDownloader {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseUrl = 'www.kaggle.com';
    this.datasets = {
      resume: {
        owner: 'snehaanbhawal',
        name: 'resume-dataset',
        files: ['UpdatedResumeDataSet.csv']
      },
      ner: {
        owner: 'dataturks',
        name: 'resume-entities-for-ner',
        files: ['Entity Recognition in Resumes.json']
      }
    };
  }

  /**
   * Setup Kaggle API credentials
   */
  async setupCredentials() {
    const kaggleDir = path.join(process.env.USERPROFILE || process.env.HOME, '.kaggle');
    const credPath = path.join(kaggleDir, 'kaggle.json');

    try {
      await fs.mkdir(kaggleDir, { recursive: true });
      await fs.writeFile(
        credPath,
        JSON.stringify({ username: 'kaggle', key: this.apiToken }, null, 2),
        'utf8'
      );
      
      console.log(`✅ Kaggle credentials saved to: ${credPath}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to setup credentials:', error.message);
      return false;
    }
  }

  /**
   * Download dataset using Kaggle CLI
   */
  async downloadWithCLI(datasetName) {
    const dataset = this.datasets[datasetName];
    if (!dataset) {
      throw new Error(`Unknown dataset: ${datasetName}`);
    }

    const outputPath = path.join(__dirname, '../../../thesis/datasets/raw', datasetName);
    await fs.mkdir(outputPath, { recursive: true });

    const fullDatasetName = `${dataset.owner}/${dataset.name}`;
    
    console.log(`📥 Downloading ${fullDatasetName}...`);
    console.log(`   Output: ${outputPath}`);

    // Use kaggle CLI command
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const kaggle = spawn('kaggle', [
        'datasets',
        'download',
        '-d',
        fullDatasetName,
        '-p',
        outputPath,
        '--unzip'
      ], {
        stdio: 'inherit',
        shell: true
      });

      kaggle.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Downloaded ${datasetName} successfully`);
          resolve(outputPath);
        } else {
          reject(new Error(`Download failed with code ${code}`));
        }
      });

      kaggle.on('error', (err) => {
        reject(new Error(`Failed to start kaggle CLI: ${err.message}`));
      });
    });
  }

  /**
   * Check if Kaggle CLI is installed
   */
  async checkKaggleCLI() {
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const kaggle = spawn('kaggle', ['--version'], { shell: true });
      
      kaggle.on('close', (code) => {
        resolve(code === 0);
      });

      kaggle.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Install Kaggle CLI
   */
  async installKaggleCLI() {
    console.log('📦 Installing Kaggle CLI...');
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const pip = spawn('pip', ['install', 'kaggle'], {
        stdio: 'inherit',
        shell: true
      });

      pip.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Kaggle CLI installed successfully');
          resolve(true);
        } else {
          reject(new Error('Failed to install Kaggle CLI'));
        }
      });

      pip.on('error', (err) => {
        reject(new Error(`Failed to run pip: ${err.message}`));
      });
    });
  }

  /**
   * Get dataset statistics
   */
  async getStats(datasetPath, datasetName) {
    const stats = {
      name: datasetName,
      path: datasetPath,
      files: []
    };

    try {
      const files = await fs.readdir(datasetPath);
      
      for (const file of files) {
        const filePath = path.join(datasetPath, file);
        const stat = await fs.stat(filePath);
        
        stats.files.push({
          name: file,
          size: `${(stat.size / 1024 / 1024).toFixed(2)} MB`,
          path: filePath
        });
      }
    } catch (error) {
      console.error(`Failed to get stats: ${error.message}`);
    }

    return stats;
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════╗
║   Kaggle Dataset Downloader v1.0         ║
║   For Thesis Research - Real CV Data     ║
╚═══════════════════════════════════════════╝
  `);

  const apiToken = process.env.KAGGLE_API_TOKEN || 'KGAT_57a1fa2920da1596a149fa5e299012ef';
  
  if (!apiToken) {
    console.error(`
❌ ERROR: Kaggle API token not found!

Please provide token via:
1. Environment variable: KAGGLE_API_TOKEN=your_token node downloadKaggle.js
2. Or edit this script and set the token directly
    `);
    process.exit(1);
  }

  const downloader = new KaggleDownloader(apiToken);

  try {
    // 1. Setup credentials
    console.log('\n📋 Step 1: Setup Kaggle credentials');
    await downloader.setupCredentials();

    // 2. Check Kaggle CLI
    console.log('\n📋 Step 2: Check Kaggle CLI');
    const hasKaggle = await downloader.checkKaggleCLI();
    
    if (!hasKaggle) {
      console.log('⚠️  Kaggle CLI not found. Installing...');
      await downloader.installKaggleCLI();
    } else {
      console.log('✅ Kaggle CLI is installed');
    }

    // 3. Download Resume Dataset
    console.log('\n📋 Step 3: Download Resume Dataset (2400 CVs)');
    const resumePath = await downloader.downloadWithCLI('resume');
    const resumeStats = await downloader.getStats(resumePath, 'resume');

    // 4. Download NER Dataset
    console.log('\n📋 Step 4: Download NER Dataset (220 annotated CVs)');
    const nerPath = await downloader.downloadWithCLI('ner');
    const nerStats = await downloader.getStats(nerPath, 'ner');

    // 5. Summary
    console.log(`
╔═══════════════════════════════════════════╗
║         DOWNLOAD COMPLETE                ║
╚═══════════════════════════════════════════╝

📊 Downloaded Datasets:

1. Resume Dataset:
   Path: ${resumeStats.path}
   Files: ${resumeStats.files.map(f => `\n   - ${f.name} (${f.size})`).join('')}

2. NER Dataset:
   Path: ${nerStats.path}
   Files: ${nerStats.files.map(f => `\n   - ${f.name} (${f.size})`).join('')}

✅ Total: ~2620 real CVs ready for processing!

📝 Next Steps:
   1. Parse CSV to JSON: node parseKaggleData.js
   2. Merge with synthetic CVs (500 + 2400 = 2900 total)
   3. Split train/val/test (70/15/15)
    `);

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if Python is installed: python --version');
    console.error('   2. Install Kaggle manually: pip install kaggle');
    console.error('   3. Check token is valid on kaggle.com/settings');
    process.exit(1);
  }
}

main();
