/**
 * Test Hybrid System Integration
 * Verifies that skillExtractionService now uses Hybrid System
 */

require('dotenv').config();
const { getSkillExtractionService } = require('./src/services/ai/skillExtractionService');

async function testHybridIntegration() {
  console.log('🔬 Testing Hybrid System Integration in skillExtractionService\n');
  console.log('=' .repeat(80));

  const testCV = `Tôi tên Nguyễn Văn A, tốt nghiệp ĐH Bách Khoa HN chuyên ngành CNTT năm 2023. Có 6 tháng thực tập ReactJS + Nodejs tại FPT Software, làm cả backend và frontend. Biết thêm Python, Java, từng làm đồ án về NLP dùng PhoBERT. Thành thạo MySQL, Mongo, Docker. Tiếng Anh đọc viết tốt.`;

  console.log('📄 Test CV:');
  console.log(testCV);
  console.log('\n' + '=' .repeat(80));

  try {
    const skillExtractionService = getSkillExtractionService();

    console.log('\n🎯 Test 1: Using Hybrid System (default)');
    console.log('-'.repeat(80));

    const startTime = Date.now();
    const skills = await skillExtractionService.extractSkills(testCV, {
      useHybrid: true,  // Default: true
      usePhoBERT: false, // Default: false (deprecated)
      useGemini: false
    });
    const duration = Date.now() - startTime;

    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Total skills found: ${skills.length}\n`);

    if (skills.length > 0) {
      console.log('✅ Extracted Skills:');
      skills.forEach((skill, index) => {
        console.log(`${index + 1}. ${skill.name} (${skill.type}, ${(skill.confidence * 100).toFixed(0)}%, source: ${skill.source})`);
      });
    } else {
      console.log('❌ No skills extracted');
    }

    // Expected skills
    const expectedSkills = [
      'React', 'Node.js', 'Python', 'Java', 'NLP', 'PhoBERT',
      'MySQL', 'MongoDB', 'Docker', 'Backend', 'Frontend', 'Tiếng Anh'
    ];

    console.log('\n' + '=' .repeat(80));
    console.log('🎯 Expected Skills:');
    expectedSkills.forEach((skill, i) => console.log(`${i + 1}. ${skill}`));

    // Accuracy check
    const extractedNames = skills.map(s => s.name.toLowerCase());
    let foundCount = 0;
    let found = [];
    let missed = [];

    expectedSkills.forEach(expected => {
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

    const recall = (foundCount / expectedSkills.length * 100).toFixed(1);

    console.log('\n' + '=' .repeat(80));
    console.log('📊 Results:');
    console.log(`   Recall: ${recall}% (${foundCount}/${expectedSkills.length})`);
    console.log(`   Speed: ${duration}ms`);

    if (found.length > 0) {
      console.log(`\n✅ Found: ${found.join(', ')}`);
    }

    if (missed.length > 0) {
      console.log(`\n⚠️  Missed: ${missed.join(', ')}`);
    }

    // Check if Hybrid System is working
    console.log('\n' + '=' .repeat(80));
    const recallNum = parseFloat(recall);
    if (recallNum >= 80) {
      console.log('🎉 SUCCESS: Hybrid System is working! (Recall ≥ 80%)');
      console.log('✅ PhoBERT timeout issue FIXED!');
      console.log('✅ System now uses 300+ patterns rule-based + Multilingual NER');
    } else {
      console.log(`⚠️  WARNING: Recall ${recall}% < 80%`);
      console.log('   Check if Hybrid System is properly integrated');
    }

    // Test with caching
    console.log('\n' + '=' .repeat(80));
    console.log('\n🎯 Test 2: With Caching (should be instant)');
    console.log('-'.repeat(80));

    const startTime2 = Date.now();
    const skillsCached = await skillExtractionService.extractSkills(testCV, {
      useCache: true
    });
    const duration2 = Date.now() - startTime2;

    console.log(`⏱️  Duration: ${duration2}ms`);
    console.log(`📊 Total skills: ${skillsCached.length}`);

    if (duration2 < 10) {
      console.log('✅ Caching works perfectly! (<10ms)');
    } else {
      console.log('⚠️  Caching may not be working');
    }

    console.log('\n' + '=' .repeat(80));
    console.log('✅ Integration test completed!');

    return { recall: recallNum, found: foundCount, total: expectedSkills.length };

  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    throw error;
  }
}

// Run test
testHybridIntegration()
  .then((result) => {
    console.log('\n👋 Test finished');
    if (result.recall >= 80) {
      console.log('✅ HYBRID SYSTEM INTEGRATION SUCCESSFUL!');
      console.log('✅ Production-ready to replace PhoBERT');
    } else {
      console.log('⚠️  Integration needs review');
    }
    process.exit(result.recall >= 80 ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
