/**
 * 🔍 RAG Debug Script
 * 
 * Check xem RAG có hoạt động không
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_EMPLOYER = {
  email: 'cavangtrongboibenuoc@gmail.com',
  password: 'password123'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login(email, password) {
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });
    return res.data.token || res.data.data?.token;
  } catch (error) {
    log(`❌ Login failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testRAGEndpoint(jobId, token) {
  log('\n🔍 Testing RAG Endpoint...', 'blue');
  
  try {
    log('📤 Request:', 'yellow');
    log(`   POST /api/ai/candidate-recommendations`, 'cyan');
    log(`   Body: { jobId: "${jobId}", limit: 20, minScore: 30, useRAG: true }`, 'cyan');
    
    const res = await axios.post(
      `${BASE_URL}/api/ai/candidate-recommendations`,
      {
        jobId,
        limit: 20,
        minScore: 30,
        useRAG: true
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    log('\n📥 Response:', 'yellow');
    log(`   Status: ${res.status}`, res.status === 200 ? 'green' : 'red');
    log(`   Success: ${res.data.success}`, res.data.success ? 'green' : 'red');
    
    if (res.data.success) {
      const recommendations = res.data.data?.recommendations || [];
      log(`   Recommendations: ${recommendations.length}`, recommendations.length > 0 ? 'green' : 'yellow');
      
      if (recommendations.length > 0) {
        const first = recommendations[0];
        log(`\n📋 First recommendation:`, 'yellow');
        log(`   - Method: ${first.method || 'N/A'}`, first.method === 'rag-hybrid' ? 'green' : 'yellow');
        log(`   - Score: ${first.matchScore || first.overallScore || 'N/A'}%`);
        log(`   - Semantic Score: ${first.semanticScore || 'N/A'}`, first.semanticScore ? 'green' : 'yellow');
        log(`   - Is Hidden Gem: ${first.isHiddenGem || false}`, first.isHiddenGem ? 'green' : 'reset');
      }
      
      // Check metadata
      if (res.data.data?.metadata) {
        log(`\n📊 Metadata:`, 'yellow');
        log(`   - Method: ${res.data.data.metadata.method || 'N/A'}`, 
            res.data.data.metadata.method === 'rag-hybrid' ? 'green' : 'yellow');
        log(`   - Weighted Filtered: ${res.data.data.metadata.weightedFiltered || 'N/A'}`);
        log(`   - Semantic Reranked: ${res.data.data.metadata.semanticReranked || 'N/A'}`);
        log(`   - Final Count: ${res.data.data.metadata.finalCount || 'N/A'}`);
      }
    } else {
      log(`   Message: ${res.data.message}`, 'red');
    }
    
    return res.data;
  } catch (error) {
    log(`\n❌ Error:`, 'red');
    log(`   Status: ${error.response?.status || 'N/A'}`, 'red');
    log(`   Message: ${error.response?.data?.message || error.message}`, 'red');
    
    if (error.response?.data) {
      log(`\n📋 Full Response:`, 'yellow');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    
    return null;
  }
}

async function checkServerEnv() {
  log('\n🔍 Checking Server Environment...', 'blue');
  
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    log(`✅ Server is running`, 'green');
    log(`   Health: ${res.status === 200 ? 'OK' : 'Unknown'}`, res.status === 200 ? 'green' : 'yellow');
    return true;
  } catch (error) {
    log(`❌ Server not responding: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🔍 RAG Debug Script\n', 'blue');

  const jobId = process.argv[2] || process.env.TEST_JOB_ID;
  
  if (!jobId) {
    log('❌ Please provide job ID:', 'red');
    log('   Usage: node test-rag-debug.js <jobId>', 'yellow');
    process.exit(1);
  }

  log(`📋 Job ID: ${jobId}\n`, 'blue');

  // Check server
  const serverOk = await checkServerEnv();
  if (!serverOk) {
    log('\n❌ Cannot proceed - server not running', 'red');
    process.exit(1);
  }

  // Login
  log('\n📝 Logging in...', 'yellow');
  const token = await login(TEST_EMPLOYER.email, TEST_EMPLOYER.password);
  
  if (!token) {
    log('❌ Cannot proceed without token', 'red');
    process.exit(1);
  }

  // Test RAG endpoint
  const result = await testRAGEndpoint(jobId, token);

  // Analysis
  log('\n📊 Analysis:', 'cyan');
  
  if (!result) {
    log('❌ No response received', 'red');
    log('💡 Check:', 'yellow');
    log('   1. Server logs for errors', 'yellow');
    log('   2. ENABLE_RAG_RECOMMENDATIONS=true in .env', 'yellow');
    log('   3. Server restarted after adding env var', 'yellow');
  } else if (!result.success) {
    log(`❌ Request failed: ${result.message}`, 'red');
  } else {
    const recommendations = result.data?.recommendations || [];
    const method = result.data?.method || result.data?.metadata?.method;
    
    if (recommendations.length === 0) {
      log('⚠️  No candidates returned', 'yellow');
      log('💡 Possible reasons:', 'yellow');
      log('   1. Freshness filter (candidates > 90 days old)', 'yellow');
      log('   2. Semantic threshold too high (0.70)', 'yellow');
      log('   3. No candidates match minScore (40)', 'yellow');
      log('   4. RAG service error (check logs)', 'yellow');
    } else {
      if (method === 'rag-hybrid') {
        log('✅ RAG is working!', 'green');
        log(`   Found ${recommendations.length} candidates with RAG`, 'green');
      } else {
        log('⚠️  RAG may not be enabled', 'yellow');
        log(`   Method: ${method || 'weighted-only'}`, 'yellow');
        log('💡 Check ENABLE_RAG_RECOMMENDATIONS in .env', 'yellow');
      }
    }
  }

  log('\n✅ Debug completed!', 'green');
}

if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testRAGEndpoint };

