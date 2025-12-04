/**
 * Test Skill Extraction Service
 * Quick test script for PhoBERT-based skill extraction
 */

require('dotenv').config();
const { getSkillExtractionService } = require('./src/services/ai/skillExtractionService');

async function testSkillExtraction() {
  console.log('🔬 Testing Skill Extraction Service\n');
  console.log('=' .repeat(80));

  const testCV = `Tôi tên Nguyễn Văn A, tốt nghiệp ĐH Bách Khoa HN chuyên ngành CNTT năm 2023. Có 6 tháng thực tập ReactJS + Nodejs tại FPT Software, làm cả backend và frontend. Biết thêm Python, Java, từng làm đồ án về NLP dùng PhoBERT. Thành thạo MySQL, Mongo, Docker. Tiếng Anh đọc viết tốt.`;

  console.log('📄 Test CV Text:');
  console.log(testCV);
  console.log('\n' + '=' .repeat(80));

  try {
    const skillExtractionService = getSkillExtractionService();

    console.log('\n🤖 Method 1: PhoBERT Extraction (Primary)');
    console.log('-'.repeat(80));

    const startTime = Date.now();
    const result = await skillExtractionService.extractSkills(testCV, {
      usePhoBERT: true,
      useGemini: false,
      useCache: false,
      includeSoftSkills: true,
      includeLanguages: true
    });
    const duration = Date.now() - startTime;

    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Total skills found: ${result.length}\n`);

    if (result.length > 0) {
      console.log('✅ Extracted Skills:');
      result.forEach((skill, index) => {
        console.log(`${index + 1}. ${skill.name || skill}`);
        if (skill.type) console.log(`   Type: ${skill.type}`);
        if (skill.level) console.log(`   Level: ${skill.level}`);
        if (skill.confidence !== undefined) console.log(`   Confidence: ${(skill.confidence * 100).toFixed(1)}%`);
      });
    } else {
      console.log('❌ No skills extracted');
    }

    // Expected skills from CV
    console.log('\n' + '=' .repeat(80));
    console.log('🎯 Expected Skills (Manual Analysis):');
    const expectedSkills = [
      'ReactJS',
      'Node.js',
      'Python',
      'Java',
      'NLP',
      'PhoBERT',
      'MySQL',
      'MongoDB',
      'Docker',
      'Backend',
      'Frontend',
      'English (Tiếng Anh)'
    ];
    expectedSkills.forEach((skill, i) => console.log(`${i + 1}. ${skill}`));

    // Analysis
    console.log('\n' + '=' .repeat(80));
    console.log('📈 Accuracy Analysis:');

    const extractedNames = result.map(s => (s.name || s).toLowerCase());
    let correctCount = 0;
    let foundSkills = [];
    let missedSkills = [];

    expectedSkills.forEach(expected => {
      const normalized = expected.toLowerCase().replace(/[.\s]+/g, '');
      const found = extractedNames.some(extracted => {
        const extractedNorm = extracted.toLowerCase().replace(/[.\s]+/g, '');
        return extractedNorm.includes(normalized) || normalized.includes(extractedNorm);
      });

      if (found) {
        correctCount++;
        foundSkills.push(expected);
      } else {
        missedSkills.push(expected);
      }
    });

    const precision = result.length > 0 ? (correctCount / result.length * 100).toFixed(1) : 0;
    const recall = (correctCount / expectedSkills.length * 100).toFixed(1);
    const f1 = result.length > 0 ? (2 * correctCount / (result.length + expectedSkills.length) * 100).toFixed(1) : 0;

    console.log(`✅ Found: ${correctCount}/${expectedSkills.length} skills`);
    console.log(`📊 Precision: ${precision}%`);
    console.log(`📊 Recall: ${recall}%`);
    console.log(`📊 F1 Score: ${f1}%`);

    if (foundSkills.length > 0) {
      console.log(`\n✅ Correctly identified: ${foundSkills.join(', ')}`);
    }

    if (missedSkills.length > 0) {
      console.log(`\n⚠️  Missed: ${missedSkills.join(', ')}`);
    }

    console.log('\n' + '=' .repeat(80));
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);

    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if PhoBERT model exists: ls -lh models/phobert-cv-ner-final/');
    console.log('2. Test Python script: python python/phobert_inference.py --check');
    console.log('3. Check Python dependencies: cd python && pip install -r requirements.txt');
    console.log('4. Check logs: tail -n 50 logs/error.log');
  }
}

// Run test
testSkillExtraction()
  .then(() => {
    console.log('\n👋 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
