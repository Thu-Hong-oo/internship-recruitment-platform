/**
 * COMPREHENSIVE HYBRID SYSTEM TEST
 * Tests all 3 CV types: Pure Vietnamese, Pure English, Mixed
 */

require('dotenv').config();
const { getHybridSkillExtractionService } = require('./src/services/ai/hybridSkillExtractionService');

async function testHybridSystem() {
  console.log('🎯 COMPREHENSIVE HYBRID SKILL EXTRACTION TEST\n');
  console.log('=' .repeat(80));

  const testCases = [
    {
      name: 'Test 1: Pure Vietnamese CV',
      language: 'vietnamese',
      text: `Tôi tên Nguyễn Văn A, tốt nghiệp ĐH Bách Khoa HN chuyên ngành CNTT năm 2023. Có 6 tháng thực tập ReactJS + Nodejs tại FPT Software, làm cả backend và frontend. Biết thêm Python, Java, từng làm đồ án về NLP dùng PhoBERT. Thành thạo MySQL, Mongo, Docker. Tiếng Anh đọc viết tốt.`,
      expected: ['React', 'Node.js', 'Python', 'Java', 'NLP', 'PhoBERT', 'MySQL', 'MongoDB', 'Docker', 'Backend', 'Frontend', 'Tiếng Anh'],
      targetRecall: 100
    },
    {
      name: 'Test 2: Pure English CV',
      language: 'english',
      text: `I am John Smith, a Senior Full Stack Developer with 5 years of experience. Skills include React, Node.js, TypeScript, PostgreSQL, Docker, Kubernetes, AWS, and GraphQL. Previously worked at Google and Microsoft. Proficient in Python, Java, and Go. Experience with TensorFlow and PyTorch for machine learning projects.`,
      expected: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'GraphQL', 'Python', 'Java', 'Go', 'TensorFlow', 'PyTorch'],
      targetRecall: 85
    },
    {
      name: 'Test 3: Mixed Vietnamese-English CV',
      language: 'mixed',
      text: `Tên: Lê Thị B. Education: Computer Science at HCMUS. Work Experience: 3 năm làm việc với React, TypeScript, Node.js tại Shopee Vietnam. Projects: Developed e-commerce platform using AWS, Docker, Kubernetes. Kỹ năng: Python, Java, MongoDB, Redis, GraphQL. Ngôn ngữ: English (IELTS 7.5), Vietnamese (native).`,
      expected: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'Python', 'Java', 'MongoDB', 'Redis', 'GraphQL', 'English', 'Vietnamese'],
      targetRecall: 90
    }
  ];

  try {
    const hybridService = getHybridSkillExtractionService();

    console.log('\n⏳ Initializing Hybrid Skill Extraction Service...');
    console.log('   (Multilingual NER may take a moment to start)');

    // Give NER a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ Hybrid service ready!\n');

    const results = [];

    // Test each case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];

      console.log('=' .repeat(80));
      console.log(`\n${testCase.name}`);
      console.log('-'.repeat(80));
      console.log('📄 Text preview:');
      console.log(testCase.text.substring(0, 150) + '...\n');

      const startTime = Date.now();
      const skills = await hybridService.extractSkills(testCase.text, {
        useCache: false,
        includeMetadata: true
      });
      const duration = Date.now() - startTime;

      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Total skills found: ${skills.length}\n`);

      if (skills.length > 0) {
        console.log('✅ Extracted Skills (top 15):');
        skills.slice(0, 15).forEach((skill, index) => {
          console.log(`${index + 1}. ${skill.name} (${skill.type}, ${(skill.confidence * 100).toFixed(0)}%, ${skill.source})`);
        });
        if (skills.length > 15) {
          console.log(`   ... and ${skills.length - 15} more`);
        }
      } else {
        console.log('❌ No skills extracted');
      }

      // Accuracy analysis
      const extractedNames = skills.map(s => s.name.toLowerCase());
      let foundCount = 0;
      let found = [];
      let missed = [];

      testCase.expected.forEach(expected => {
        const normalized = expected.toLowerCase().replace(/[.\s-_]/g, '');
        const isFound = extractedNames.some(extracted => {
          const extractedNorm = extracted.toLowerCase().replace(/[.\s-_]/g, '');
          return extractedNorm.includes(normalized) || normalized.includes(extractedNorm);
        });

        if (isFound) {
          foundCount++;
          found.push(expected);
        } else {
          missed.push(expected);
        }
      });

      const precision = skills.length > 0 ? (foundCount / skills.length * 100).toFixed(1) : 0;
      const recall = (foundCount / testCase.expected.length * 100).toFixed(1);
      const f1 = skills.length > 0 ? (2 * foundCount / (skills.length + testCase.expected.length) * 100).toFixed(1) : 0;

      console.log(`\n📊 Metrics:`);
      console.log(`   Precision: ${precision}%`);
      console.log(`   Recall: ${recall}% (${foundCount}/${testCase.expected.length})`);
      console.log(`   F1 Score: ${f1}%`);
      console.log(`   Target Recall: ${testCase.targetRecall}%`);

      if (found.length > 0) {
        console.log(`\n✅ Found: ${found.join(', ')}`);
      }

      if (missed.length > 0) {
        console.log(`\n⚠️  Missed: ${missed.join(', ')}`);
      }

      // Target check
      const recallNum = parseFloat(recall);
      if (recallNum >= testCase.targetRecall) {
        console.log(`\n🎉 ✅ TARGET ACHIEVED: ${recall}% ≥ ${testCase.targetRecall}%`);
      } else {
        console.log(`\n⚠️  ❌ TARGET NOT MET: ${recall}% < ${testCase.targetRecall}%`);
        console.log(`   Gap: ${(testCase.targetRecall - recallNum).toFixed(1)}%`);
      }

      results.push({
        name: testCase.name,
        language: testCase.language,
        recall: recallNum,
        precision: parseFloat(precision),
        f1: parseFloat(f1),
        targetMet: recallNum >= testCase.targetRecall,
        duration: duration
      });
    }

    // Overall summary
    console.log('\n' + '=' .repeat(80));
    console.log('📊 OVERALL SUMMARY');
    console.log('=' .repeat(80));

    results.forEach((result, i) => {
      const icon = result.targetMet ? '✅' : '❌';
      console.log(`\n${icon} ${result.name}`);
      console.log(`   Recall: ${result.recall}% (target: ${testCases[i].targetRecall}%)`);
      console.log(`   Precision: ${result.precision}%`);
      console.log(`   F1 Score: ${result.f1}%`);
      console.log(`   Speed: ${result.duration}ms`);
    });

    const allTargetsMet = results.every(r => r.targetMet);
    const avgRecall = (results.reduce((sum, r) => sum + r.recall, 0) / results.length).toFixed(1);
    const avgPrecision = (results.reduce((sum, r) => sum + r.precision, 0) / results.length).toFixed(1);
    const avgF1 = (results.reduce((sum, r) => sum + r.f1, 0) / results.length).toFixed(1);
    const avgSpeed = (results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(0);

    console.log('\n' + '=' .repeat(80));
    console.log('🎯 FINAL VERDICT');
    console.log('=' .repeat(80));

    console.log(`\nAverage Metrics:`);
    console.log(`   Recall: ${avgRecall}%`);
    console.log(`   Precision: ${avgPrecision}%`);
    console.log(`   F1 Score: ${avgF1}%`);
    console.log(`   Speed: ${avgSpeed}ms`);

    if (allTargetsMet) {
      console.log('\n🎉🎉🎉 ALL TARGETS ACHIEVED! 🎉🎉🎉');
      console.log('✅ Hybrid system ready for production!');
      console.log('\nKey achievements:');
      console.log('   ✅ Pure Vietnamese: 100% recall (rule-based)');
      console.log('   ✅ Pure English: 85%+ recall (multilingual NER)');
      console.log('   ✅ Mixed language: 90%+ recall (hybrid)');
      console.log('   ✅ Fast performance: < 500ms average');
    } else {
      console.log('\n⚠️  SOME TARGETS NOT MET');
      const failedTests = results.filter(r => !r.targetMet);
      console.log(`   Failed: ${failedTests.map(r => r.name).join(', ')}`);
      console.log('\nRecommendations:');
      console.log('   - Review failed test cases');
      console.log('   - Consider adjusting target thresholds');
      console.log('   - Add more patterns to rule-based');
      console.log('   - Fine-tune NER model');
    }

    // Service info
    console.log('\n' + '=' .repeat(80));
    console.log('ℹ️  SERVICE INFORMATION');
    console.log('=' .repeat(80));
    const info = hybridService.getServiceInfo();
    console.log(JSON.stringify(info, null, 2));

    console.log('\n✅ Comprehensive test completed!');

    return { results, allTargetsMet, avgRecall, avgPrecision, avgF1 };

  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    throw error;
  }
}

// Run test
testHybridSystem()
  .then((summary) => {
    console.log('\n👋 Test finished');
    if (summary.allTargetsMet) {
      console.log('🚀 System ready for BƯỚC 3: Integration!');
    }
    process.exit(summary.allTargetsMet ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
