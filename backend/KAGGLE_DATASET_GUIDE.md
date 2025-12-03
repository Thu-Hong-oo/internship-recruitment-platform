# 📥 HƯỚNG DẪN DOWNLOAD KAGGLE DATASETS

## 🎯 Mục tiêu
Download **Resume/CV datasets** từ Kaggle để train model cho đồ án tốt nghiệp

---

## 📋 BƯỚC 1: Tạo Kaggle Account & API Token (5 phút)

### 1.1. Đăng ký tài khoản Kaggle

1. Truy cập: https://www.kaggle.com/
2. Click **"Register"** ở góc trên bên phải
3. Đăng ký bằng:
   - Google account (khuyến nghị - nhanh nhất)
   - Email + Password
   - Facebook

### 1.2. Tạo API Token

1. Sau khi đăng nhập, click vào **avatar** (góc trên bên phải)
2. Chọn **"Settings"**
3. Scroll xuống mục **"API"**
4. Click **"Create New Token"**
5. File `kaggle.json` sẽ tự động download về máy

**Nội dung file `kaggle.json`:**
```json
{
  "username": "your_kaggle_username",
  "key": "your_api_key_here_1234567890abcdef"
}
```

### 1.3. Cài đặt API Token

#### Trên Windows:

```powershell
# Tạo thư mục .kaggle trong user directory
mkdir $env:USERPROFILE\.kaggle

# Copy file kaggle.json vào thư mục .kaggle
# Ví dụ: File download về Downloads/kaggle.json
Copy-Item "$env:USERPROFILE\Downloads\kaggle.json" "$env:USERPROFILE\.kaggle\kaggle.json"

# Verify
cat $env:USERPROFILE\.kaggle\kaggle.json
```

#### Trên Mac/Linux:

```bash
mkdir -p ~/.kaggle
mv ~/Downloads/kaggle.json ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json  # Bảo mật file
```

---

## 📦 BƯỚC 2: Cài đặt Kaggle CLI (2 phút)

```bash
# Install Kaggle CLI tool
pip install kaggle

# Verify installation
kaggle --version
# Output: Kaggle API 1.5.16
```

**Nếu gặp lỗi "kaggle command not found":**

```bash
# Thêm Python Scripts vào PATH
# Windows: Thêm vào System Environment Variables
C:\Users\YourName\AppData\Local\Programs\Python\Python311\Scripts

# Hoặc dùng python -m
python -m kaggle --version
```

---

## 🎯 BƯỚC 3: Download Resume Datasets (10 phút)

### Dataset 1: Resume Dataset (2400 CVs) ⭐ KHUYẾN NGHỊ

**Thông tin:**
- Size: 2400 resumes
- Format: CSV with text column
- Industries: Multiple (IT, HR, Finance, Marketing...)
- Quality: ⭐⭐⭐⭐⭐

**Download:**

```bash
# Navigate to backend folder
cd D:\KhoaLuan_Internship\internship-recruitment-platform\backend

# Create datasets folder
mkdir thesis\datasets\raw
cd thesis\datasets\raw

# Download dataset
kaggle datasets download -d snehaanbhawal/resume-dataset

# Unzip (Windows)
tar -xf resume-dataset.zip

# Hoặc dùng 7-Zip, WinRAR
```

**File structure sau khi unzip:**
```
thesis/datasets/raw/
└── UpdatedResumeDataSet.csv  (2MB)
```

**Preview data:**

```javascript
// scripts/previewKaggleData.js
const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('thesis/datasets/raw/UpdatedResumeDataSet.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log('Total resumes:', results.length);
    console.log('\nFirst resume:');
    console.log(results[0]);
    
    // Categories
    const categories = [...new Set(results.map(r => r.Category))];
    console.log('\nCategories:', categories);
  });
```

**Run preview:**
```bash
npm install csv-parser
node scripts/previewKaggleData.js
```

**Output mẫu:**
```
Total resumes: 2400
First resume:
{
  ID: 1,
  Category: 'Data Science',
  Resume: 'PROFILE: Summary: Professional with 8+ years of experience in Data Science...'
}
Categories: [
  'Data Science',
  'HR',
  'Advocate',
  'Arts',
  'Web Designing',
  'Mechanical Engineer',
  'Sales',
  'Health and fitness',
  'Civil Engineer',
  'Java Developer',
  ...
]
```

---

### Dataset 2: Resume Entities for NER (220 CVs with annotations) ⭐⭐⭐⭐⭐

**Thông tin:**
- Size: 220 resumes với NER labels
- Format: JSON với entity annotations
- Perfect for: Skill extraction training
- Quality: ⭐⭐⭐⭐⭐ (có sẵn ground truth!)

**Download:**

```bash
cd D:\KhoaLuan_Internship\internship-recruitment-platform\backend\thesis\datasets\raw

kaggle datasets download -d dataturks/resume-entities-for-ner

# Unzip
tar -xf resume-entities-for-ner.zip
```

**File structure:**
```
thesis/datasets/raw/
└── Entity_Recognition_in_Resumes.json  (1.5MB)
```

**Data format:**
```json
{
  "content": "Abhishek Jha Application Development Associate - Accenture Bengaluru, Karnataka - Email me on Indeed: indeed.com/r/Abhishek-Jha/10e257e57171eca0...",
  "annotation": [
    {
      "label": ["Name"],
      "points": [{"start": 0, "end": 13, "text": "Abhishek Jha"}]
    },
    {
      "label": ["Designation"],
      "points": [{"start": 14, "end": 49, "text": "Application Development Associate"}]
    },
    {
      "label": ["Companies worked at"],
      "points": [{"start": 52, "end": 61, "text": "Accenture"}]
    },
    {
      "label": ["Skills"],
      "points": [{"start": 300, "end": 310, "text": "JavaScript"}]
    }
  ]
}
```

**Convert to training format:**

```javascript
// scripts/convertNERDataset.js
const fs = require('fs');

// Load raw data
const raw = JSON.parse(fs.readFileSync('thesis/datasets/raw/Entity_Recognition_in_Resumes.json', 'utf8'));

// Convert to JSONL format
const dataset = raw.map((item, idx) => {
  const tokens = item.content.split(/\s+/);
  
  // Create BIO tags
  const labels = tokens.map(() => 'O'); // Default: Outside
  
  // Mark entities
  item.annotation.forEach(ann => {
    ann.points.forEach(point => {
      const entityText = point.text;
      const entityTokens = entityText.split(/\s+/);
      
      // Find position in tokens array
      const startIdx = tokens.findIndex((t, i) => 
        tokens.slice(i, i + entityTokens.length).join(' ') === entityText
      );
      
      if (startIdx !== -1) {
        labels[startIdx] = `B-${ann.label[0]}`; // Begin
        for (let i = 1; i < entityTokens.length; i++) {
          labels[startIdx + i] = `I-${ann.label[0]}`; // Inside
        }
      }
    });
  });
  
  return {
    id: idx,
    tokens,
    labels,
    metadata: {
      source: 'kaggle-dataturks',
      hasSkills: item.annotation.some(a => a.label.includes('Skills'))
    }
  };
});

// Save to JSONL
const jsonl = dataset.map(d => JSON.stringify(d)).join('\n');
fs.writeFileSync('thesis/datasets/ner_training_data.jsonl', jsonl);

console.log(`✅ Converted ${dataset.length} resumes to NER format`);
```

**Run:**
```bash
node scripts/convertNERDataset.js
```

---

### Dataset 3: LinkedIn Job Postings (33K jobs) 🔥

**Download:**

```bash
cd D:\KhoaLuan_Internship\internship-recruitment-platform\backend\thesis\datasets\raw

kaggle datasets download -d arshkon/linkedin-job-postings

tar -xf linkedin-job-postings.zip
```

**Files:**
- `job_postings.csv` (33K jobs)
- `job_skills.csv` (Skills required)
- `company_details.csv`

---

### Dataset 4: Vietnamese CVs (GitHub) 🇻🇳

**Không có trên Kaggle, nhưng có trên GitHub:**

```bash
cd thesis/datasets/raw

# Clone Vietnamese CV dataset (nếu có public repo)
git clone https://github.com/your-repo/vietnamese-cv-dataset

# Hoặc tự tạo synthetic Vietnamese CVs (khuyến nghị)
```

---

## 🔄 BƯỚC 4: Process & Clean Data (1 ngày)

### 4.1. Parse CSV to JSON

```javascript
// scripts/parseKaggleCSV.js
const fs = require('fs');
const csv = require('csv-parser');

async function parseResumeDataset() {
  const resumes = [];
  
  return new Promise((resolve) => {
    fs.createReadStream('thesis/datasets/raw/UpdatedResumeDataSet.csv')
      .pipe(csv())
      .on('data', (row) => {
        resumes.push({
          id: parseInt(row.ID),
          category: row.Category,
          text: row.Resume,
          metadata: {
            source: 'kaggle-snehaanbhawal',
            industry: mapCategoryToIndustry(row.Category),
            language: 'en',
            format: 'text'
          }
        });
      })
      .on('end', () => {
        console.log(`Parsed ${resumes.length} resumes`);
        
        // Save to JSON
        fs.writeFileSync(
          'thesis/datasets/processed/kaggle_resumes.json',
          JSON.stringify(resumes, null, 2)
        );
        
        resolve(resumes);
      });
  });
}

function mapCategoryToIndustry(category) {
  const mapping = {
    'Data Science': 'technology',
    'Java Developer': 'technology',
    'Web Designing': 'design',
    'HR': 'business',
    'Sales': 'business',
    'Advocate': 'law',
    'Mechanical Engineer': 'engineering',
    'Civil Engineer': 'engineering',
    'Arts': 'design',
    'Health and fitness': 'healthcare'
  };
  
  return mapping[category] || 'other';
}

parseResumeDataset();
```

### 4.2. Extract Skills from Text

```javascript
// scripts/extractSkillsFromKaggle.js
const fs = require('fs');
const natural = require('natural');

// Load skill dictionary
const SKILL_KEYWORDS = [
  // Technology
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'MongoDB',
  'SQL', 'AWS', 'Docker', 'Git', 'TypeScript', 'Angular', 'Vue',
  
  // Data Science
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
  'Pandas', 'NumPy', 'Scikit-learn', 'Data Analysis', 'Statistics',
  
  // Soft skills
  'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
  'Critical Thinking', 'Time Management', 'Project Management'
];

function extractSkills(text) {
  const found = [];
  const lowerText = text.toLowerCase();
  
  SKILL_KEYWORDS.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      found.push(skill);
    }
  });
  
  return [...new Set(found)]; // Remove duplicates
}

// Process all resumes
const resumes = JSON.parse(fs.readFileSync('thesis/datasets/processed/kaggle_resumes.json', 'utf8'));

resumes.forEach(resume => {
  resume.extractedSkills = extractSkills(resume.text);
});

fs.writeFileSync(
  'thesis/datasets/processed/kaggle_resumes_with_skills.json',
  JSON.stringify(resumes, null, 2)
);

console.log('✅ Extracted skills from all resumes');
```

---

## 📊 BƯỚC 5: Data Statistics & Quality Check

```javascript
// scripts/analyzeDataset.js
const fs = require('fs');

const resumes = JSON.parse(fs.readFileSync('thesis/datasets/processed/kaggle_resumes_with_skills.json', 'utf8'));

const stats = {
  total: resumes.length,
  
  byIndustry: {},
  bySkillCount: { '0': 0, '1-5': 0, '6-10': 0, '10+': 0 },
  
  avgTextLength: 0,
  avgSkillCount: 0,
  
  topSkills: {}
};

resumes.forEach(r => {
  // Industry distribution
  stats.byIndustry[r.metadata.industry] = (stats.byIndustry[r.metadata.industry] || 0) + 1;
  
  // Skill count distribution
  const skillCount = r.extractedSkills.length;
  if (skillCount === 0) stats.bySkillCount['0']++;
  else if (skillCount <= 5) stats.bySkillCount['1-5']++;
  else if (skillCount <= 10) stats.bySkillCount['6-10']++;
  else stats.bySkillCount['10+']++;
  
  // Text length
  stats.avgTextLength += r.text.length;
  stats.avgSkillCount += skillCount;
  
  // Top skills
  r.extractedSkills.forEach(skill => {
    stats.topSkills[skill] = (stats.topSkills[skill] || 0) + 1;
  });
});

stats.avgTextLength = Math.round(stats.avgTextLength / resumes.length);
stats.avgSkillCount = (stats.avgSkillCount / resumes.length).toFixed(1);

// Sort top skills
stats.topSkills = Object.entries(stats.topSkills)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

console.log('📊 Dataset Statistics:');
console.log(JSON.stringify(stats, null, 2));

// Save report
fs.writeFileSync('thesis/datasets/dataset_analysis.json', JSON.stringify(stats, null, 2));
```

**Output mẫu:**
```json
{
  "total": 2400,
  "byIndustry": {
    "technology": 850,
    "business": 420,
    "engineering": 380,
    "design": 250,
    "healthcare": 180,
    "law": 120,
    "other": 200
  },
  "bySkillCount": {
    "0": 120,
    "1-5": 850,
    "6-10": 980,
    "10+": 450
  },
  "avgTextLength": 1250,
  "avgSkillCount": "7.3",
  "topSkills": {
    "Python": 520,
    "Java": 480,
    "JavaScript": 420,
    "SQL": 390,
    "Communication": 680,
    "Leadership": 550
  }
}
```

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Tạo Kaggle account
- [ ] Download kaggle.json token
- [ ] Cài đặt Kaggle CLI (`pip install kaggle`)
- [ ] Download Dataset 1: Resume Dataset (2400 CVs)
- [ ] Download Dataset 2: NER Resume Dataset (220 CVs)
- [ ] Download Dataset 3: LinkedIn Jobs (33K jobs)
- [ ] Parse CSV to JSON
- [ ] Extract skills from text
- [ ] Run data analysis
- [ ] Review quality & fix issues

---

## 🚨 TROUBLESHOOTING

### Lỗi: "401 Unauthorized"
**Nguyên nhân:** Chưa config kaggle.json đúng

**Giải pháp:**
```bash
# Check file tồn tại
cat $env:USERPROFILE\.kaggle\kaggle.json

# Verify username & key
kaggle config view
```

### Lỗi: "403 Forbidden"
**Nguyên nhân:** Chưa accept dataset rules

**Giải pháp:**
1. Vào link dataset trên web
2. Click "Download" một lần (để accept rules)
3. Sau đó dùng CLI download

### Lỗi: "kaggle: command not found"
**Giải pháp:**
```bash
# Dùng python -m thay vì kaggle
python -m kaggle datasets download -d snehaanbhawal/resume-dataset
```

### Dataset quá lớn (slow download)
**Giải pháp:**
```bash
# Download chỉ 1 file cụ thể
kaggle datasets download -d snehaanbhawal/resume-dataset -f UpdatedResumeDataSet.csv
```

---

## 📚 TÀI LIỆU THAM KHẢO

- Kaggle API Docs: https://github.com/Kaggle/kaggle-api
- Resume Dataset: https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset
- NER Dataset: https://www.kaggle.com/datasets/dataturks/resume-entities-for-ner
- LinkedIn Jobs: https://www.kaggle.com/datasets/arshkon/linkedin-job-postings

---

## 🎯 NEXT STEPS

Sau khi download & process xong:

1. ✅ Review data quality (xem có đủ đa dạng không)
2. ✅ Mix với synthetic data (50-50 khuyến nghị)
3. ✅ Split train/val/test (70/15/15)
4. ✅ Annotate ground truth (nếu chưa có)
5. ✅ Ready for Week 3: Fine-tuning!

---

**Prepared by**: GitHub Copilot  
**Date**: 2025-12-01  
**For**: Đồ án tốt nghiệp - Dataset Collection Phase
