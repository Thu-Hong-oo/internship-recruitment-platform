/**
 * 🔬 Test Script: So Sánh RAG vs Weighted Scoring
 * 
 * Usage:
 *   node test-rag-comparison.js <jobId>
 * 
 * So sánh kết quả giữa:
 * - Weighted Scoring (không RAG)
 * - RAG-Enhanced (có RAG)
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Test credentials
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

async function getRecommendations(jobId, token, useRAG = false) {
  try {
    // Use different endpoints based on RAG
    if (useRAG) {
      // RAG endpoint
      const res = await axios.post(
        `${BASE_URL}/api/ai/candidate-recommendations`,
        {
          jobId,
          limit: 20,
          minScore: 40,
          useRAG: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } else {
      // Weighted only endpoint
      const res = await axios.get(
        `${BASE_URL}/api/nlp/top-candidates/${jobId}?limit=20&minScore=40`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    }
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

function analyzeResults(data, method) {
  if (!data || !data.success) {
    return null;
  }

  const candidates = data.data?.candidates || data.data?.recommendations || [];
  
  const analysis = {
    method,
    total: candidates.length,
    scores: candidates.map(c => c.overallScore || c.matchScore || c.score || 0),
    tiers: candidates.map(c => c.tier || c.ranking?.tier || 'N/A'),
    avgScore: 0,
    maxScore: 0,
    minScore: 0,
    tierDistribution: {},
    semanticScores: [],
    hiddenGems: 0,
    hasSemantic: false
  };

  if (analysis.scores.length > 0) {
    analysis.avgScore = Math.round(
      analysis.scores.reduce((a, b) => a + b, 0) / analysis.scores.length
    );
    analysis.maxScore = Math.max(...analysis.scores);
    analysis.minScore = Math.min(...analysis.scores);
  }

  // Tier distribution
  analysis.tiers.forEach(tier => {
    analysis.tierDistribution[tier] = (analysis.tierDistribution[tier] || 0) + 1;
  });

  // Check for RAG features
  candidates.forEach(c => {
    if (c.semanticScore !== undefined) {
      analysis.hasSemantic = true;
      analysis.semanticScores.push(c.semanticScore);
    }
    if (c.isHiddenGem) {
      analysis.hiddenGems++;
    }
  });

  return analysis;
}

function compareResults(weighted, rag) {
  log('\n📊 So Sánh Kết Quả:', 'cyan');
  log('═'.repeat(60), 'cyan');

  if (!weighted || !rag) {
    log('⚠️  Không thể so sánh - thiếu dữ liệu', 'yellow');
    return;
  }

  // Total candidates
  log(`\n📋 Tổng số candidates:`, 'yellow');
  log(`   Weighted: ${weighted.total}`, weighted.total > rag.total ? 'green' : 'reset');
  log(`   RAG:      ${rag.total}`, rag.total > weighted.total ? 'green' : 'reset');
  log(`   Chênh lệch: ${rag.total - weighted.total}`, 
      rag.total > weighted.total ? 'green' : rag.total < weighted.total ? 'red' : 'yellow');

  // Average score
  log(`\n📈 Điểm trung bình:`, 'yellow');
  log(`   Weighted: ${weighted.avgScore}%`, weighted.avgScore > rag.avgScore ? 'green' : 'reset');
  log(`   RAG:      ${rag.avgScore}%`, rag.avgScore > weighted.avgScore ? 'green' : 'reset');
  log(`   Chênh lệch: ${rag.avgScore - weighted.avgScore}%`, 
      rag.avgScore > weighted.avgScore ? 'green' : rag.avgScore < weighted.avgScore ? 'red' : 'yellow');

  // Score range
  log(`\n🎯 Phạm vi điểm:`, 'yellow');
  log(`   Weighted: ${weighted.minScore}% - ${weighted.maxScore}%`);
  log(`   RAG:      ${rag.minScore}% - ${rag.maxScore}%`);

  // Tier distribution
  log(`\n🏆 Phân bố Tier:`, 'yellow');
  const allTiers = new Set([...Object.keys(weighted.tierDistribution), ...Object.keys(rag.tierDistribution)]);
  allTiers.forEach(tier => {
    const wCount = weighted.tierDistribution[tier] || 0;
    const rCount = rag.tierDistribution[tier] || 0;
    log(`   Tier ${tier}: Weighted=${wCount}, RAG=${rCount}`, 
        rCount > wCount ? 'green' : rCount < wCount ? 'red' : 'reset');
  });

  // RAG-specific features
  if (rag.hasSemantic) {
    log(`\n🧠 RAG Features:`, 'magenta');
    log(`   ✅ Semantic similarity enabled`);
    log(`   ✅ Hidden gems found: ${rag.hiddenGems}`);
    if (rag.semanticScores.length > 0) {
      const avgSemantic = (rag.semanticScores.reduce((a, b) => a + b, 0) / rag.semanticScores.length).toFixed(3);
      log(`   ✅ Average semantic score: ${avgSemantic}`);
    }
  } else {
    log(`\n⚠️  RAG Features:`, 'yellow');
    log(`   ❌ Semantic similarity not detected`);
    log(`   💡 Check if RAG is actually enabled`);
  }

  // Winner
  log(`\n🏅 Kết Luận:`, 'cyan');
  let winner = 'Tie';
  let reasons = [];

  if (rag.total > weighted.total) {
    winner = 'RAG';
    reasons.push(`Tìm được nhiều candidates hơn (+${rag.total - weighted.total})`);
  } else if (weighted.total > rag.total) {
    winner = 'Weighted';
    reasons.push(`Tìm được nhiều candidates hơn (+${weighted.total - rag.total})`);
  }

  if (rag.avgScore > weighted.avgScore) {
    winner = 'RAG';
    reasons.push(`Điểm trung bình cao hơn (+${rag.avgScore - weighted.avgScore}%)`);
  } else if (weighted.avgScore > rag.avgScore) {
    if (winner !== 'Weighted') winner = 'Tie';
    reasons.push(`Điểm trung bình cao hơn (+${weighted.avgScore - rag.avgScore}%)`);
  }

  if (rag.hiddenGems > 0) {
    winner = 'RAG';
    reasons.push(`Tìm được ${rag.hiddenGems} hidden gems`);
  }

  if (winner === 'RAG') {
    log(`   ✅ RAG chính xác hơn!`, 'green');
    reasons.forEach(r => log(`      - ${r}`, 'green'));
  } else if (winner === 'Weighted') {
    log(`   ⚠️  Weighted tốt hơn trong trường hợp này`, 'yellow');
    reasons.forEach(r => log(`      - ${r}`, 'yellow'));
  } else {
    log(`   ⚖️  Kết quả tương đương`, 'yellow');
  }
}

async function main() {
  log('🔬 RAG vs Weighted Scoring Comparison Test\n', 'blue');

  const jobId = process.argv[2] || process.env.TEST_JOB_ID;
  
  if (!jobId) {
    log('❌ Please provide job ID:', 'red');
    log('   Usage: node test-rag-comparison.js <jobId>', 'yellow');
    process.exit(1);
  }

  log(`📋 Job ID: ${jobId}\n`, 'blue');

  // Login
  log('📝 Logging in as employer...', 'yellow');
  const token = await login(TEST_EMPLOYER.email, TEST_EMPLOYER.password);
  
  if (!token) {
    log('❌ Cannot proceed without token', 'red');
    process.exit(1);
  }

  // Test Weighted Scoring
  log('\n🧪 Testing Weighted Scoring (No RAG)...', 'blue');
  const weightedData = await getRecommendations(jobId, token, false);
  const weightedAnalysis = analyzeResults(weightedData, 'Weighted');

  if (weightedAnalysis) {
    log(`✅ Found ${weightedAnalysis.total} candidates`, 'green');
    log(`   Average score: ${weightedAnalysis.avgScore}%`);
  }

  // Test RAG-Enhanced
  log('\n🧪 Testing RAG-Enhanced...', 'blue');
  const ragData = await getRecommendations(jobId, token, true);
  const ragAnalysis = analyzeResults(ragData, 'RAG');

  if (ragAnalysis) {
    log(`✅ Found ${ragAnalysis.total} candidates`, 'green');
    log(`   Average score: ${ragAnalysis.avgScore}%`);
    if (ragAnalysis.hasSemantic) {
      log(`   ✅ Semantic similarity enabled`, 'green');
    }
  } else {
    log('⚠️  RAG may not be enabled or endpoint not available', 'yellow');
    log('💡 Check ENABLE_RAG_RECOMMENDATIONS in .env', 'yellow');
  }

  // Compare
  if (weightedAnalysis && ragAnalysis) {
    compareResults(weightedAnalysis, ragAnalysis);
  } else {
    log('\n⚠️  Cannot compare - missing data', 'yellow');
    if (!weightedAnalysis) log('   Weighted scoring failed', 'red');
    if (!ragAnalysis) log('   RAG scoring failed', 'red');
  }

  log('\n✅ Test completed!', 'green');
}

if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { compareResults, analyzeResults };

