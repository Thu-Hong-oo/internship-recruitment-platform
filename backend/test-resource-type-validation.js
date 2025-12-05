/**
 * Test to verify ALL resources have required 'type' field
 * This prevents Mongoose validation errors
 */

const resourceRecommendationService = require('./src/services/resource/resourceRecommendationService');

async function testResourceTypeValidation() {
  console.log('=== Testing Resource Type Validation ===\n');

  const testCases = [
    { skill: 'Figma', currentLevel: 'beginner', targetLevel: 'intermediate', phaseNumber: 1 },
    { skill: 'Design Systems', currentLevel: 'beginner', targetLevel: 'advanced', phaseNumber: 2 },
    { skill: 'React', currentLevel: 'intermediate', targetLevel: 'advanced', phaseNumber: 3 },
    { skill: 'Unknown Skill XYZ', currentLevel: 'beginner', targetLevel: 'intermediate', phaseNumber: 1 },
  ];

  let allPassed = true;
  let totalResources = 0;
  let resourcesWithType = 0;

  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.skill} (Phase ${testCase.phaseNumber})`);
    console.log(`  Level: ${testCase.currentLevel} → ${testCase.targetLevel}`);

    try {
      const resources = await resourceRecommendationService.recommendResources({
        skill: testCase.skill,
        currentLevel: testCase.currentLevel,
        targetLevel: testCase.targetLevel,
        phaseNumber: testCase.phaseNumber,
        learningObjectives: [`Master ${testCase.skill}`],
        weekNumber: 1,
        totalWeeks: 12,
        budget: 50,
        maxHours: 10,
        learningStyle: 'visual',
        preferredLanguage: 'en',
      });

      console.log(`  ✓ Received ${resources.length} resources`);
      totalResources += resources.length;

      // Validate each resource has 'type' field
      const missingType = [];
      resources.forEach((resource, index) => {
        if (!resource.type) {
          missingType.push({ index, title: resource.title });
        } else {
          resourcesWithType++;
        }
      });

      if (missingType.length > 0) {
        console.log(`  ❌ FAIL: ${missingType.length} resources missing 'type' field:`);
        missingType.forEach(r => {
          console.log(`     - Resource ${r.index}: "${r.title}"`);
        });
        allPassed = false;
      } else {
        console.log(`  ✅ PASS: All resources have 'type' field`);
        
        // Show type breakdown
        const typeCount = {};
        resources.forEach(r => {
          typeCount[r.type] = (typeCount[r.type] || 0) + 1;
        });
        console.log(`     Types: ${JSON.stringify(typeCount)}`);
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total Resources: ${totalResources}`);
  console.log(`Resources with 'type': ${resourcesWithType}/${totalResources} (${Math.round(resourcesWithType/totalResources*100)}%)`);
  
  if (allPassed && resourcesWithType === totalResources) {
    console.log('\n🎉 ALL TESTS PASSED - All resources have required type field!');
    console.log('✅ Mongoose validation will succeed');
    process.exit(0);
  } else {
    console.log('\n❌ TESTS FAILED - Some resources missing type field');
    console.log('⚠️  Mongoose validation will fail');
    process.exit(1);
  }
}

testResourceTypeValidation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
