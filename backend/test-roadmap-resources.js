/**
 * Test Roadmap Resource URLs
 * Verify that resources have specific URLs, not search results
 */

const http = require('http');

const opts = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/roadmap/candidate/68da2e6362b86d4ab4daff7b/job/69214a44e4f559f0b126ace0',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('\n=== TESTING ROADMAP RESOURCE URLS AFTER FIX ===\n');

const req = http.request(opts, res => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      if (!json.success) {
        console.error('❌ API Error:', json.message);
        process.exit(1);
      }
      
      const resources = json.data.phases.flatMap(p => 
        p.weeks.flatMap(w => w.resources)
      );
      
      console.log(`Total Resources: ${resources.length}\n`);
      
      // Check for search URLs (BAD)
      const searchUrls = resources.filter(r => 
        r.url && (
          r.url.includes('/results?search_query=') ||
          r.url.includes('/search?q=') ||
          r.url.includes('/courses/search/')
        )
      );
      
      if (searchUrls.length > 0) {
        console.log(`❌ FOUND ${searchUrls.length} SEARCH URLs (BAD):\n`);
        searchUrls.forEach((r, i) => {
          console.log(`${i + 1}. ${r.title}`);
          console.log(`   Type: ${r.type}`);
          console.log(`   URL: ${r.url}`);
          console.log('');
        });
      } else {
        console.log('✅ NO SEARCH URLs FOUND - All resources have specific URLs!\n');
      }
      
      // Show sample resources
      console.log('\n=== SAMPLE RESOURCES ===\n');
      resources.slice(0, 10).forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   Type: ${r.type}`);
        console.log(`   Provider: ${r.provider}`);
        console.log(`   URL: ${r.url}`);
        console.log('');
      });
      
      // Summary by type
      const byType = resources.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n=== RESOURCES BY TYPE ===');
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`${type}: ${count}`);
      });
      
      console.log('\n' + (searchUrls.length === 0 ? '✅ TEST PASSED' : '❌ TEST FAILED'));
      process.exit(searchUrls.length === 0 ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Response:', data.slice(0, 500));
      process.exit(1);
    }
  });
});

req.on('error', error => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.end();
