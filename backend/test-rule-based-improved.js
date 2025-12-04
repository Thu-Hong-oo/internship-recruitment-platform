/**
 * Test Improved Rule-Based Skill Extraction
 * Direct test of ruleBasedCVParser with 300+ patterns
 */

require('dotenv').config();
const ruleBasedParser = require('./src/services/ai/ruleBasedCVParser');

async function testImprovedRuleBased() {
  console.log('🔬 Testing Improved Rule-Based Extraction (300+ patterns)\n');
  console.log('=' .repeat(80));

  const testCV = `Tôi tên Nguyễn Văn A, tốt nghiệp ĐH Bách Khoa HN chuyên ngành CNTT năm 2023. Có 6 tháng thực tập ReactJS + Nodejs tại FPT Software, làm cả backend và frontend. Biết thêm Python, Java, từng làm đồ án về NLP dùng PhoBERT. Thành thạo MySQL, Mongo, Docker. Tiếng Anh đọc viết tốt.`;

  console.log('📄 Test CV Text:');
  console.log(testCV);
  console.log('\n' + '=' .repeat(80));

  try {
    console.log('\n🤖 Extracting skills with improved rule-based (300+ patterns)...');
    console.log('-'.repeat(80));

    const startTime = Date.now();
    const skills = ruleBasedParser.extractSkills(testCV);
    const duration = Date.now() - startTime;

    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Total skills found: ${skills.length}\n`);

    if (skills.length > 0) {
      console.log('✅ Extracted Skills:');
      skills.forEach((skill, index) => {
        console.log(`${index + 1}. ${skill.name}`);
        console.log(`   Type: ${skill.type}`);
        if (skill.confidence) console.log(`   Confidence: ${(skill.confidence * 100).toFixed(0)}%`);
      });
    } else {
      console.log('❌ No skills extracted');
    }

    // Expected skills from CV
    console.log('\n' + '=' .repeat(80));
    console.log('🎯 Expected Skills (Manual Analysis):');
    const expectedSkills = [
      'ReactJS', 'Node.js', 'Python', 'Java', 'NLP', 'PhoBERT',
      'MySQL', 'MongoDB', 'Docker', 'Backend', 'Frontend', 'Tiếng Anh'
    ];
    expectedSkills.forEach((skill, i) => console.log(`${i + 1}. ${skill}`));

    // Accuracy analysis
    console.log('\n' + '=' .repeat(80));
    console.log('📈 Accuracy Analysis:');

    const extractedNames = skills.map(s => s.name.toLowerCase());
    let correctCount = 0;
    let foundSkills = [];
    let missedSkills = [];

    expectedSkills.forEach(expected => {
      const normalized = expected.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/\./g, '');

      const found = extractedNames.some(extracted => {
        const extractedNorm = extracted.toLowerCase()
          .replace(/\s+/g, '')
          .replace(/\./g, '');
        return extractedNorm.includes(normalized) || normalized.includes(extractedNorm);
      });

      if (found) {
        correctCount++;
        foundSkills.push(expected);
      } else {
        missedSkills.push(expected);
      }
    });

    const precision = skills.length > 0 ? (correctCount / skills.length * 100).toFixed(1) : 0;
    const recall = (correctCount / expectedSkills.length * 100).toFixed(1);
    const f1 = skills.length > 0 ? (2 * correctCount / (skills.length + expectedSkills.length) * 100).toFixed(1) : 0;

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

    // Performance benchmark
    console.log('\n' + '=' .repeat(80));
    console.log('⚡ Performance:');
    if (duration < 50) {
      console.log('✅ EXCELLENT (< 50ms)');
    } else if (duration < 100) {
      console.log('✅ VERY GOOD (50-100ms)');
    } else if (duration < 200) {
      console.log('✅ GOOD (100-200ms)');
    } else {
      console.log('⚠️  SLOW (> 200ms)');
    }

    // Target check
    console.log('\n' + '=' .repeat(80));
    const recallNum = parseFloat(recall);
    if (recallNum >= 80) {
      console.log('🎉 TARGET ACHIEVED: Recall ≥ 80%!');
      console.log('✅ BƯỚC 1 HOÀN THÀNH: Rule-based đã đạt target!');
    } else {
      console.log(`⚠️  TARGET NOT MET: Recall ${recall}% < 80%`);
      console.log(`   Need to improve by: ${(80 - recallNum).toFixed(1)}%`);
    }

    console.log('\n✅ Test completed');
    return { recall: recallNum, found: correctCount, total: expectedSkills.length };

  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    throw error;
  }
}

// Run test
testImprovedRuleBased()
  .then((result) => {
    console.log('\n👋 Test finished');
    if (result.recall >= 80) {
      console.log('✅ Ready for BƯỚC 2: Multilingual NER!');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
