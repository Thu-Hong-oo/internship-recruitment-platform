/**
 * 🧪 Comprehensive Skill Gap Analysis API Test
 * 
 * Test all scenarios including PhoBERT, aliases, edge cases
 * Usage: node scripts/test-skill-gap-comprehensive.js
 */

const mongoose = require('mongoose');
const { getSelfSufficientAIService } = require('../src/services/ai/selfSufficientAIService');
const phobertService = require('../src/services/phobertService');
const Skill = require('../src/models/Skill');
const { logger } = require('../src/utils/logger');

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: '1️⃣ English Frontend Developer',
    cvData: {
      skills: {
        technical: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
        soft: ['Teamwork', 'Communication']
      }
    },
    jobData: {
      title: 'Frontend Developer',
      skills: ['React', 'Vue.js', 'TypeScript', 'Docker', 'Git']
    },
    expectedMissing: ['Vue.js', 'TypeScript', 'Docker']
  },
  {
    name: '2️⃣ UI/UX Designer (Your actual test)',
    cvData: {
      skills: {
        technical: ['Prototyping', 'User Research'],
        soft: []
      }
    },
    jobData: {
      title: 'UI/UX Designer',
      skills: ['Figma', 'Adobe XD', 'Sketch', 'Design Systems', 'Prototyping', 'User Research']
    },
    expectedMissing: ['Figma', 'Adobe XD', 'Sketch', 'Design Systems']
  },
  {
    name: '3️⃣ Alias Matching Test',
    cvData: {
      skills: {
        technical: ['React.js', 'nodejs', 'mongodb'],
        soft: []
      }
    },
    jobData: {
      title: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'MongoDB']
    },
    expectedMissing: [] // Should match all via aliases
  },
  {
    name: '4️⃣ Vietnamese Text (PhoBERT test)',
    cvData: {
      skills: {
        technical: ['Java', 'Spring Boot'],
        soft: []
      }
    },
    jobData: {
      title: 'Java Developer tại Hà Nội',
      description: 'Cần Java developer có kinh nghiệm Spring Boot, MySQL, Docker',
      skills: ['Java', 'Spring Boot', 'MySQL', 'Docker']
    },
    expectedMissing: ['MySQL', 'Docker']
  },
  {
    name: '5️⃣ Empty CV (Edge case)',
    cvData: {
      skills: {
        technical: [],
        soft: []
      }
    },
    jobData: {
      title: 'Developer',
      skills: ['JavaScript', 'React']
    },
    expectedMissing: ['JavaScript', 'React']
  },
  {
    name: '6️⃣ Perfect Match',
    cvData: {
      skills: {
        technical: ['Python', 'Django', 'PostgreSQL'],
        soft: ['Agile']
      }
    },
    jobData: {
      title: 'Python Developer',
      skills: ['Python', 'Django', 'PostgreSQL', 'Agile']
    },
    expectedMissing: []
  }
];

async function runComprehensiveTest() {
  try {
    logger.info('🧪 Starting Comprehensive Skill Gap API Test\n');

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internship-platform';
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB\n');

    // Check database
    const skillCount = await Skill.countDocuments({ isActive: true });
    logger.info(`📊 Database Status: ${skillCount} active skills\n`);

    if (skillCount === 0) {
      logger.error('❌ No skills in database! Run: node scripts/seed-skills.js');
      process.exit(1);
    }

    // Check PhoBERT availability
    const phobertInfo = phobertService.getModelInfo();
    logger.info('🤖 PhoBERT Status:', phobertInfo.available ? '✅ Available' : '❌ Not Available');
    if (!phobertInfo.available) {
      logger.warn('⚠️ PhoBERT model not found. Vietnamese text will use keyword extraction only.\n');
    } else {
      logger.info('');
    }

    // Get AI service
    const aiService = getSelfSufficientAIService();

    // Run all test scenarios
    const results = [];
    
    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      const scenario = TEST_SCENARIOS[i];
      logger.info(`\n${'='.repeat(70)}`);
      logger.info(scenario.name);
      logger.info('='.repeat(70));
      
      logger.info('CV Skills:', scenario.cvData.skills.technical.join(', ') || 'None');
      logger.info('Job Requirements:', scenario.jobData.skills.join(', '));
      logger.info('Expected Missing:', scenario.expectedMissing.join(', ') || 'None');
      logger.info('');

      const startTime = Date.now();
      
      try {
        const result = await aiService.analyzeSkillGaps(scenario.cvData, scenario.jobData);
        const duration = Date.now() - startTime;

        // Analyze results
        const actualMissing = result.missingSkills.map(s => s.name.toLowerCase());
        const expectedMissingLower = scenario.expectedMissing.map(s => s.toLowerCase());
        
        const correctlyIdentified = actualMissing.filter(skill => 
          expectedMissingLower.some(exp => 
            skill === exp || skill.includes(exp) || exp.includes(skill)
          )
        ).length;
        
        const accuracy = scenario.expectedMissing.length > 0 
          ? Math.round((correctlyIdentified / scenario.expectedMissing.length) * 100)
          : (actualMissing.length === 0 ? 100 : 0);

        const testResult = {
          scenario: scenario.name,
          success: accuracy >= 80,
          accuracy: accuracy,
          duration: duration,
          stats: result._stats,
          method: result._method,
          missingSkills: actualMissing,
          expectedMissing: expectedMissingLower
        };

        results.push(testResult);

        // Display results
        logger.info(`⏱️ Duration: ${duration}ms`);
        logger.info(`📊 Method: ${result._method}`);
        logger.info(`📈 Match Rate: ${result._stats.matchRate}%`);
        logger.info(`✅ Matched: ${result._stats.matched}/${result._stats.totalRequired}`);
        logger.info(`❌ Missing: ${result._stats.missing}`);
        logger.info(`🎯 Gap Level: ${result.overallGapLevel}`);
        logger.info('');

        logger.info('Missing Skills Found:');
        result.missingSkills.forEach((skill, idx) => {
          const isExpected = expectedMissingLower.some(exp => 
            skill.name.toLowerCase() === exp || 
            skill.name.toLowerCase().includes(exp) || 
            exp.includes(skill.name.toLowerCase())
          );
          const icon = isExpected ? '✅' : '⚠️';
          logger.info(`   ${icon} ${idx + 1}. ${skill.name} (${skill.category}) - ${skill.importance}`);
        });
        logger.info('');

        logger.info(`Test Accuracy: ${accuracy}% ${accuracy >= 80 ? '✅ PASS' : '❌ FAIL'}`);

      } catch (error) {
        logger.error(`❌ Test failed:`, error.message);
        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message
        });
      }
    }

    // Final Summary
    logger.info('\n' + '='.repeat(70));
    logger.info('📊 FINAL SUMMARY');
    logger.info('='.repeat(70) + '\n');

    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    const overallSuccess = passedTests === totalTests;

    logger.info(`Tests Run: ${totalTests}`);
    logger.info(`Passed: ${passedTests} ${overallSuccess ? '✅' : '⚠️'}`);
    logger.info(`Failed: ${totalTests - passedTests}`);
    logger.info(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

    // Performance stats
    const avgDuration = results
      .filter(r => r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
    
    logger.info(`Average Response Time: ${avgDuration.toFixed(0)}ms`);
    logger.info(`Database Skills: ${skillCount}`);
    logger.info(`PhoBERT: ${phobertInfo.available ? '✅ Available' : '❌ Not Available'}\n`);

    // Detailed results table
    logger.info('Detailed Results:');
    results.forEach((result, idx) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      logger.info(`   ${idx + 1}. ${result.scenario}: ${status}`);
      if (result.duration) {
        logger.info(`      Duration: ${result.duration}ms, Accuracy: ${result.accuracy}%, Match Rate: ${result.stats.matchRate}%`);
      }
      if (result.error) {
        logger.info(`      Error: ${result.error}`);
      }
    });

    logger.info('\n' + '='.repeat(70));
    
    if (overallSuccess) {
      logger.info('✅ ALL TESTS PASSED - API IS WORKING CORRECTLY!');
    } else {
      logger.warn('⚠️ SOME TESTS FAILED - CHECK RESULTS ABOVE');
    }
    logger.info('='.repeat(70) + '\n');

    process.exit(overallSuccess ? 0 : 1);

  } catch (error) {
    logger.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run comprehensive test
runComprehensiveTest();
