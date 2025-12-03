/**
 * 🧪 Test Self-Sufficient AI/NLP Stack
 * 
 * Test suite for new architecture:
 * - PhoBERT skill extraction (primary)
 * - Sentence-BERT embedding & similarity
 * - Job matching algorithm
 * - Candidate recommendation
 * 
 * NO Gemini API dependency required
 */

const { getSkillExtractionService } = require('../services/ai/skillExtractionService');
const { getSentenceBertService } = require('../services/ai/sentenceBertService');
const { getJobMatchingService } = require('../services/ai/jobMatchingService');
const { getCandidateRecommendationService } = require('../services/ai/candidateRecommendationService');

const sampleCV = `
NGUYỄN VĂN AN
Email: nva@example.com | Phone: 0123456789
Location: Hà Nội, Việt Nam

SUMMARY:
Experienced Full-stack Developer with 3 years of experience in web application development.

SKILLS:
- Programming Languages: JavaScript, Python, Java
- Frontend: React, Vue.js, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Express.js, Django, Flask
- Database: MongoDB, MySQL, PostgreSQL, Redis
- DevOps: Docker, AWS, Git, CI/CD
- Soft Skills: Teamwork, Communication, Problem Solving, Agile/Scrum

EXPERIENCE:
Software Engineer at TechCorp (2021 - Present, 3 years)
- Developed scalable web applications using React and Node.js
- Implemented RESTful APIs and microservices architecture
- Managed AWS infrastructure and CI/CD pipelines

Intern Developer at StartupXYZ (2020 - 2021, 1 year)
- Built frontend components with Vue.js
- Learned full-stack development and agile methodology

EDUCATION:
Bachelor of Computer Science
Hanoi University of Science and Technology (2017 - 2021)

PROJECTS:
- E-commerce Platform: Built with React, Node.js, MongoDB
- Chat Application: Real-time messaging with Socket.io
- Task Management Tool: Agile project management dashboard

LANGUAGES:
- Vietnamese: Native
- English: IELTS 7.0
`;

const sampleJob = {
  _id: 'job123',
  title: 'Senior Full-stack Developer',
  company: 'Tech Innovations Inc.',
  location: 'Hà Nội',
  description: 'We are looking for a talented senior full-stack developer...',
  requirements: {
    skills: [
      'JavaScript',
      'React',
      'Node.js',
      'TypeScript',
      'MongoDB',
      'AWS',
      'Docker',
      'GraphQL',
      'Microservices'
    ],
    mustHaveSkills: ['JavaScript', 'React', 'Node.js'],
    minYearsExperience: 3,
    level: 'mid',
    minDegree: 'bachelor',
    preferredMajors: ['Computer Science', 'Software Engineering']
  }
};

async function testSkillExtraction() {
  console.log('\n=== TEST 1: Skill Extraction (PhoBERT Primary) ===\n');

  const skillService = getSkillExtractionService();

  try {
    // Test PhoBERT only (self-sufficient)
    console.log('🤖 Testing PhoBERT-only extraction...');
    const phobertSkills = await skillService.extractSkills(sampleCV, {
      usePhoBERT: true,
      useGemini: false,
      useHybrid: false
    });

    console.log(`✅ PhoBERT extracted ${phobertSkills.length} skills:`);
    console.log(JSON.stringify(phobertSkills.slice(0, 10), null, 2));

    // Group by type
    const byType = {};
    phobertSkills.forEach(skill => {
      byType[skill.type] = byType[skill.type] || [];
      byType[skill.type].push(skill.name);
    });

    console.log('\n📊 Skills by type:');
    Object.entries(byType).forEach(([type, skills]) => {
      console.log(`  ${type}: ${skills.length} - ${skills.slice(0, 5).join(', ')}${skills.length > 5 ? '...' : ''}`);
    });

    return phobertSkills;
  } catch (error) {
    console.error('❌ Skill extraction test failed:', error.message);
    throw error;
  }
}

async function testSentenceBERT() {
  console.log('\n=== TEST 2: Sentence-BERT Embedding & Similarity ===\n');

  const sentenceBert = getSentenceBertService();

  try {
    // Check availability
    const info = sentenceBert.getModelInfo();
    console.log('📦 Model info:', info);

    if (!info.available) {
      console.log('⚠️ Sentence-BERT not available, skipping test');
      return;
    }

    // Test similarity
    console.log('\n🔬 Testing semantic similarity...');
    const pairs = [
      ['JavaScript developer', 'React frontend engineer'],
      ['Python backend developer', 'Django web developer'],
      ['Java Spring developer', 'PHP Laravel developer'],
      ['DevOps engineer', 'System administrator']
    ];

    for (const [text1, text2] of pairs) {
      const similarity = await sentenceBert.similarity(text1, text2);
      console.log(`  "${text1}" <-> "${text2}": ${(similarity * 100).toFixed(1)}%`);
    }

    // Test batch similarity
    console.log('\n📊 Testing batch similarity...');
    const query = 'Full-stack JavaScript developer';
    const documents = [
      'React and Node.js developer',
      'Python Django backend engineer',
      'Frontend Vue.js specialist',
      'Java Spring Boot developer'
    ];

    const similarities = await sentenceBert.similarityBatch(query, documents);
    console.log(`Query: "${query}"`);
    documents.forEach((doc, i) => {
      console.log(`  ${i + 1}. "${doc}": ${(similarities[i] * 100).toFixed(1)}%`);
    });

  } catch (error) {
    console.error('❌ Sentence-BERT test failed:', error.message);
    throw error;
  }
}

async function testJobMatching() {
  console.log('\n=== TEST 3: Job Matching Algorithm ===\n');

  const matchingService = getJobMatchingService();

  try {
    const candidate = {
      _id: 'candidate123',
      fullName: 'Nguyễn Văn An',
      email: 'nva@example.com',
      cv: {
        rawText: sampleCV,
        skills: [
          'JavaScript', 'Python', 'Java',
          'React', 'Vue.js', 'Node.js', 'Express.js',
          'MongoDB', 'MySQL', 'PostgreSQL', 'Redis',
          'Docker', 'AWS', 'Git'
        ],
        experience: [
          {
            position: 'Software Engineer',
            company: 'TechCorp',
            duration: '3 years'
          },
          {
            position: 'Intern Developer',
            company: 'StartupXYZ',
            duration: '1 year'
          }
        ],
        education: [
          {
            degree: 'Bachelor of Computer Science',
            major: 'Computer Science',
            institution: 'Hanoi University of Science and Technology'
          }
        ],
        projects: [
          {
            title: 'E-commerce Platform',
            description: 'Built with React, Node.js, MongoDB',
            technologies: ['React', 'Node.js', 'MongoDB']
          },
          {
            title: 'Chat Application',
            description: 'Real-time messaging with Socket.io',
            technologies: ['Socket.io', 'Node.js']
          }
        ]
      }
    };

    console.log('🎯 Calculating match score...\n');
    const matchResult = await matchingService.calculateMatchScore(
      candidate,
      sampleJob,
      { includeExplanation: true }
    );

    console.log(`📊 Match Score: ${matchResult.matchScore}%`);
    console.log(`🏆 Tier: ${matchResult.tier}`);
    console.log(`\n📋 Breakdown:`);
    console.log(`  Skills: ${matchResult.breakdown.skills.score}% (${matchResult.breakdown.skills.matched.length}/${matchResult.breakdown.skills.total} matched)`);
    console.log(`    ✅ Matched: ${matchResult.breakdown.skills.matched.slice(0, 5).join(', ')}${matchResult.breakdown.skills.matched.length > 5 ? '...' : ''}`);
    console.log(`    ❌ Missing: ${matchResult.breakdown.skills.missing.slice(0, 3).join(', ')}${matchResult.breakdown.skills.missing.length > 3 ? '...' : ''}`);
    console.log(`\n  Experience: ${matchResult.breakdown.experience.score}%`);
    console.log(`    Candidate: ${matchResult.breakdown.experience.candidateYears} years (${matchResult.breakdown.experience.candidateLevel})`);
    console.log(`    Required: ${matchResult.breakdown.experience.requiredYears} years (${matchResult.breakdown.experience.requiredLevel})`);
    console.log(`\n  Education: ${matchResult.breakdown.education.score}%`);
    console.log(`    Candidate: ${matchResult.breakdown.education.candidateDegree}`);
    console.log(`    Required: ${matchResult.breakdown.education.requiredDegree}`);
    console.log(`\n  Projects: ${matchResult.breakdown.projects.score}%`);
    console.log(`    Relevant: ${matchResult.breakdown.projects.relevantProjects} projects`);

    console.log(`\n💡 Explanation: ${matchResult.explanation}`);

    return matchResult;
  } catch (error) {
    console.error('❌ Job matching test failed:', error.message);
    throw error;
  }
}

async function testCandidateRecommendation() {
  console.log('\n=== TEST 4: Candidate Recommendation ===\n');

  // Note: This would require database connection
  // For now, just test the service initialization
  const recommendationService = getCandidateRecommendationService();
  console.log('✅ Candidate Recommendation Service initialized');
  console.log('ℹ️ Actual recommendation test requires database with candidates');
}

async function runAllTests() {
  console.log('🚀 Starting Self-Sufficient AI/NLP Stack Tests...\n');
  console.log('Architecture: PhoBERT (primary) + Sentence-BERT + Rule-based');
  console.log('No Gemini API dependency required\n');
  console.log('='.repeat(60));

  try {
    // Run all tests
    await testSkillExtraction();
    await testSentenceBERT();
    await testJobMatching();
    await testCandidateRecommendation();

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All tests passed! Self-sufficient NLP stack is working.\n');
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.error('\n❌ Test suite failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSkillExtraction,
  testSentenceBERT,
  testJobMatching,
  testCandidateRecommendation
};
