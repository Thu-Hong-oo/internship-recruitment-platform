const axios = require('axios');

async function testRoadmapMetrics() {
  try {
    console.log('🧪 Testing learning roadmap API...');
    
    const response = await axios.post('http://localhost:3000/api/nlp/learning-roadmap', {
      candidateId: '675e8a41fb6068fb80971f65',
      jobId: '677b5a0ed3eff8fc71a6f654'
    });

    console.log('\n📊 Credibility Metrics:');
    console.log(JSON.stringify(response.data.credibilityMetrics, null, 2));
    
    console.log('\n📈 Summary:');
    console.log(`Total Resources: ${response.data.totalResources}`);
    console.log(`Total Phases: ${response.data.phases.length}`);
    
    // Count resources per phase
    response.data.phases.forEach((phase, idx) => {
      const resourceCount = phase.skills.reduce((sum, skill) => sum + skill.resources.length, 0);
      console.log(`Phase ${idx + 1}: ${resourceCount} resources across ${phase.skills.length} skills`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRoadmapMetrics();
