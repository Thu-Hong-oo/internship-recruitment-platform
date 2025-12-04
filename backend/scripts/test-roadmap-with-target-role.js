const axios = require('axios');

async function testRoadmapWithTargetRole() {
  try {
    console.log('🧪 Testing Learning Roadmap RAG API with targetRole...\n');

    const candidateId = '68da2e6362b86d4ab4daff7b';
    
    // Test cases with different target roles
    const testCases = [
      {
        name: 'Frontend Developer (tiếng Anh)',
        payload: {
          candidateId,
          targetRole: 'Frontend Developer',
          timeframe: '3 months'
        }
      },
      {
        name: 'Backend Developer (tiếng Anh)',
        payload: {
          candidateId,
          targetRole: 'Backend Developer',
          timeframe: '6 months'
        }
      },
      {
        name: 'Full Stack Developer (tiếng Anh)',
        payload: {
          candidateId,
          targetRole: 'Full Stack Developer',
          timeframe: '6 months'
        }
      },
      {
        name: 'DevOps Engineer (tiếng Anh)',
        payload: {
          candidateId,
          targetRole: 'DevOps Engineer',
          timeframe: '4 months'
        }
      },
      {
        name: 'Data Analyst (tiếng Anh)',
        payload: {
          candidateId,
          targetRole: 'Data Analyst',
          timeframe: '3 months'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📋 Test: ${testCase.name}`);
      console.log(`${'='.repeat(70)}\n`);

      try {
        const response = await axios.post(
          'http://localhost:3000/api/nlp/learning-roadmap-rag',
          testCase.payload,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        if (response.data.success) {
          console.log('✅ SUCCESS!');
          console.log(`\n📊 Roadmap Overview:`);
          console.log(`   - Target Role: ${response.data.data.targetRole}`);
          console.log(`   - Skill Gaps: ${response.data.data.skillGaps?.length || 0}`);
          console.log(`   - Phases: ${response.data.data.phases?.length || 0}`);
          console.log(`   - Estimated Duration: ${response.data.data.estimatedDuration}`);
          
          if (response.data.data.skillGaps && response.data.data.skillGaps.length > 0) {
            console.log(`\n🎯 Top 5 Skill Gaps:`);
            response.data.data.skillGaps.slice(0, 5).forEach((gap, idx) => {
              console.log(`   ${idx + 1}. ${gap.skill} (${gap.importance}, priority: ${gap.priority})`);
            });
          }

          if (response.data.data.phases && response.data.data.phases.length > 0) {
            console.log(`\n📚 Phases:`);
            response.data.data.phases.forEach(phase => {
              console.log(`   Phase ${phase.phaseNumber}: ${phase.name} (${phase.duration})`);
              console.log(`      - Objectives: ${phase.learningObjectives?.length || 0}`);
              console.log(`      - Weeks: ${phase.weeks?.length || 0}`);
            });
          }

          if (response.data.data.credibilityMetrics) {
            const metrics = response.data.data.credibilityMetrics;
            console.log(`\n📈 Credibility Metrics:`);
            console.log(`   - Quality Score: ${metrics.qualityScore}/100`);
            console.log(`   - Diversity Score: ${metrics.diversityScore}/100`);
            console.log(`   - Official Content: ${metrics.officialContent}%`);
          }
        } else {
          console.log('❌ FAILED!');
          console.log(`   Message: ${response.data.message}`);
          if (response.data.details) {
            console.log(`   Details:`, JSON.stringify(response.data.details, null, 2));
          }
        }
      } catch (error) {
        console.log('❌ ERROR!');
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Message: ${error.response.data.message}`);
          if (error.response.data.details) {
            console.log(`   Details:`, JSON.stringify(error.response.data.details, null, 2));
          }
        } else {
          console.log(`   Error: ${error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🏁 All tests completed!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testRoadmapWithTargetRole();
