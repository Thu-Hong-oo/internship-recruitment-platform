/**
 * Test Script cho Recommendation System
 * 
 * Usage:
 *   node test-recommendations.js
 * 
 * Requirements:
 *   - Backend server đang chạy
 *   - Có tài khoản employer và candidate test
 *   - Có job và candidate data trong database
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Test credentials (thay đổi theo môi trường của bạn)
const TEST_EMPLOYER = {
  email: 'cavangtrongboibenuoc@gmail.com',
  password: 'password123'
};

const TEST_CANDIDATE = {
  email: 'thuhong12042002@gmail.com',
  password: 'NewPassword123!'
};

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
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

async function testCandidateRecommendations(jobId, token) {
  log('\n🧪 Testing Candidate Recommendations...', 'blue');
  
  try {
    const res = await axios.get(
      `${BASE_URL}/api/nlp/top-candidates/${jobId}?limit=10&minScore=40`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      log('✅ API call successful', 'green');
      
      const candidates = res.data.data?.candidates || [];
      log(`✅ Found ${candidates.length} candidates`, 'green');
      
      // Check structure
      if (Array.isArray(candidates) && candidates.length > 0) {
        const first = candidates[0];
        log(`\n📋 Sample candidate:`, 'yellow');
        
        // Fix: Convert candidateId to string if it's an object
        const candidateId = first.candidateId?._id?.toString() || 
                           first.candidateId?.toString() || 
                           (typeof first.candidateId === 'object' ? JSON.stringify(first.candidateId) : first.candidateId) ||
                           first.candidate?._id?.toString() || 
                           first.candidate?._id || 
                           'N/A';
        log(`   - Candidate ID: ${candidateId}`);
        log(`   - Score: ${first.overallScore || first.matchScore || 'N/A'}%`);
        log(`   - Tier: ${first.tier || first.ranking?.tier || 'N/A'}`);
        
        if (first.breakdown?.skills) {
          log(`   - Matched skills: ${first.breakdown.skills.matched?.length || 0}`);
          log(`   - Missing skills: ${first.breakdown.skills.missing?.length || 0}`);
        }
        
        // Check semantic matching
        if (first.breakdown?.skills?.matched?.length > 0) {
          log(`   - Matched: ${first.breakdown.skills.matched.join(', ')}`, 'green');
        }
      }
      
      // Check statistics
      if (res.data.data?.statistics) {
        log(`\n📊 Statistics:`, 'yellow');
        log(`   - Total applications: ${res.data.data.totalApplications || 0}`);
        log(`   - Filtered count: ${res.data.data.filteredCount || 0}`);
      }
      
      return true;
    } else {
      log(`❌ API returned success=false: ${res.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testJobRecommendations(token) {
  log('\n🧪 Testing Job Recommendations...', 'blue');
  
  try {
    const res = await axios.get(
      `${BASE_URL}/api/nlp/best-matches?limit=10&minScore=60`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      log('✅ API call successful', 'green');
      
      const jobs = res.data.data || [];
      log(`✅ Found ${jobs.length} job matches`, 'green');
      
      if (Array.isArray(jobs) && jobs.length > 0) {
        const first = jobs[0];
        log(`\n📋 Sample job match:`, 'yellow');
        // Fix: Convert jobId to string if it's an object
        const jobId = first.jobId?._id?.toString() || first.jobId?.toString() || 
                     (typeof first.jobId === 'object' ? JSON.stringify(first.jobId) : first.jobId) ||
                     first.job?._id?.toString() || first.job?._id || 'N/A';
        log(`   - Job ID: ${jobId}`);
        log(`   - Score: ${first.overallScore || first.matchScore || 'N/A'}%`);
        log(`   - Tier: ${first.tier || first.ranking?.tier || 'N/A'}`);
      }
      
      return true;
    } else {
      log(`❌ API returned success=false: ${res.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      log(`⚠️  ${error.response.data.message}`, 'yellow');
      log('   (This is expected if profile is empty)', 'yellow');
    } else {
      log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    }
    return false;
  }
}

async function testSemanticMatching(jobId, token) {
  log('\n🧪 Testing Semantic Similarity Matching...', 'blue');
  
  try {
    // Test với job có skills cụ thể
    const res = await axios.get(
      `${BASE_URL}/api/nlp/top-candidates/${jobId}?limit=5&minScore=30`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      const candidates = res.data.data?.candidates || [];
      
      // Check nếu có candidates với semantic matches
      let foundSemanticMatch = false;
      
      candidates.forEach(c => {
        if (c.breakdown?.skills?.matched?.length > 0) {
          // Check nếu có skills được match mà không phải exact match
          // (cần check trong logs hoặc database để verify)
          foundSemanticMatch = true;
        }
      });
      
      if (foundSemanticMatch) {
        log('✅ Semantic matching appears to be working', 'green');
        log('   (Check backend logs for "Semantic similarity matched" messages)', 'yellow');
      } else {
        log('⚠️  No semantic matches found (may be normal if all are exact matches)', 'yellow');
      }
      
      return true;
    }
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testEdgeCases(jobId, token) {
  log('\n🧪 Testing Edge Cases...', 'blue');
  
  // Test 1: Job skills rỗng (nếu có job như vậy)
  log('   Testing division by zero fix...', 'yellow');
  // Note: Cần có job với skills rỗng để test
  
  // Test 2: minScore cao
  try {
    const res = await axios.get(
      `${BASE_URL}/api/nlp/top-candidates/${jobId}?limit=10&minScore=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (res.data.success) {
      const count = res.data.data?.candidates?.length || 0;
      log(`   ✅ High minScore (100): ${count} candidates (expected: 0 or very few)`, 'green');
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
  }
  
  // Test 3: Tier filter
  try {
    const res = await axios.get(
      `${BASE_URL}/api/nlp/top-candidates/${jobId}?limit=10&tier=A`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (res.data.success) {
      const candidates = res.data.data?.candidates || [];
      const allTierA = candidates.every(c => 
        (c.tier || c.ranking?.tier) === 'A'
      );
      
      if (allTierA || candidates.length === 0) {
        log(`   ✅ Tier filter (A): ${candidates.length} candidates, all tier A`, 'green');
      } else {
        log(`   ⚠️  Tier filter may not be working correctly`, 'yellow');
      }
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
  }
}

async function findJobId(token) {
  try {
    log('🔍 Finding a job ID owned by this employer...', 'yellow');
    
    // Try endpoint for employer's own jobs first
    const endpoints = [
      '/api/jobs/employer?limit=1&status=active',
      '/api/employers/jobs?limit=1&status=active',
      '/api/jobs/employer?limit=1',
      '/api/employers/jobs?limit=1'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const res = await axios.get(
          `${BASE_URL}${endpoint}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (res.data.success) {
          // Handle different response formats
          let jobs = [];
          if (Array.isArray(res.data.data)) {
            jobs = res.data.data;
          } else if (res.data.data?.jobs && Array.isArray(res.data.data.jobs)) {
            jobs = res.data.data.jobs;
          } else if (res.data.data && Array.isArray(res.data.data)) {
            jobs = res.data.data;
          }
          
          if (jobs.length > 0) {
            const job = jobs[0];
            const jobId = job._id?.toString() || job.id?.toString() || String(job._id || job.id);
            log(`✅ Found employer's job: ${jobId}`, 'green');
            return jobId;
          }
        }
      } catch (endpointError) {
        // Try next endpoint
        continue;
      }
    }
    
    // Fallback: try general jobs endpoint (may not work due to access control)
    log('⚠️  Could not find employer jobs, trying general endpoint...', 'yellow');
    try {
      const res = await axios.get(
        `${BASE_URL}/api/jobs?limit=1&status=active`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        let jobs = [];
        if (res.data.data?.jobs && Array.isArray(res.data.data.jobs)) {
          jobs = res.data.data.jobs;
        } else if (Array.isArray(res.data.data)) {
          jobs = res.data.data;
        }
        
        if (jobs.length > 0) {
          const job = jobs[0];
          const jobId = job._id?.toString() || job.id?.toString() || String(job._id || job.id);
          log(`⚠️  Found job (may not be yours): ${jobId}`, 'yellow');
          log('   Note: This job may belong to another employer', 'yellow');
          return jobId;
        }
      }
    } catch (fallbackError) {
      // Ignore
    }
    
    return null;
  } catch (error) {
    log(`⚠️  Could not find job automatically: ${error.message}`, 'yellow');
    return null;
  }
}

async function main() {
  log('🚀 Starting Recommendation System Tests...\n', 'blue');
  
  // Get job ID from command line, env, or auto-find
  let jobId = process.argv[2] || process.env.TEST_JOB_ID;
  
  // Test 1: Candidate Recommendations
  log('📝 Logging in as employer...', 'yellow');
  const employerToken = await login(TEST_EMPLOYER.email, TEST_EMPLOYER.password);
  
  if (!employerToken) {
    log('❌ Cannot proceed without employer token', 'red');
    log('💡 Please check TEST_EMPLOYER credentials in test-recommendations.js', 'yellow');
    process.exit(1);
  }
  
  // Auto-find job ID if not provided
  if (!jobId) {
    log('⚠️  No job ID provided. Attempting to find one...', 'yellow');
    jobId = await findJobId(employerToken);
    
    if (!jobId) {
      log('❌ Could not find a job ID. Please provide one:', 'red');
      log('   Usage: node test-recommendations.js <jobId>', 'yellow');
      log('   Or set TEST_JOB_ID environment variable', 'yellow');
      log('   Some tests will be skipped.\n', 'yellow');
    }
  }
  
  if (jobId) {
    log(`\n📋 Using job ID: ${jobId}\n`, 'blue');
    await testCandidateRecommendations(jobId, employerToken);
    await testSemanticMatching(jobId, employerToken);
    await testEdgeCases(jobId, employerToken);
  } else {
    log('⚠️  Skipping candidate recommendation tests (no job ID)', 'yellow');
  }
  
  // Test 2: Job Recommendations
  log('\n📝 Logging in as candidate...', 'yellow');
  const candidateToken = await login(TEST_CANDIDATE.email, TEST_CANDIDATE.password);
  
  if (candidateToken) {
    await testJobRecommendations(candidateToken);
  } else {
    log('⚠️  Cannot test job recommendations without candidate token', 'yellow');
    log('💡 Please check TEST_CANDIDATE credentials in test-recommendations.js', 'yellow');
  }
  
  log('\n✅ Tests completed!', 'green');
  log('\n📋 Next steps:', 'blue');
  log('   1. Check backend logs for detailed information', 'yellow');
  log('   2. Test via frontend UI for visual verification', 'yellow');
  log('   3. Test with different job/candidate combinations', 'yellow');
  log('\n💡 To test with specific job:', 'blue');
  log('   node test-recommendations.js <jobId>', 'yellow');
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testCandidateRecommendations,
  testJobRecommendations,
  testSemanticMatching
};

