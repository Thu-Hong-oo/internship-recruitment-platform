/**
 * Test Multilingual NER Service
 * Tests dslim/bert-base-NER-uncased model
 */

require('dotenv').config();
const { getMultilingualNERService } = require('./src/services/multilingualNERService');

async function testMultilingualNER() {
  console.log('🔬 Testing Multilingual NER Service (dslim/bert-base-NER)\n');
  console.log('=' .repeat(80));

  const testCases = [
    {
      name: 'Mixed Vietnamese-English CV',
      text: `Tôi tên Nguyễn Văn A, tốt nghiệp ĐH Bách Khoa HN chuyên ngành CNTT năm 2023. Có 6 tháng thực tập ReactJS + Nodejs tại FPT Software, làm cả backend và frontend. Biết thêm Python, Java, từng làm đồ án về NLP dùng PhoBERT. Thành thạo MySQL, Mongo, Docker. Tiếng Anh đọc viết tốt.`,
      expected: ['ReactJS', 'Node.js', 'Python', 'Java', 'NLP', 'PhoBERT', 'MySQL', 'MongoDB', 'Docker', 'FPT Software']
    },
    {
      name: 'Pure English CV',
      text: `I am a Full Stack Developer with 3 years of experience in React, Node.js, TypeScript, and PostgreSQL. I have worked at Google and Microsoft. Skills include AWS, Docker, Kubernetes, and GraphQL.`,
      expected: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Google', 'Microsoft', 'AWS', 'Docker', 'Kubernetes', 'GraphQL']
    }
  ];

  try {
    const multilingualNER = getMultilingualNERService();

    console.log('\n⏳ Initializing Multilingual NER server...');
    console.log('   (First time: downloading model ~500MB, please wait 1-2 minutes)');

    // Wait for server to be ready
    await multilingualNER.waitForReady(120000); // 2 minutes for download

    if (!multilingualNER.isReady) {
      console.log('❌ Multilingual NER server failed to initialize');
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check Python: python --version');
      console.log('2. Install transformers: pip install transformers torch');
      console.log('3. Check internet connection (for model download)');
      process.exit(1);
    }

    console.log('✅ Multilingual NER server ready!\n');

    // Test each case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];

      console.log('=' .repeat(80));
      console.log(`\n🧪 Test ${i + 1}: ${testCase.name}`);
      console.log('-'.repeat(80));
      console.log('📄 Text:');
      console.log(testCase.text.substring(0, 200) + (testCase.text.length > 200 ? '...' : ''));

      const startTime = Date.now();
      const entities = await multilingualNER.extractEntities(testCase.text, {
        minScore: 0.7
      });
      const duration = Date.now() - startTime;

      console.log(`\n⏱️  Duration: ${duration}ms`);
      console.log(`📊 Total entities found: ${entities.length}\n`);

      if (entities.length > 0) {
        console.log('✅ Extracted Entities:');
        entities.forEach((entity, index) => {
          console.log(`${index + 1}. ${entity.text} (${entity.type}, score: ${(entity.score * 100).toFixed(0)}%)`);
        });
      } else {
        console.log('❌ No entities extracted');
      }

      // Accuracy check
      const extractedTexts = entities.map(e => e.text.toLowerCase());
      let foundCount = 0;
      let found = [];
      let missed = [];

      testCase.expected.forEach(expected => {
        const normalized = expected.toLowerCase().replace(/[.\s]+/g, '');
        const isFound = extractedTexts.some(extracted => {
          const extractedNorm = extracted.toLowerCase().replace(/[.\s]+/g, '');
          return extractedNorm.includes(normalized) || normalized.includes(extractedNorm);
        });

        if (isFound) {
          foundCount++;
          found.push(expected);
        } else {
          missed.push(expected);
        }
      });

      const recall = (foundCount / testCase.expected.length * 100).toFixed(1);

      console.log(`\n📊 Recall: ${recall}% (${foundCount}/${testCase.expected.length})`);

      if (found.length > 0) {
        console.log(`✅ Found: ${found.join(', ')}`);
      }

      if (missed.length > 0) {
        console.log(`⚠️  Missed: ${missed.join(', ')}`);
      }
    }

    // Model info
    console.log('\n' + '=' .repeat(80));
    console.log('ℹ️  Model Information:');
    const info = multilingualNER.getModelInfo();
    console.log(JSON.stringify(info, null, 2));

    // Stop server
    console.log('\n' + '=' .repeat(80));
    console.log('🛑 Stopping Multilingual NER server...');
    multilingualNER.stop();

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  }
}

// Run test
testMultilingualNER()
  .then(() => {
    console.log('\n👋 Test finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
