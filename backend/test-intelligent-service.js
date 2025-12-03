const intelligentService = require('./src/services/resource/intelligentResourceService');

async function testIntelligentService() {
  console.log('=== Testing IntelligentResourceService ===\n');
  
  // Test 1: Figma courses (beginner)
  console.log('Test 1: Figma courses (beginner)');
  const figmaCourses = await intelligentService.getRecommendations({
    skill: 'figma',
    difficulty: 'beginner',
    type: 'course',
    limit: 3
  });
  console.log(`  Found ${figmaCourses.length} resources`);
  figmaCourses.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.title}`);
    console.log(`     URL: ${r.url}`);
    console.log(`     Rating: ${r.rating}, Score: ${r.finalScore?.toFixed(2)}, Source: ${r.source}`);
  });
  console.log();

  // Test 2: Design Systems videos (intermediate)
  console.log('Test 2: Design Systems videos (intermediate)');
  const designVideos = await intelligentService.getRecommendations({
    skill: 'design systems',
    difficulty: 'intermediate',
    type: 'video',
    limit: 3
  });
  console.log(`  Found ${designVideos.length} resources`);
  designVideos.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.title}`);
    console.log(`     URL: ${r.url}`);
    console.log(`     Rating: ${r.rating}, Score: ${r.finalScore?.toFixed(2)}, Source: ${r.source}`);
  });
  console.log();

  // Test 3: React documentation (advanced)
  console.log('Test 3: React documentation (advanced)');
  const reactDocs = await intelligentService.getRecommendations({
    skill: 'react',
    difficulty: 'advanced',
    type: 'documentation',
    limit: 2
  });
  console.log(`  Found ${reactDocs.length} resources`);
  reactDocs.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.title}`);
    console.log(`     URL: ${r.url}`);
    console.log(`     Rating: ${r.rating || 'N/A'}, Source: ${r.source}`);
  });
  console.log();

  // Test 4: Mixed types for Vue.js
  console.log('Test 4: Mixed resources for Vue.js (all types)');
  const vueMixed = await intelligentService.getRecommendations({
    skill: 'vue',
    difficulty: 'beginner',
    type: null, // Mixed types
    limit: 5
  });
  console.log(`  Found ${vueMixed.length} resources`);
  const typeCount = {};
  vueMixed.forEach(r => {
    const type = r.url.includes('youtube') ? 'video' : 
                 r.url.includes('udemy') || r.url.includes('coursera') ? 'course' : 'doc';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  console.log(`  Type breakdown: ${JSON.stringify(typeCount)}`);
  console.log();

  // Test 5: Unknown skill (should fallback gracefully)
  console.log('Test 5: Unknown skill (should use fallback)');
  const unknownSkill = await intelligentService.getRecommendations({
    skill: 'super-rare-framework-xyz',
    difficulty: 'beginner',
    type: 'course',
    limit: 2
  });
  console.log(`  Found ${unknownSkill.length} resources (fallback)`);
  unknownSkill.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.title} - Source: ${r.source}`);
  });
  console.log();

  console.log('=== All tests completed ===');
}

testIntelligentService().catch(console.error);
