/**
 * Test Persistent PhoBERT Service
 * Tests the improved persistent server approach
 */

require('dotenv').config();
const { getPhoBERTPersistentService } = require('./src/services/phobertPersistentService');

async function testPersistentPhoBERT() {
  console.log('🔬 Testing Persistent PhoBERT Service\n');
  console.log('=' .repeat(80));

  const testCV = `Tôi tên Nguyễn Văn A, tốt nghiệp ĐH Bách Khoa HN chuyên ngành CNTT năm 2023. Có 6 tháng thực tập ReactJS + Nodejs tại FPT Software, làm cả backend và frontend. Biết thêm Python, Java, từng làm đồ án về NLP dùng PhoBERT. Thành thạo MySQL, Mongo, Docker. Tiếng Anh đọc viết tốt.`;

  console.log('📄 Test CV Text:');
  console.log(testCV);
  console.log('\n' + '=' .repeat(80));

  try {
    const phobertService = getPhoBERTPersistentService();

    console.log('\n⏳ Initializing PhoBERT server (loading model, please wait 10-15s)...');

    // Wait for server to be ready
    await phobertService.waitForReady(30000);

    if (!phobertService.isReady) {
      console.log('❌ PhoBERT server failed to initialize');
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check Python: python --version');
      console.log('2. Check dependencies: cd python && pip list | grep transformers');
      console.log('3. Check model: ls -lh models/phobert-cv-ner-final/');
      process.exit(1);
    }

    console.log('✅ PhoBERT server ready!\n');
    console.log('=' .repeat(80));
    console.log('\n🤖 Test 1: First Extraction (Model already loaded in memory)');
    console.log('-'.repeat(80));

    const startTime1 = Date.now();
    const result1 = await phobertService.extractSkills(testCV, {
      maxLength: 500,
      timeout: 10000
    });
    const duration1 = Date.now() - startTime1;

    console.log(`⏱️  Duration: ${duration1}ms`);
    console.log(`📊 Total skills found: ${result1.length}\n`);

    if (result1.length > 0) {
      console.log('✅ Extracted Skills:');
      result1.forEach((skill, index) => {
        console.log(`${index + 1}. ${skill}`);
      });
    } else {
      console.log('❌ No skills extracted');
    }

    // Test 2: Second extraction (should be even faster)
    console.log('\n' + '=' .repeat(80));
    console.log('\n🤖 Test 2: Second Extraction (Same model, different text)');
    console.log('-'.repeat(80));

    const testCV2 = `Kỹ năng: React, TypeScript, PostgreSQL, Redis, Kubernetes. Kinh nghiệm 5 năm làm Full Stack Developer.`;

    const startTime2 = Date.now();
    const result2 = await phobertService.extractSkills(testCV2, {
      maxLength: 500,
      timeout: 10000
    });
    const duration2 = Date.now() - startTime2;

    console.log(`⏱️  Duration: ${duration2}ms`);
    console.log(`📊 Total skills found: ${result2.length}\n`);

    if (result2.length > 0) {
      console.log('✅ Extracted Skills:');
      result2.forEach((skill, index) => {
        console.log(`${index + 1}. ${skill}`);
      });
    }

    // Expected skills analysis
    console.log('\n' + '=' .repeat(80));
    console.log('🎯 Expected Skills from Test CV 1:');
    const expectedSkills = [
      'ReactJS', 'Node.js', 'Python', 'Java', 'NLP', 'PhoBERT',
      'MySQL', 'MongoDB', 'Docker', 'Backend', 'Frontend'
    ];
    expectedSkills.forEach((skill, i) => console.log(`${i + 1}. ${skill}`));

    // Performance analysis
    console.log('\n' + '=' .repeat(80));
    console.log('📈 Performance Analysis:');
    console.log(`1st extraction: ${duration1}ms`);
    console.log(`2nd extraction: ${duration2}ms`);
    console.log(`Average: ${((duration1 + duration2) / 2).toFixed(0)}ms`);

    if (duration1 < 1000) {
      console.log('✅ Performance: EXCELLENT (< 1s)');
    } else if (duration1 < 2000) {
      console.log('✅ Performance: GOOD (1-2s)');
    } else if (duration1 < 5000) {
      console.log('⚠️  Performance: ACCEPTABLE (2-5s)');
    } else {
      console.log('❌ Performance: POOR (> 5s)');
    }

    // Accuracy check
    console.log('\n' + '=' .repeat(80));
    console.log('🎯 Accuracy Analysis:');

    const extractedNames = result1.map(s => s.toLowerCase());
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

    const recall = (correctCount / expectedSkills.length * 100).toFixed(1);
    const precision = result1.length > 0 ? (correctCount / result1.length * 100).toFixed(1) : 0;

    console.log(`✅ Found: ${correctCount}/${expectedSkills.length} skills`);
    console.log(`📊 Precision: ${precision}%`);
    console.log(`📊 Recall: ${recall}%`);

    if (foundSkills.length > 0) {
      console.log(`\n✅ Correctly identified: ${foundSkills.join(', ')}`);
    }

    if (missedSkills.length > 0) {
      console.log(`\n⚠️  Missed: ${missedSkills.join(', ')}`);
    }

    // Stop server
    console.log('\n' + '=' .repeat(80));
    console.log('🛑 Stopping PhoBERT server...');
    phobertService.stop();

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  }
}

// Run test
testPersistentPhoBERT()
  .then(() => {
    console.log('\n👋 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
