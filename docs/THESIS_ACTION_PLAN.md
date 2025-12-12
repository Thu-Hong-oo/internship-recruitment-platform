# 🎯 HÀNH ĐỘNG CỤ THỂ - ĐỒ ÁN TỐT NGHIỆP

## 📋 CHECKLIST TỔNG QUAN

### ✅ Đã hoàn thành
- [x] Hệ thống backend hoàn chỉnh
- [x] 5 tính năng AI/NLP hoạt động
- [x] Multi-industry RAG (14 ngành nghề)
- [x] API documentation
- [x] Architecture documentation

### 🔄 Đang làm (Bắt đầu ngay)
- [ ] **Week 1-2: Dataset Collection** ← BẮT ĐẦU TỪ ĐÂY
- [ ] Week 3: Model Fine-tuning
- [ ] Week 4: Evaluation
- [ ] Week 5: User Study
- [ ] Week 6-8: Thesis Writing

---

## 🚀 HÀNH ĐỘNG TUẦN 1-2: DATASET COLLECTION

### Mục tiêu
Thu thập **500 CV samples** + **200 Job descriptions** với ground truth annotations

### Bước 1: Setup môi trường (30 phút)

```bash
# 1. Tạo thư mục cho research components
cd D:\KhoaLuan_Internship\internship-recruitment-platform\backend

# 2. Tạo folder structure
mkdir src\research
mkdir src\research\datasets
mkdir src\research\training
mkdir src\research\evaluation
mkdir src\research\benchmark
mkdir src\research\userStudy

mkdir python
mkdir notebooks
mkdir thesis
mkdir thesis\figures
mkdir thesis\tables
mkdir thesis\datasets
mkdir thesis\results

# 3. Install Python dependencies (cho fine-tuning sau này)
pip install transformers datasets torch pandas scikit-learn matplotlib seaborn jupyter

# 4. Install Node.js packages
npm install --save csv-writer json2csv papaparse
```

### Bước 2: Thu thập CV samples (2-3 ngày)

#### Option A: Kaggle Datasets (Khuyến nghị - nhanh nhất)

**Datasets tốt cho CV parsing:**

1. **Resume Dataset** (Kaggle)
   - Link: https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset
   - Size: 2400 CVs
   - Format: CSV with text
   - Industries: Multiple

2. **Resume/CV NLP Dataset** (Kaggle)
   - Link: https://www.kaggle.com/datasets/dataturks/resume-entities-for-ner
   - Size: 220 CVs with NER annotations
   - Perfect for: Skill extraction

3. **Vietnamese CV Dataset** (GitHub)
   - Search: "vietnamese cv dataset github"
   - Có thể cần tự build

**Script để download:**

```javascript
// File: scripts/downloadDatasets.js

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

async function downloadKaggleDataset() {
  // Cần Kaggle API token (kaggle.json)
  // Download instructions: https://github.com/Kaggle/kaggle-api
  
  console.log('Downloading Resume Dataset from Kaggle...');
  
  // Command: kaggle datasets download -d snehaanbhawal/resume-dataset
  // Unzip to: thesis/datasets/raw/
  
  console.log('Dataset saved to thesis/datasets/raw/resume-dataset/');
}

async function downloadVietnameseCVs() {
  // Tìm Vietnamese CV samples từ:
  // 1. GitHub repos
  // 2. Vietnamese job boards (scraping - cẩn thận legal)
  // 3. Generate synthetic (template-based)
  
  console.log('Collecting Vietnamese CV samples...');
}

downloadKaggleDataset();
```

#### Option B: Synthetic Data Generation (Tạo CV giả)

```javascript
// File: src/research/datasets/syntheticCVGenerator.js

const { faker } = require('@faker-js/faker');

class SyntheticCVGenerator {
  /**
   * Generate realistic Vietnamese CVs for training
   */
  
  generateCV(industry = 'technology', level = 'intern') {
    const skills = this.getSkillsForIndustry(industry);
    
    return {
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number('09########'),
      
      objective: this.generateObjective(industry, level),
      
      education: [
        {
          school: this.getVietnameseUniversity(),
          degree: 'Cử nhân',
          major: this.getMajorForIndustry(industry),
          gpa: faker.number.float({ min: 2.5, max: 4.0, precision: 0.01 }),
          startDate: '09/2020',
          endDate: '06/2024'
        }
      ],
      
      skills: faker.helpers.arrayElements(skills, { min: 3, max: 8 }),
      
      experience: level === 'intern' ? [] : this.generateExperience(industry),
      
      projects: this.generateProjects(industry),
      
      certifications: this.generateCertifications(industry),
      
      languages: [
        { name: 'Tiếng Việt', level: 'Native' },
        { name: 'English', level: faker.helpers.arrayElement(['Basic', 'Intermediate', 'Fluent']) }
      ]
    };
  }
  
  getVietnameseUniversity() {
    const universities = [
      'Đại học Bách Khoa Hà Nội',
      'Đại học Quốc Gia TP.HCM',
      'Đại học Công Nghệ - ĐHQG Hà Nội',
      'Đại học FPT',
      'Đại học RMIT Việt Nam',
      'Đại học Kinh tế Quốc Dân',
      'Đại học Ngoại Thương',
      'Đại học Tôn Đức Thắng'
    ];
    return faker.helpers.arrayElement(universities);
  }
  
  getSkillsForIndustry(industry) {
    const skillMap = {
      technology: [
        'JavaScript', 'Python', 'Java', 'React', 'Node.js',
        'MongoDB', 'SQL', 'Git', 'Docker', 'AWS',
        'HTML/CSS', 'TypeScript', 'Vue.js', 'Angular'
      ],
      marketing: [
        'Google Analytics', 'SEO', 'SEM', 'Facebook Ads',
        'Content Marketing', 'Email Marketing', 'Social Media',
        'Copywriting', 'Market Research', 'Adobe Photoshop'
      ],
      business: [
        'Excel', 'PowerPoint', 'Business Analysis',
        'Project Management', 'Financial Modeling',
        'Data Analysis', 'Strategic Planning', 'CRM'
      ],
      design: [
        'Figma', 'Adobe Illustrator', 'Adobe Photoshop',
        'Sketch', 'UI/UX Design', 'Prototyping',
        'Adobe XD', 'InVision', 'Web Design'
      ]
    };
    return skillMap[industry] || skillMap.technology;
  }
  
  generateProjects(industry) {
    const projectTemplates = {
      technology: [
        'E-commerce website using MERN stack',
        'Mobile app for task management',
        'Real-time chat application',
        'AI-powered recommendation system'
      ],
      marketing: [
        'Social media campaign for brand awareness',
        'SEO optimization project increasing traffic 200%',
        'Email marketing campaign with 25% conversion rate'
      ],
      business: [
        'Market research for new product launch',
        'Business plan for startup',
        'Financial analysis of competitors'
      ],
      design: [
        'UI/UX redesign for mobile app',
        'Brand identity design for startup',
        'Website redesign increasing user engagement'
      ]
    };
    
    const templates = projectTemplates[industry] || projectTemplates.technology;
    return faker.helpers.arrayElements(templates, { min: 1, max: 3 }).map(title => ({
      title,
      description: faker.lorem.paragraph(),
      technologies: faker.helpers.arrayElements(this.getSkillsForIndustry(industry), { min: 2, max: 5 }),
      url: faker.internet.url()
    }));
  }
  
  async generateDataset(count = 500) {
    const dataset = [];
    const industries = ['technology', 'marketing', 'business', 'design'];
    const levels = ['intern', 'junior'];
    
    for (let i = 0; i < count; i++) {
      const industry = faker.helpers.arrayElement(industries);
      const level = faker.helpers.arrayElement(levels);
      
      const cv = this.generateCV(industry, level);
      
      dataset.push({
        id: i + 1,
        cv,
        metadata: {
          industry,
          level,
          language: 'vi',
          format: 'json',
          generatedAt: new Date().toISOString()
        }
      });
      
      if ((i + 1) % 100 === 0) {
        console.log(`Generated ${i + 1}/${count} CVs...`);
      }
    }
    
    return dataset;
  }
  
  async saveToFile(dataset, filepath) {
    const fs = require('fs').promises;
    await fs.writeFile(filepath, JSON.stringify(dataset, null, 2));
    console.log(`Saved ${dataset.length} CVs to ${filepath}`);
  }
}

module.exports = SyntheticCVGenerator;
```

**Chạy generator:**

```javascript
// File: scripts/generateSyntheticCVs.js

const SyntheticCVGenerator = require('../src/research/datasets/syntheticCVGenerator');
const path = require('path');

async function main() {
  const generator = new SyntheticCVGenerator();
  
  console.log('Generating 500 synthetic CVs...');
  const dataset = await generator.generateDataset(500);
  
  const outputPath = path.join(__dirname, '../thesis/datasets/synthetic_cvs.json');
  await generator.saveToFile(dataset, outputPath);
  
  console.log('✅ Done! Dataset saved.');
}

main().catch(console.error);
```

### Bước 3: Annotate Ground Truth (3-4 ngày)

**Manual Annotation Tool:**

```javascript
// File: src/research/datasets/annotationTool.js

const express = require('express');
const fs = require('fs').promises;

class AnnotationTool {
  /**
   * Web-based tool để annotate CV manually
   * UI: Show CV text → User highlights skills, experience, education
   */
  
  createServer() {
    const app = express();
    app.use(express.json());
    app.use(express.static('public'));
    
    // Load next CV to annotate
    app.get('/api/next-cv', async (req, res) => {
      const cvs = await this.loadUnannotatedCVs();
      res.json(cvs[0] || null);
    });
    
    // Save annotations
    app.post('/api/save-annotation', async (req, res) => {
      const { cvId, annotations } = req.body;
      await this.saveAnnotation(cvId, annotations);
      res.json({ success: true });
    });
    
    app.listen(3001, () => {
      console.log('Annotation tool running at http://localhost:3001');
    });
  }
  
  async loadUnannotatedCVs() {
    // Load CVs chưa annotate
    const data = await fs.readFile('thesis/datasets/synthetic_cvs.json', 'utf8');
    const cvs = JSON.parse(data);
    
    // Filter chưa có ground truth
    return cvs.filter(cv => !cv.groundTruth);
  }
  
  async saveAnnotation(cvId, annotations) {
    // Save ground truth annotations
    const data = await fs.readFile('thesis/datasets/synthetic_cvs.json', 'utf8');
    const cvs = JSON.parse(data);
    
    const cv = cvs.find(c => c.id === cvId);
    if (cv) {
      cv.groundTruth = {
        fullName: annotations.fullName,
        email: annotations.email,
        phone: annotations.phone,
        skills: annotations.skills,
        experience: annotations.experience,
        education: annotations.education,
        annotatedBy: 'manual',
        annotatedAt: new Date().toISOString()
      };
    }
    
    await fs.writeFile(
      'thesis/datasets/annotated_cvs.json',
      JSON.stringify(cvs, null, 2)
    );
  }
}

// Run
new AnnotationTool().createServer();
```

### Bước 4: Collect Job Descriptions (1 ngày)

```javascript
// File: src/research/datasets/jobDescriptionCollector.js

const axios = require('axios');

class JobDescriptionCollector {
  /**
   * Scrape job descriptions từ job boards
   * Hoặc generate synthetic job postings
   */
  
  async collectFromJobBoards() {
    // Option 1: Manual copy từ:
    // - VietnamWorks
    // - ITviec
    // - TopCV
    // - CareerBuilder
    
    // Option 2: API (nếu có)
    
    // Option 3: Generate synthetic
    return this.generateSyntheticJobs(200);
  }
  
  generateSyntheticJobs(count = 200) {
    const { faker } = require('@faker-js/faker');
    const jobs = [];
    
    const industries = ['technology', 'marketing', 'business', 'design'];
    const titles = {
      technology: ['Frontend Developer Intern', 'Backend Developer Intern', 'Full-stack Developer Intern', 'Mobile Developer Intern'],
      marketing: ['Digital Marketing Intern', 'Content Marketing Intern', 'SEO Specialist Intern', 'Social Media Intern'],
      business: ['Business Analyst Intern', 'Project Management Intern', 'Operations Intern'],
      design: ['UI/UX Designer Intern', 'Graphic Designer Intern', 'Product Designer Intern']
    };
    
    for (let i = 0; i < count; i++) {
      const industry = faker.helpers.arrayElement(industries);
      const title = faker.helpers.arrayElement(titles[industry]);
      
      jobs.push({
        id: i + 1,
        title,
        company: faker.company.name(),
        location: faker.helpers.arrayElement(['Hà Nội', 'TP.HCM', 'Đà Nẵng']),
        industry,
        
        description: this.generateJobDescription(industry, title),
        
        requirements: {
          skills: this.getRequiredSkills(industry),
          education: 'Đang theo học hoặc mới tốt nghiệp Đại học',
          experience: 'Không yêu cầu kinh nghiệm',
          languages: ['Vietnamese', 'English']
        },
        
        benefits: [
          'Lương thực tập cạnh tranh',
          'Môi trường làm việc năng động',
          'Cơ hội trở thành nhân viên chính thức',
          'Đào tạo và phát triển kỹ năng'
        ],
        
        salary: faker.helpers.arrayElement(['3-5 triệu', '5-7 triệu', '7-10 triệu', 'Thỏa thuận']),
        
        postedDate: faker.date.recent({ days: 30 }).toISOString()
      });
    }
    
    return jobs;
  }
  
  getRequiredSkills(industry) {
    // Reuse from SyntheticCVGenerator
    const generator = new (require('./syntheticCVGenerator'))();
    return generator.getSkillsForIndustry(industry).slice(0, 5);
  }
  
  async save(jobs) {
    const fs = require('fs').promises;
    await fs.writeFile(
      'thesis/datasets/job_descriptions.json',
      JSON.stringify(jobs, null, 2)
    );
    console.log(`Saved ${jobs.length} job descriptions`);
  }
}

module.exports = JobDescriptionCollector;
```

### Bước 5: Build CV-Job Matching Pairs (1 ngày)

```javascript
// File: src/research/datasets/matchingPairBuilder.js

class MatchingPairBuilder {
  /**
   * Tạo CV-Job pairs với expert scores
   */
  
  async buildPairs() {
    const cvs = await this.loadCVs();
    const jobs = await this.loadJobs();
    
    const pairs = [];
    
    // Strategy: Mỗi CV match với 5-10 jobs
    for (const cv of cvs) {
      const matchedJobs = this.findRelevantJobs(cv, jobs, 5);
      
      for (const job of matchedJobs) {
        pairs.push({
          cvId: cv.id,
          jobId: job.id,
          cv: {
            skills: cv.cv.skills,
            education: cv.cv.education,
            experience: cv.cv.experience,
            projects: cv.cv.projects
          },
          job: {
            title: job.title,
            requirements: job.requirements,
            industry: job.industry
          },
          
          // Ground truth - cần annotate manually hoặc tự động
          groundTruth: {
            expertScore: this.calculateAutoScore(cv, job), // Placeholder
            tier: this.calculateTier(this.calculateAutoScore(cv, job)),
            matchedSkills: this.getMatchedSkills(cv.cv.skills, job.requirements.skills),
            missingSkills: this.getMissingSkills(cv.cv.skills, job.requirements.skills)
          }
        });
      }
    }
    
    return pairs;
  }
  
  findRelevantJobs(cv, jobs, limit = 5) {
    // Tìm jobs cùng industry hoặc có skill overlap
    return jobs
      .filter(job => {
        const skillOverlap = this.getMatchedSkills(cv.cv.skills, job.requirements.skills);
        return skillOverlap.length > 0 || cv.metadata.industry === job.industry;
      })
      .slice(0, limit);
  }
  
  calculateAutoScore(cv, job) {
    // Simple scoring algorithm (placeholder)
    const skillMatch = this.getMatchedSkills(cv.cv.skills, job.requirements.skills);
    const skillScore = (skillMatch.length / job.requirements.skills.length) * 100;
    
    return Math.min(Math.round(skillScore), 100);
  }
  
  calculateTier(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }
  
  getMatchedSkills(cvSkills, jobSkills) {
    return cvSkills.filter(skill => 
      jobSkills.some(req => req.toLowerCase().includes(skill.toLowerCase()))
    );
  }
  
  getMissingSkills(cvSkills, jobSkills) {
    return jobSkills.filter(req =>
      !cvSkills.some(skill => req.toLowerCase().includes(skill.toLowerCase()))
    );
  }
}

module.exports = MatchingPairBuilder;
```

### Bước 6: Export Training/Test Split (30 phút)

```javascript
// File: scripts/splitDataset.js

async function splitDataset() {
  const fs = require('fs').promises;
  
  // Load annotated CVs
  const cvs = JSON.parse(await fs.readFile('thesis/datasets/annotated_cvs.json', 'utf8'));
  
  // Shuffle
  const shuffled = cvs.sort(() => Math.random() - 0.5);
  
  // Split: 70% train, 15% val, 15% test
  const trainSize = Math.floor(shuffled.length * 0.7);
  const valSize = Math.floor(shuffled.length * 0.15);
  
  const trainSet = shuffled.slice(0, trainSize);
  const valSet = shuffled.slice(trainSize, trainSize + valSize);
  const testSet = shuffled.slice(trainSize + valSize);
  
  // Save JSONL format (for Hugging Face)
  await fs.writeFile(
    'thesis/datasets/cv_parsing_train.jsonl',
    trainSet.map(cv => JSON.stringify(cv)).join('\n')
  );
  
  await fs.writeFile(
    'thesis/datasets/cv_parsing_val.jsonl',
    valSet.map(cv => JSON.stringify(cv)).join('\n')
  );
  
  await fs.writeFile(
    'thesis/datasets/cv_parsing_test.jsonl',
    testSet.map(cv => JSON.stringify(cv)).join('\n')
  );
  
  console.log(`✅ Dataset split complete:
    Train: ${trainSet.length} samples
    Val: ${valSet.length} samples
    Test: ${testSet.length} samples
  `);
}

splitDataset().catch(console.error);
```

---

## 📊 PROGRESS TRACKING

### Week 1-2 Checklist

- [ ] **Day 1-2**: Setup environment, install dependencies
- [ ] **Day 3-4**: Download Kaggle datasets hoặc generate synthetic CVs
- [ ] **Day 5-8**: Manual annotation (250 CVs/ngày = 4 ngày)
- [ ] **Day 9**: Collect/generate job descriptions
- [ ] **Day 10**: Build CV-Job matching pairs
- [ ] **Day 11**: Split dataset (train/val/test)
- [ ] **Day 12**: Review data quality, fix issues

### Deliverables
- ✅ `thesis/datasets/annotated_cvs.json` (500 CVs)
- ✅ `thesis/datasets/job_descriptions.json` (200 jobs)
- ✅ `thesis/datasets/matching_pairs.json` (2500 pairs)
- ✅ `thesis/datasets/cv_parsing_train.jsonl` (350 samples)
- ✅ `thesis/datasets/cv_parsing_val.jsonl` (75 samples)
- ✅ `thesis/datasets/cv_parsing_test.jsonl` (75 samples)

---

## ⚡ QUICK START (RUN NOW!)

```bash
# 1. Tạo folders
cd backend
mkdir -p src/research/datasets thesis/datasets python notebooks

# 2. Generate synthetic CVs (chạy ngay được!)
node scripts/generateSyntheticCVs.js

# 3. Generate job descriptions
node scripts/generateJobDescriptions.js

# 4. Build matching pairs
node scripts/buildMatchingPairs.js

# 5. Split dataset
node scripts/splitDataset.js

# Done! Bạn có dataset rồi, qua Week 3: Fine-tuning
```

---

## 🤔 CÂU HỎI THƯỜNG GẶP

**Q: Annotation 500 CVs thủ công mất bao lâu?**
A: ~4 ngày (125 CVs/ngày, mỗi CV 5 phút). Có thể dùng tool semi-automatic để nhanh hơn.

**Q: Không có GPU để train PhoBERT?**
A: Dùng Google Colab FREE (15GB RAM, Tesla T4 GPU). Đủ để fine-tune PhoBERT.

**Q: Synthetic data có tốt không?**
A: Tốt cho **initial experiments**. Nên mix 50% real + 50% synthetic cho best results.

**Q: Kaggle dataset có free không?**
A: Free 100%. Chỉ cần tạo account Kaggle và download.

---

**Next Step**: Bắt đầu từ Quick Start ở trên! Sau khi có dataset, tôi sẽ guide bạn Week 3: Fine-tuning PhoBERT.
