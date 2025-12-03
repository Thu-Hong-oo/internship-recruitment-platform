/**
 * Test PhoBERT Integration
 * Run: node src/research/testPhoBERT.js
 */

const phobertService = require('../services/phobertService');
const { getSkillExtractionService } = require('../services/ai/skillExtractionService');

// Sample CV text (Vietnamese)
const sampleCV = `
NGUYỄN VĂN A
Email: nguyenvana@gmail.com
Phone: 0123456789

KINH NGHIỆM LÀM VIỆC:
- Frontend Developer tại ABC Company (2020-2023)
  + Phát triển ứng dụng web với React, Vue.js và TypeScript
  + Sử dụng TailwindCSS, Material-UI cho giao diện
  + Tích hợp API với Node.js backend
  + Quản lý code với Git, GitHub
  
- Backend Developer tại XYZ Startup (2018-2020)
  + Xây dựng RESTful API với Express.js và MongoDB
  + Deploy ứng dụng lên AWS EC2, S3
  + Sử dụng Docker, Docker Compose
  + CI/CD với Jenkins

KỸ NĂNG:
- Ngôn ngữ: JavaScript, Python, Java, SQL
- Framework: React, Vue.js, Angular, Next.js, Django, Spring Boot
- Database: MySQL, PostgreSQL, MongoDB, Redis
- DevOps: Docker, Kubernetes, AWS, Azure, Git
- Soft skills: Teamwork, Communication, Problem Solving
- Ngôn ngữ: Tiếng Anh (IELTS 7.0), Tiếng Việt (Native)

HỌC VẤN:
- Đại học Bách Khoa TP.HCM
- Chuyên ngành: Khoa học máy tính
- GPA: 3.5/4.0
`;

async function testPhoBERTOnly() {
  console.log('\n=== TEST 1: PhoBERT Only ===\n');
  
  try {
    const skills = await phobertService.extractSkills(sampleCV);
    
    console.log('✅ PhoBERT extracted skills:');
    console.log(JSON.stringify(skills, null, 2));
    console.log(`\n📊 Total skills: ${skills.length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testHybridExtraction() {
  console.log('\n=== TEST 2: Hybrid (PhoBERT + Gemini) ===\n');
  
  try {
    const skillService = getSkillExtractionService();
    
    const skills = await skillService.extractSkills(sampleCV, {
      maxSkills: 50,
      minConfidence: 0.5,
      usePhoBERT: true,
      useGemini: true,
      useHybrid: true,
      useCache: false, // Disable cache for testing
    });
    
    console.log('✅ Hybrid extraction results:');
    console.log(JSON.stringify(skills, null, 2));
    console.log(`\n📊 Total skills: ${skills.length}`);
    
    // Group by source
    const phobertSkills = skills.filter(s => s.source === 'phobert');
    const geminiSkills = skills.filter(s => s.source === 'gemini');
    
    console.log(`\n📈 Breakdown:`);
    console.log(`   PhoBERT: ${phobertSkills.length} skills`);
    console.log(`   Gemini: ${geminiSkills.length} skills`);
    
    // Group by type
    const byType = {};
    skills.forEach(s => {
      byType[s.type] = (byType[s.type] || 0) + 1;
    });
    
    console.log(`\n📊 By Type:`);
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

async function testModelInfo() {
  console.log('\n=== TEST 3: Model Info ===\n');
  
  const info = phobertService.getModelInfo();
  console.log(JSON.stringify(info, null, 2));
}

async function runAllTests() {
  console.log('🚀 Starting PhoBERT Integration Tests...\n');
  
  await testModelInfo();
  await testPhoBERTOnly();
  await testHybridExtraction();
  
  console.log('\n✅ All tests completed!\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
