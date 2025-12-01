/**
 * Test script for Learning Roadmap Service
 * Tests the self-sufficient roadmap generation
 */

const learningRoadmapService = require('../src/services/ai/learningRoadmapService');

// Mock job data
const mockJob = {
  _id: 'test-job-123',
  title: 'Senior Full Stack Developer',
  description: `
    We are looking for a Senior Full Stack Developer with strong expertise in modern web technologies.
    
    Requirements:
    - 5+ years of experience with React and Node.js
    - Strong knowledge of TypeScript
    - Experience with MongoDB and PostgreSQL databases
    - Proficiency in Docker and Kubernetes
    - Understanding of microservices architecture
    - Experience with AWS cloud services (EC2, S3, Lambda)
    - Knowledge of GraphQL and REST APIs
    - Familiarity with CI/CD pipelines
    - Strong problem-solving skills
    
    Nice to have:
    - Experience with Redis
    - Knowledge of Nginx
    - Understanding of system design patterns
  `,
  requirements: [
    { type: 'skill', name: 'React', level: 'required', importance: 'critical' },
    { type: 'skill', name: 'Node.js', level: 'required', importance: 'critical' },
    { type: 'skill', name: 'TypeScript', level: 'required', importance: 'critical' },
    { type: 'skill', name: 'MongoDB', level: 'preferred', importance: 'important' },
    { type: 'skill', name: 'Docker', level: 'preferred', importance: 'important' },
  ],
};

// Mock candidate profile
const mockCandidate = {
  _id: 'test-candidate-456',
  skills: [
    { name: 'JavaScript', level: 'advanced', yearsOfExperience: 3 },
    { name: 'HTML', level: 'advanced', yearsOfExperience: 3 },
    { name: 'CSS', level: 'intermediate', yearsOfExperience: 2 },
    { name: 'Git', level: 'intermediate', yearsOfExperience: 2 },
  ],
  experience: [
    {
      position: 'Frontend Developer',
      company: 'ABC Corp',
      duration: 2,
      description: 'Built responsive web applications using JavaScript and modern frameworks. Worked with REST APIs and version control.',
    },
  ],
  education: [
    {
      degree: 'bachelor',
      major: 'Computer Science',
      school: 'Tech University',
    },
  ],
};

async function testLearningRoadmapService() {
  try {
    console.log('🚀 Testing Learning Roadmap Service...\n');

    // Test 1: Get service info
    console.log('📊 Service Info:');
    const info = learningRoadmapService.getInfo();
    console.log(JSON.stringify(info, null, 2));
    console.log();

    // Test 2: Initialize service
    console.log('⚙️  Initializing service...');
    await learningRoadmapService.initialize();
    console.log('✅ Service initialized\n');

    // Test 3: Generate roadmap
    console.log('📝 Generating roadmap for Senior Full Stack Developer...');
    const result = await learningRoadmapService.generateRoadmapForJob(
      mockJob,
      mockCandidate,
      12 // 12 weeks
    );

    if (result.success) {
      console.log('✅ Roadmap generated successfully!\n');
      
      const roadmap = result.roadmap;
      
      console.log('📋 Roadmap Summary:');
      console.log(`  - Target Job: ${roadmap.targetJobTitle}`);
      console.log(`  - Duration: ${roadmap.duration} weeks`);
      console.log(`  - Difficulty: ${roadmap.difficulty}`);
      console.log(`  - Total Hours: ${roadmap.estimatedTotalHours}h`);
      console.log(`  - Total Skills to Learn: ${roadmap.metadata.totalSkillsToLearn}`);
      console.log(`  - Total Resources: ${roadmap.metadata.totalResources}`);
      console.log();

      console.log('🎯 Skill Gaps:');
      console.log(`  - Critical: ${roadmap.skillGaps.critical.length} skills`);
      roadmap.skillGaps.critical.slice(0, 3).forEach(gap => {
        console.log(`    • ${gap.skillName} (${gap.currentLevel} → ${gap.requiredLevel})`);
      });
      console.log(`  - Important: ${roadmap.skillGaps.important.length} skills`);
      roadmap.skillGaps.important.slice(0, 3).forEach(gap => {
        console.log(`    • ${gap.skillName} (${gap.currentLevel} → ${gap.requiredLevel})`);
      });
      console.log(`  - Optional: ${roadmap.skillGaps.optional.length} skills`);
      console.log();

      console.log('📅 Weekly Breakdown (first 3 weeks):');
      roadmap.weeks.slice(0, 3).forEach(week => {
        console.log(`\n  Week ${week.weekNumber}: ${week.title}`);
        console.log(`    Skills: ${week.skills.map(s => s.skillName).join(', ')}`);
        console.log(`    Hours: ${week.estimatedHours}h`);
        console.log(`    Resources: ${week.resources.length}`);
        if (week.resources.length > 0) {
          console.log(`      • ${week.resources[0].title} (${week.resources[0].type})`);
        }
      });
      console.log();

      console.log('🤖 Generation Metadata:');
      console.log(`  - Method: ${roadmap.metadata.generationMethod}`);
      console.log(`  - Skill Extraction: ${roadmap.metadata.models.skillExtraction}`);
      console.log(`  - Semantic Matching: ${roadmap.metadata.models.semanticMatching}`);
      console.log(`  - Resource Matching: ${roadmap.metadata.models.resourceMatching}`);
      console.log();

      console.log('✅ All tests passed!');
    } else {
      console.error('❌ Failed to generate roadmap:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testLearningRoadmapService();
