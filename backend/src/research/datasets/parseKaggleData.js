#!/usr/bin/env node

/**
 * Parse Kaggle CSV data to JSON format
 * Converts UpdatedResumeDataSet.csv to structured JSON
 */

const fs = require('fs').promises;
const path = require('path');
const { createReadStream } = require('fs');
const readline = require('readline');

class KaggleDataParser {
  constructor() {
    this.resumeDataPath = path.join(__dirname, '../../../thesis/datasets/raw/resume');
    this.outputPath = path.join(__dirname, '../../../thesis/datasets/processed');
  }

  /**
   * Parse CSV file
   */
  async parseResumeCSV() {
    console.log('📄 Parsing Resume.csv...');
    
    const csvPath = path.join(this.resumeDataPath, 'Resume', 'Resume.csv');
    const dataset = [];
    
    const fileStream = createReadStream(csvPath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let isHeader = true;
    let lineNumber = 0;

    for await (const line of rl) {
      lineNumber++;
      
      if (isHeader) {
        isHeader = false;
        continue;
      }

      try {
        const parsed = this.parseCSVLine(line);
        if (parsed) {
          dataset.push({
            id: lineNumber,
            cv: this.structureCV(parsed),
            rawText: parsed.Resume,
            source: 'kaggle-resume-dataset'
          });
        }

        if (lineNumber % 500 === 0) {
          console.log(`   Parsed ${lineNumber} resumes...`);
        }
      } catch (error) {
        console.warn(`   Warning: Failed to parse line ${lineNumber}: ${error.message}`);
      }
    }

    console.log(`✅ Parsed ${dataset.length} resumes from CSV`);
    return dataset;
  }

  /**
   * Parse CSV line (handling quoted fields with commas)
   */
  parseCSVLine(line) {
    const regex = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;
    const parts = line.split(regex).map(part => 
      part.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    );

    if (parts.length < 2) return null;

    return {
      Category: parts[0],
      Resume: parts[1]
    };
  }

  /**
   * Structure CV from raw text
   */
  structureCV(data) {
    const resume = data.Resume;
    
    return {
      category: this.mapCategory(data.Category),
      
      // Extract sections
      skills: this.extractSkills(resume),
      education: this.extractEducation(resume),
      experience: this.extractExperience(resume),
      
      // Metadata
      metadata: {
        source: 'kaggle',
        category: data.Category,
        language: 'en',
        processedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Map Kaggle categories to our industries
   */
  mapCategory(category) {
    const mapping = {
      'Data Science': 'technology',
      'HR': 'hr',
      'Advocate': 'law',
      'Arts': 'design',
      'Web Designing': 'design',
      'Mechanical Engineer': 'engineering',
      'Sales': 'business',
      'Health and fitness': 'healthcare',
      'Civil Engineer': 'engineering',
      'Java Developer': 'technology',
      'Business Analyst': 'business',
      'SAP Developer': 'technology',
      'Automation Testing': 'technology',
      'Electrical Engineering': 'engineering',
      'Operations Manager': 'business',
      'Python Developer': 'technology',
      'DevOps Engineer': 'technology',
      'Network Security Engineer': 'technology',
      'PMO': 'business',
      'Database': 'technology',
      'Hadoop': 'technology',
      'ETL Developer': 'technology',
      'DotNet Developer': 'technology',
      'Blockchain': 'technology',
      'Testing': 'technology'
    };

    return mapping[category] || 'business';
  }

  /**
   * Extract skills from resume text
   */
  extractSkills(text) {
    const skills = new Set();
    
    // Common tech skills patterns
    const techSkills = [
      'Python', 'Java', 'JavaScript', 'C\\+\\+', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue', 'Node\\.js', 'Django', 'Flask', 'Spring',
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
      'Git', 'Linux', 'Agile', 'Scrum', 'REST API', 'GraphQL',
      'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
      'HTML', 'CSS', 'TypeScript', 'Bootstrap', 'Tailwind'
    ];

    techSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi');
      if (regex.test(text)) {
        skills.add(skill.replace(/\\/g, ''));
      }
    });

    return Array.from(skills).slice(0, 10); // Limit to 10 skills
  }

  /**
   * Extract education
   */
  extractEducation(text) {
    const education = [];
    
    // Look for degree patterns
    const degreePatterns = [
      /Bachelor[\'s]*\s+(?:of\s+)?(?:Science|Arts|Engineering|Technology|Business)/gi,
      /Master[\'s]*\s+(?:of\s+)?(?:Science|Arts|Engineering|Technology|Business)/gi,
      /B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc|MBA|PhD/gi
    ];

    degreePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        education.push({
          degree: matches[0],
          school: 'University',
          major: 'Not specified'
        });
      }
    });

    return education.slice(0, 2); // Max 2 degrees
  }

  /**
   * Extract experience
   */
  extractExperience(text) {
    const experience = [];
    
    // Look for year patterns (e.g., "2019-2021", "2020 to 2022")
    const yearPattern = /(\d{4})\s*[-to]+\s*(\d{4}|present|current)/gi;
    const matches = text.match(yearPattern);
    
    if (matches && matches.length > 0) {
      matches.slice(0, 3).forEach(match => {
        experience.push({
          period: match,
          company: 'Company',
          position: 'Position'
        });
      });
    }

    return experience;
  }

  /**
   * Parse NER JSON data
   */
  async parseNERData() {
    console.log('\n📄 Parsing NER dataset (Entity Recognition in Resumes.json)...');
    
    const jsonPath = path.join(this.resumeDataPath.replace('resume', 'ner'), 'Entity Recognition in Resumes.json');
    
    try {
      const content = await fs.readFile(jsonPath, 'utf8');
      const lines = content.trim().split('\n');
      const dataset = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const item = JSON.parse(lines[i]);
          
          dataset.push({
            id: i + 1,
            content: item.content,
            annotations: item.annotation,
            source: 'kaggle-ner-dataset'
          });

          if ((i + 1) % 50 === 0) {
            console.log(`   Parsed ${i + 1} NER annotations...`);
          }
        } catch (error) {
          console.warn(`   Warning: Failed to parse line ${i + 1}`);
        }
      }

      console.log(`✅ Parsed ${dataset.length} NER annotated resumes`);
      return dataset;
    } catch (error) {
      console.error(`❌ Failed to parse NER data: ${error.message}`);
      return [];
    }
  }

  /**
   * Save parsed data
   */
  async save(data, filename) {
    await fs.mkdir(this.outputPath, { recursive: true });
    
    const filepath = path.join(this.outputPath, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`💾 Saved to ${filepath}`);
    
    // Also save as JSONL
    const jsonlPath = filepath.replace('.json', '.jsonl');
    const jsonl = data.map(item => JSON.stringify(item)).join('\n');
    await fs.writeFile(jsonlPath, jsonl, 'utf8');
    
    console.log(`💾 Saved JSONL to ${jsonlPath}`);
    
    return { json: filepath, jsonl: jsonlPath };
  }

  /**
   * Get statistics
   */
  getStatistics(dataset) {
    const stats = {
      total: dataset.length,
      byCategory: {},
      avgSkills: 0,
      withEducation: 0,
      withExperience: 0
    };

    dataset.forEach(item => {
      const category = item.cv?.category || item.cv?.metadata?.category || 'unknown';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      if (item.cv?.skills) {
        stats.avgSkills += item.cv.skills.length;
      }
      
      if (item.cv?.education?.length > 0) {
        stats.withEducation++;
      }
      
      if (item.cv?.experience?.length > 0) {
        stats.withExperience++;
      }
    });

    stats.avgSkills = (stats.avgSkills / dataset.length).toFixed(1);

    return stats;
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════╗
║   Kaggle Data Parser v1.0                ║
║   Convert CSV/JSON to Structured Format  ║
╚═══════════════════════════════════════════╝
  `);

  const parser = new KaggleDataParser();

  try {
    // Parse Resume CSV
    const resumeData = await parser.parseResumeCSV();
    const resumeFiles = await parser.save(resumeData, 'kaggle-resumes.json');
    const resumeStats = parser.getStatistics(resumeData);

    // Parse NER JSON
    const nerData = await parser.parseNERData();
    if (nerData.length > 0) {
      await parser.save(nerData, 'kaggle-ner.json');
    }

    console.log(`
╔═══════════════════════════════════════════╗
║           PARSING COMPLETE               ║
╚═══════════════════════════════════════════╝

📊 Resume Dataset Statistics:
   Total CVs: ${resumeStats.total}
   
   By Category:
   ${Object.entries(resumeStats.byCategory).map(([cat, count]) => 
     `   - ${cat}: ${count} (${((count/resumeStats.total)*100).toFixed(1)}%)`
   ).join('\n   ')}
   
   Average Skills per CV: ${resumeStats.avgSkills}
   CVs with Education: ${resumeStats.withEducation} (${((resumeStats.withEducation/resumeStats.total)*100).toFixed(1)}%)
   CVs with Experience: ${resumeStats.withExperience} (${((resumeStats.withExperience/resumeStats.total)*100).toFixed(1)}%)

📊 NER Dataset:
   Total Annotations: ${nerData.length}

💾 Output Files:
   - ${resumeFiles.json}
   - ${resumeFiles.jsonl}

✅ Ready to merge with synthetic data!

📝 Next Step:
   node mergeDatasets.js
    `);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
