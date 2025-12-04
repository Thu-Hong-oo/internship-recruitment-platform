const axios = require('axios');

async function testRoadmapWithCVData() {
  try {
    console.log('🧪 Testing Learning Roadmap RAG API with cvData (bypass profile)...\n');

    // Mock IT CV data (không cần candidateId)
    const testCases = [
      {
        name: 'Junior Frontend Developer',
        payload: {
          cvData: {
            currentLevel: 'beginner',
            skills: {
              technical: ['HTML', 'CSS', 'JavaScript'],
              soft: ['Communication', 'Teamwork', 'Problem Solving']
            },
            experience: [
              {
                title: 'Intern Frontend Developer',
                company: 'ABC Company',
                duration: '3 months',
                description: 'Built simple web pages using HTML/CSS/JS'
              }
            ]
          },
          targetRole: 'Frontend Developer',
          timeframe: '3 months'
        }
      },
      {
        name: 'Junior Backend Developer',
        payload: {
          cvData: {
            currentLevel: 'beginner',
            skills: {
              technical: ['JavaScript', 'Node.js', 'Express'],
              soft: ['Teamwork', 'Learning']
            },
            experience: [
              {
                title: 'Backend Intern',
                company: 'XYZ Corp',
                duration: '2 months',
                description: 'Learned Node.js and Express basics'
              }
            ]
          },
          targetRole: 'Backend Developer',
          timeframe: '6 months'
        }
      },
      {
        name: 'Career Switcher to Full Stack',
        payload: {
          cvData: {
            currentLevel: 'beginner',
            skills: {
              technical: ['HTML', 'CSS', 'Basic JavaScript'],
              soft: ['Communication', 'Project Management', 'Time Management']
            },
            experience: [
              {
                title: 'Business Analyst',
                company: 'ABC Corp',
                duration: '2 years',
                description: 'Analyzed business requirements, worked with development team'
              }
            ]
          },
          targetRole: 'Full Stack Developer',
          timeframe: '12 months'
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
            timeout: 60000 // 60s timeout for AI processing
          }
        );

        if (response.data.success) {
          console.log('✅ SUCCESS!');
          console.log(`\n📊 Roadmap Overview:`);
          console.log(`   - Target Role: ${response.data.data.targetRole}`);
          console.log(`   - Skill Gaps: ${response.data.data.skillGaps?.length || 0}`);
          console.log(`   - Phases: ${response.data.data.phases?.length || 0}`);
          console.log(`   - Estimated Duration: ${response.data.data.estimatedDuration}`);
          console.log(`   - Current Level: ${response.data.data.currentLevel}`);
          console.log(`   - Target Level: ${response.data.data.targetLevel}`);
          
          if (response.data.data.skillGaps && response.data.data.skillGaps.length > 0) {
            console.log(`\n🎯 Skill Gaps (Top 10):`);
            response.data.data.skillGaps.slice(0, 10).forEach((gap, idx) => {
              console.log(`   ${idx + 1}. ${gap.skill} (${gap.importance}, priority: ${gap.priority})`);
            });
          }

          if (response.data.data.phases && response.data.data.phases.length > 0) {
            console.log(`\n📚 Learning Phases:`);
            response.data.data.phases.forEach(phase => {
              console.log(`\n   Phase ${phase.phaseNumber}: ${phase.name} (${phase.duration})`);
              console.log(`      Learning Objectives: ${phase.learningObjectives?.length || 0}`);
              if (phase.learningObjectives && phase.learningObjectives.length > 0) {
                phase.learningObjectives.slice(0, 3).forEach(obj => {
                  console.log(`         - ${obj}`);
                });
              }
              console.log(`      Weeks: ${phase.weeks?.length || 0}`);
            });
          }

          if (response.data.data.credibilityMetrics) {
            const metrics = response.data.data.credibilityMetrics;
            console.log(`\n📈 Credibility Metrics:`);
            console.log(`   - Quality Score: ${metrics.qualityScore}/100`);
            console.log(`   - Diversity Score: ${metrics.diversityScore}/100`);
            console.log(`   - Official Content: ${metrics.officialContent}%`);
            console.log(`   - Practical Content: ${metrics.practicalContent}%`);
          }

          console.log(`\n💾 Roadmap ID: ${response.data.data._id}`);
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
          console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
          if (error.response.data?.details) {
            console.log(`   Details:`, JSON.stringify(error.response.data.details, null, 2));
          }
          if (error.response.data?.error) {
            console.log(`   Error: ${error.response.data.error}`);
          }
        } else {
          console.log(`   Error: ${error.message}`);
        }
      }

      // Wait 2s between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '='.repeat(70));
    console.log('🏁 All tests completed!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run test
testRoadmapWithCVData();
