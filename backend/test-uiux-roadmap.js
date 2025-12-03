const resourceRecommendationService = require('./src/services/resource/resourceRecommendationService');

async function testUIUXRoadmap() {
  console.log('=== Testing UI/UX Designer Learning Roadmap Resources ===\n');
  
  // Simulate a roadmap week for UI/UX Designer
  const roadmapWeek = {
    skill: 'Figma',
    currentLevel: 'beginner',
    targetLevel: 'intermediate',
    phaseNumber: 1,
    learningObjectives: ['Master Figma interface', 'Create wireframes', 'Design prototypes'],
    weekNumber: 1,
    totalWeeks: 12,
  };

  console.log('Week 1: Figma Fundamentals');
  console.log('Current Level: Beginner → Target Level: Intermediate\n');

  try {
    const recommendations = await resourceRecommendationService.recommendResources({
      skill: 'Figma',
      currentLevel: 'beginner',
      targetLevel: 'intermediate',
      phaseNumber: 1,
      learningObjectives: ['Master Figma interface', 'Create wireframes', 'Design prototypes'],
      weekNumber: 1,
      totalWeeks: 12,
      budget: 50,
      maxHours: 10,
      learningStyle: 'visual',
      preferredLanguage: 'en',
    });

    console.log(`✅ Found ${recommendations.length} total recommendations\n`);

    // Group by type
    const byType = recommendations.reduce((acc, rec) => {
      const type = rec.type || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(rec);
      return acc;
    }, {});

    // Show each type
    ['course', 'video', 'documentation'].forEach(type => {
      if (byType[type]) {
        console.log(`${type.toUpperCase()}S (${byType[type].length}):`);
        byType[type].forEach((rec, i) => {
          console.log(`  ${i+1}. ${rec.title}`);
          console.log(`     URL: ${rec.url}`);
          console.log(`     Provider: ${rec.provider || 'N/A'}`);
          console.log(`     Rating: ${rec.rating || 'N/A'} | Duration: ${rec.estimatedDuration || rec.duration || 'N/A'}`);
          if (rec.estimatedCost !== undefined) {
            console.log(`     Cost: $${rec.estimatedCost} ${rec.isFree ? '(FREE)' : ''}`);
          }
          console.log();
        });
      }
    });

    // Quality check
    const curated = recommendations.filter(r => r.source === 'curated' || r.verified);
    const realUrls = recommendations.filter(r => !r.url.includes('search?q='));
    
    console.log('\n=== QUALITY METRICS ===');
    console.log(`Curated/Verified: ${curated.length}/${recommendations.length} (${Math.round(curated.length/recommendations.length*100)}%)`);
    console.log(`Real URLs (not search): ${realUrls.length}/${recommendations.length} (${Math.round(realUrls.length/recommendations.length*100)}%)`);
    
    // Calculate credibility score
    const avgCredibility = recommendations
      .filter(r => r.credibilityScore)
      .reduce((sum, r) => sum + r.credibilityScore, 0) / recommendations.filter(r => r.credibilityScore).length;
    console.log(`Average Credibility Score: ${(avgCredibility || 0).toFixed(2)}/1.00`);

    // Rating quality
    const avgRating = recommendations
      .filter(r => r.rating)
      .reduce((sum, r) => sum + r.rating, 0) / recommendations.filter(r => r.rating).length;
    console.log(`Average Rating: ${(avgRating || 0).toFixed(1)}/5.0`);

    // Overall assessment
    const qualityScore = (
      (curated.length / recommendations.length) * 0.4 +
      (realUrls.length / recommendations.length) * 0.3 +
      (avgCredibility || 0) * 0.2 +
      ((avgRating || 0) / 5) * 0.1
    );
    
    console.log(`\n🎯 OVERALL QUALITY SCORE: ${(qualityScore * 10).toFixed(1)}/10`);
    
    if (qualityScore >= 0.8) {
      console.log('✅ EXCELLENT - Production ready!');
    } else if (qualityScore >= 0.6) {
      console.log('⚠️ GOOD - Minor improvements needed');
    } else {
      console.log('❌ NEEDS IMPROVEMENT');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testUIUXRoadmap().catch(console.error);
