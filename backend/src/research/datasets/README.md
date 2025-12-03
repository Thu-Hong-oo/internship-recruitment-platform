# Research Dataset Generation

## Quick Start

### 1. Generate Synthetic CVs (500 CVs)
```bash
cd backend
node src/research/datasets/generateDataset.js 500
```

**Output:**
- `thesis/datasets/processed/synthetic-cvs.json` - Structured JSON format
- `thesis/datasets/processed/synthetic-cvs.jsonl` - Line-delimited for training

**Features:**
- ✅ 14 industries (Technology, Marketing, Business, Design, etc.)
- ✅ 3 levels (60% Intern, 30% Junior, 10% Mid)
- ✅ Realistic Vietnamese names, addresses, education
- ✅ Industry-specific skills, projects, certifications
- ✅ Raw text format for NLP processing

---

## Dataset Structure

### Synthetic CV Example
```json
{
  "id": 1,
  "cv": {
    "fullName": "Nguyễn Văn An",
    "email": "nguyenvanan@gmail.com",
    "phone": "0912345678",
    "dateOfBirth": "2002-05-15",
    "address": "Cầu Giấy, Hà Nội",
    "objective": "Tìm kiếm vị trí thực tập sinh để phát triển kỹ năng lập trình...",
    "education": [{
      "school": "Đại học Bách Khoa Hà Nội",
      "degree": "Cử nhân",
      "major": "Công nghệ Thông tin",
      "gpa": 3.45,
      "startDate": "09/2020",
      "endDate": "06/2024"
    }],
    "skills": ["JavaScript", "React", "Node.js", "Git", "MongoDB"],
    "projects": [{
      "name": "Website Thương mại điện tử",
      "technologies": ["React", "Node.js", "MongoDB"],
      "role": "Fullstack Developer"
    }],
    "metadata": {
      "industry": "technology",
      "level": "intern"
    }
  },
  "rawText": "THÔNG TIN CÁ NHÂN\nHọ và tên: Nguyễn Văn An..."
}
```

---

## Statistics

After generation, you'll see:
- Total CVs generated
- Distribution by industry (14 industries)
- Distribution by level (intern/junior/mid)
- Average skills per CV (~4-6)
- Average projects per CV (~1-2)
- Percentage with work experience

---

## Next Steps

1. ✅ **Generate Synthetic CVs** (this script)
2. ⏳ **Download Kaggle Datasets** (see `KAGGLE_DATASET_GUIDE.md`)
3. ⏳ **Merge Real + Synthetic Data**
4. ⏳ **Split Train/Val/Test (70/15/15)**
5. ⏳ **Fine-tune PhoBERT**

---

## Industry Coverage

| Industry | Skills Examples |
|----------|----------------|
| Technology | JavaScript, React, Node.js, Python, Docker, AWS |
| Marketing | SEO, Google Ads, Content Marketing, Analytics |
| Business | Excel, Business Analysis, Project Management |
| Design | Figma, UI/UX, Adobe Creative Suite |
| Accounting | Kế toán, MISA, Excel, Phân tích tài chính |
| Finance | Tài chính - Ngân hàng, Phân tích đầu tư |
| Engineering | Kỹ thuật Cơ khí, Kỹ thuật Điện, CAD |
| Healthcare | Điều dưỡng, Y tế, Chăm sóc sức khỏe |
| Education | Giảng dạy, Sư phạm, Phát triển chương trình |
| HR | Tuyển dụng, Quản trị nhân sự, Training |
| Hospitality | Dịch vụ khách hàng, Quản lý khách sạn |
| Law | Luật sư, Tư vấn pháp lý, Hợp đồng |
| Media | Báo chí, Truyền thông, Content Creator |
| Logistics | Quản lý chuỗi cung ứng, Vận chuyển |

---

## Troubleshooting

**Error: Cannot find module '@faker-js/faker'**
```bash
npm install @faker-js/faker --save-dev
```

**Error: ENOENT - Directory not found**
```bash
# Create folders first
mkdir -p thesis/datasets/processed
```

**Change number of CVs:**
```bash
# Generate 1000 CVs instead of 500
node src/research/datasets/generateDataset.js 1000
```

---

## File Locations

```
backend/
├── src/research/datasets/
│   ├── syntheticCVGenerator.js    # Generator class
│   └── generateDataset.js          # Main script
└── thesis/datasets/processed/
    ├── synthetic-cvs.json          # Output (structured)
    └── synthetic-cvs.jsonl         # Output (line-delimited)
```
