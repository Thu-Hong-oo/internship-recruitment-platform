/**
 * Test Sentence-BERT Performance After Optimization
 * 
 * Run: node scripts/test-sentence-bert-performance.js
 */

const { getSentenceBertService } = require('../src/services/ai/sentenceBertService');
const { logger } = require('../src/utils/logger');

async function testPerformance() {
  console.log('🔍 Testing Sentence-BERT Performance...\n');

  const sentenceBert = getSentenceBertService();

  // Test 1: Availability Check
  console.log('Test 1: Model Availability');
  const startAvail = Date.now();
  const isAvailable = sentenceBert.isAvailable;
  const availTime = Date.now() - startAvail;
  console.log(`✅ Available: ${isAvailable} (${availTime}ms)\n`);

  if (!isAvailable) {
    console.log('⚠️ Sentence-BERT not available. Install with: pip install sentence-transformers');
    return;
  }

  // Test 2: Single Encoding
  console.log('Test 2: Single Text Encoding');
  const testText = 'JavaScript, Node.js, React, MongoDB';
  const startEncode = Date.now();
  try {
    const embedding = await sentenceBert.encode(testText);
    const encodeTime = Date.now() - startEncode;
    console.log(`✅ Embedding dimension: ${embedding.length}`);
    console.log(`⏱️ Time: ${encodeTime}ms\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 3: Batch Encoding
  console.log('Test 3: Batch Encoding (10 texts)');
  const testTexts = [
    'JavaScript, React, Node.js',
    'Python, Django, Flask',
    'Java, Spring Boot, Hibernate',
    'C#, .NET, Azure',
    'PHP, Laravel, MySQL',
    'Ruby, Rails, PostgreSQL',
    'Go, Kubernetes, Docker',
    'Swift, iOS, Xcode',
    'Kotlin, Android, Jetpack',
    'TypeScript, Angular, NestJS'
  ];
  const startBatch = Date.now();
  try {
    const embeddings = await sentenceBert.encodeBatch(testTexts);
    const batchTime = Date.now() - startBatch;
    console.log(`✅ Encoded ${embeddings.length} texts`);
    console.log(`⏱️ Total time: ${batchTime}ms`);
    console.log(`⏱️ Average per text: ${(batchTime / testTexts.length).toFixed(2)}ms\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 4: Similarity Batch (Critical for job matching)
  console.log('Test 4: Similarity Batch (Job Matching Simulation)');
  const jobSkill = 'video editing';
  const candidateSkills = [
    'kiểm tra, quản lý, lưu trữ hồ sơ',
    'quản lý thời gian',
    'xuất nhập khẩu',
    'chứng từ',
    'invoice',
    'packing list',
    'c/o',
    'khai báo hải quan',
    'vận tải',
    'mos',
    'toeic',
    'quản lý thời gian'
  ];
  
  const startSim = Date.now();
  try {
    const similarities = await sentenceBert.similarityBatch(jobSkill, candidateSkills);
    const simTime = Date.now() - startSim;
    
    console.log(`✅ Compared 1 job skill vs ${candidateSkills.length} candidate skills`);
    console.log(`⏱️ Time: ${simTime}ms`);
    console.log(`📊 Top matches:`);
    
    const sorted = similarities
      .map((sim, idx) => ({ skill: candidateSkills[idx], similarity: sim }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    
    sorted.forEach((match, idx) => {
      console.log(`   ${idx + 1}. ${match.skill}: ${(match.similarity * 100).toFixed(1)}%`);
    });
    console.log();
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 5: Multiple Queries (Old vs New Method)
  console.log('Test 5: Multiple Queries Performance Test');
  const missingSkills = ['microsoft office', 'project management', 'communication skills'];
  
  // OLD METHOD (Sequential)
  console.log('Old Method (Sequential):');
  const startOld = Date.now();
  let oldCallCount = 0;
  try {
    for (const skill of missingSkills) {
      await sentenceBert.similarityBatch(skill, candidateSkills);
      oldCallCount++;
    }
    const oldTime = Date.now() - startOld;
    console.log(`⏱️ Time: ${oldTime}ms (${oldCallCount} Python calls)\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // NEW METHOD (Parallel with Promise.all)
  console.log('New Method (Parallel):');
  const startNew = Date.now();
  try {
    await Promise.all(
      missingSkills.map(skill => sentenceBert.similarityBatch(skill, candidateSkills))
    );
    const newTime = Date.now() - startNew;
    console.log(`⏱️ Time: ${newTime}ms (parallel execution)\n`);
    
    const improvement = ((startOld - startNew) / (startNew - startOld) * 100);
    if (improvement > 0) {
      console.log(`🚀 Performance improvement: ~${improvement.toFixed(0)}% faster!\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Summary
  console.log('=' .repeat(50));
  console.log('📊 Performance Test Summary:');
  console.log('=' .repeat(50));
  console.log('✅ All tests completed');
  console.log('💡 Tips:');
  console.log('   - First run will be slower (model loading)');
  console.log('   - Subsequent runs use cached model');
  console.log('   - Use parallel processing for multiple queries');
  console.log('   - Model cache location: backend/models/sentence_bert_cache/');
}

// Run tests
testPerformance()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
