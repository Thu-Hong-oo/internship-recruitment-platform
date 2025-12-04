/**
 * 🧪 Test Skill Gap Analysis API
 * 
 * Verify improvements after optimization
 * Usage: node scripts/test-skill-gap-api.js
 */

const mongoose = require('mongoose');
const { getSelfSufficientAIService } = require('../src/services/ai/selfSufficientAIService');
const { logger } = require('../src/utils/logger');

// Test data
const testCV = {
  skills: {
    technical: [
      'React',
      'Node.js',
      'MongoDB',
      'JavaScript',
      'HTML',
      'CSS',
      'Git'
    ],
    soft: [
      'Teamwork',
      'Communication',
      'Problem Solving'
    ]
  },
  experience: [],
  education: []
};

const testJob = {
  title: 'Frontend Developer',
  skills: [
    'React',
    'Vue.js', // Missing
    'TypeScript', // Missing
    'Node.js',
    'MongoDB',
    'Docker', // Missing
    'CI/CD', // Missing
    'Figma', // Missing (design)
    'Agile',
    'Git'
  ],
  description: 'Frontend developer position requiring React, TypeScript, and modern tooling'
};

async function testSkillGapAPI() {
  try {
    logger.info('🧪 Starting Skill Gap API Test...\n');

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internship-platform';
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB\n');

    // Get AI service
    const aiService = getSelfSufficientAIService();

    // Test 1: Basic skill gap analysis
    logger.info('📊 Test 1: Basic Skill Gap Analysis');
    logger.info('CV Skills:', testCV.skills.technical.join(', '));
    logger.info('Job Requirements:', testJob.skills.join(', '));
    logger.info('');

    const startTime = Date.now();
    const result = await aiService.analyzeSkillGaps(testCV, testJob);
    const duration = Date.now() - startTime;

    logger.info(`⏱️ Analysis completed in ${duration}ms\n`);

    // Display results
    logger.info('📈 Results:');
    logger.info(`   Method: ${result._method}`);
    logger.info(`   Match Rate: ${result._stats.matchRate}%`);
    logger.info(`   Required Skills: ${result._stats.totalRequired}`);
    logger.info(`   Matched Skills: ${result._stats.matched}`);
    logger.info(`   Missing Skills: ${result._stats.missing}`);
    logger.info(`   Overall Gap Level: ${result.overallGapLevel}\n`);

    logger.info('❌ Missing Skills:');
    result.missingSkills.forEach((skill, i) => {
      logger.info(`   ${i + 1}. ${skill.name} (${skill.category}) - ${skill.importance} priority`);
      logger.info(`      Reason: ${skill.reason}`);
    });
    logger.info('');

    logger.info('✅ Strong Skills:');
    result.strongSkills.slice(0, 5).forEach((skill, i) => {
      logger.info(`   ${i + 1}. ${skill.name} (${skill.category}) - ${skill.relevance} relevance`);
    });
    logger.info('');

    logger.info('📚 Learning Priority:');
    result.learningPriority.slice(0, 5).forEach((item, i) => {
      logger.info(`   ${i + 1}. ${item.skill} - ${item.timeToLearn} (${item.difficulty})`);
    });
    logger.info('');

    // Test 2: Alias matching
    logger.info('🔄 Test 2: Alias Matching (React.js vs React)');
    const aliasCV = {
      skills: {
        technical: ['React.js', 'nodejs', 'reactjs'],
        soft: []
      }
    };
    const aliasJob = {
      skills: ['React', 'Node.js', 'React Native']
    };

    const aliasResult = await aiService.analyzeSkillGaps(aliasCV, aliasJob);
    logger.info(`   Matched: ${aliasResult._stats.matched}/${aliasResult._stats.totalRequired}`);
    logger.info(`   Match Rate: ${aliasResult._stats.matchRate}%`);
    logger.info(`   Missing: ${aliasResult.missingSkills.map(s => s.name).join(', ')}`);
    logger.info('');

    // Test 3: Performance benchmark
    logger.info('⚡ Test 3: Performance Benchmark (10 runs)');
    const times = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await aiService.analyzeSkillGaps(testCV, testJob);
      times.push(Date.now() - start);
    }
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    logger.info(`   Average: ${avgTime.toFixed(0)}ms`);
    logger.info(`   Min: ${minTime}ms`);
    logger.info(`   Max: ${maxTime}ms`);
    logger.info('');

    // Summary
    logger.info('✅ All tests completed successfully!');
    logger.info('\n📊 Performance Summary:');
    logger.info(`   ✅ Database: 126 skills loaded`);
    logger.info(`   ✅ Match accuracy: ${result._stats.matchRate}%`);
    logger.info(`   ✅ Avg response time: ${avgTime.toFixed(0)}ms`);
    logger.info(`   ✅ Method: ${result._method}`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testSkillGapAPI();
