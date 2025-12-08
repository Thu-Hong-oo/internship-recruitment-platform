const AIContentService = require('./src/services/resume/aiContentService');

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini AI Integration...\n');

  try {
    // Test 1: Generate initial suggestions
    console.log('1. Testing generateInitialSuggestions...');
    const suggestions = await AIContentService.generateInitialSuggestions({
      jobTitle: 'Frontend Developer',
      industry: 'Technology'
    });
    console.log('✅ Initial suggestions generated:', suggestions.length, 'sections');

    // Test 2: Generate section-specific suggestions
    console.log('\n2. Testing generateSectionSpecificSuggestions...');
    const sectionSuggestions = await AIContentService.generateSectionSpecificSuggestions(
      'experience',
      'Worked as a developer for 2 years'
    );
    console.log('✅ Section suggestions generated:', sectionSuggestions.length, 'suggestions');

    // Test 3: Optimize for job
    console.log('\n3. Testing optimizeForJob...');
    const cvData = {
      summary: 'Experienced developer',
      experience: [{ company: 'Tech Corp', position: 'Developer', description: 'Built web apps' }],
      skills: ['JavaScript', 'React']
    };
    const jobDetails = {
      title: 'Senior Frontend Developer',
      description: 'Looking for React expert with 3+ years experience'
    };
    const optimization = await AIContentService.optimizeForJob(cvData, jobDetails);
    console.log('✅ CV optimization completed, relevance score:', optimization.relevanceScore);

    // Test 4: Extract keywords
    console.log('\n4. Testing extractKeywords...');
    const keywords = await AIContentService.extractKeywords(
      'Experienced JavaScript developer with React and Node.js skills'
    );
    console.log('✅ Keywords extracted:', keywords.length, 'keywords');

    // Test 5: Extract job keywords
    console.log('\n5. Testing extractJobKeywords...');
    const jobKeywords = await AIContentService.extractJobKeywords(
      'We are looking for a Frontend Developer with React, JavaScript, and CSS experience'
    );
    console.log('✅ Job keywords extracted:', jobKeywords.length, 'keywords');

    console.log('\n🎉 All Gemini AI tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGeminiIntegration();