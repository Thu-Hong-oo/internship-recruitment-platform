/**
 * Test script để verify skill gap analysis fix
 * 
 * Test case:
 * - Candidate profile có skills (soft skills only)
 * - Job không có skills (empty array)
 * - Job title: "Nhân viên chứng từ" (accounting category)
 * 
 * Expected behavior:
 * - Auto-generate required skills cho accounting job
 * - Compare với candidate skills
 * - Return missing skills (accounting-specific skills)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { getSelfSufficientAIService } = require('./src/services/ai/selfSufficientAIService');

// Mock candidate data (giống real data từ user)
const mockCandidateProfile = {
  skills: {
    technical: [], // Empty technical skills
    soft: [
      { name: 'Giao tiếp', level: 'intermediate' },
      { name: 'Làm việc nhóm', level: 'intermediate' },
      { name: 'Kiểm tra, quản lý, lưu trữ hồ sơ', level: 'intermediate' },
      { name: 'Quản lý thời gian', level: 'intermediate' }
    ],
    languages: []
  },
  experience: [
    {
      company: 'Công ty TNHH Dịch vụ giao nhận Vận tải Hoà Phát',
      position: 'Thực tập sinh',
      description: 'Tìm hiểu quy trình xử lý lô hàng xuất nhập khẩu và các chức từ liên quan: Hợp đồng, Invoice, Packing List, C/O...',
      startDate: '2024-11',
      endDate: '2025-03'
    }
  ],
  education: [
    {
      institution: 'Đại học Sài Gòn',
      degree: 'Tốt nghiệp',
      field: 'Kinh doanh quốc tế',
      graduationYear: 2025
    }
  ]
};

// Mock job data (empty skills)
const mockJobData = {
  title: 'Nhân viên chứng từ',
  description: 'Vị trí: Nhân viên chứng từ',
  skills: [] // Empty skills array
};

async function testSkillGapAnalysis() {
  try {
    console.log('🧪 Testing Skill Gap Analysis Fix...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get AI service
    const selfSufficientAI = getSelfSufficientAIService();

    // Convert profile to cvData format (simulate controller logic)
    const convertedCvData = {
      skills: {
        technical: mockCandidateProfile.skills?.technical || [],
        soft: mockCandidateProfile.skills?.soft || [],
        languages: mockCandidateProfile.skills?.languages || []
      },
      experience: mockCandidateProfile.experience || [],
      education: mockCandidateProfile.education || []
    };

    console.log('📋 Candidate Skills:', {
      technical: convertedCvData.skills.technical.length,
      soft: convertedCvData.skills.soft.map(s => s.name),
      languages: convertedCvData.skills.languages.length
    });
    console.log('\n📋 Job Data:', {
      title: mockJobData.title,
      skills: mockJobData.skills.length
    });
    console.log('\n');

    // Run skill gap analysis
    console.log('🔬 Running skill gap analysis...\n');
    const result = await selfSufficientAI.analyzeSkillGaps(convertedCvData, mockJobData);

    // Display results
    console.log('📊 Results:\n');
    console.log('Method:', result._method);
    console.log('Overall Gap Level:', result.overallGapLevel);
    console.log('\n📈 Statistics:', result._stats);
    
    console.log('\n❌ Missing Skills:', result.missingSkills.length);
    result.missingSkills.forEach((skill, i) => {
      console.log(`  ${i + 1}. ${skill.name} (${skill.category}) - Importance: ${skill.importance}`);
    });

    console.log('\n✅ Strong Skills:', result.strongSkills.length);
    result.strongSkills.forEach((skill, i) => {
      console.log(`  ${i + 1}. ${skill.name} - Relevance: ${skill.relevance}`);
    });

    console.log('\n📚 Learning Priority:', result.learningPriority.length);
    result.learningPriority.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.skill} - Priority: ${item.priority}, Time: ${item.timeToLearn}, Difficulty: ${item.difficulty}`);
    });

    // Verify expectations
    console.log('\n✅ Test Verification:');
    if (result.missingSkills.length > 0) {
      console.log('✅ SUCCESS: Missing skills identified (auto-generated from job title)');
    } else {
      console.log('❌ FAIL: No missing skills identified');
    }

    if (result._stats.totalRequired > 0) {
      console.log(`✅ SUCCESS: Required skills auto-generated (${result._stats.totalRequired} skills)`);
    } else {
      console.log('❌ FAIL: No required skills generated');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run test
testSkillGapAnalysis()
  .then(() => {
    console.log('\n🎉 Test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
