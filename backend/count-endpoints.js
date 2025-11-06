const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src/presentation/routes');

// Route files to analyze
const routeFiles = [
  'auth.js',
  'candidate.js',
  'employer.js',
  'jobPost.js',
  'application.js',
  'ai.js',
  'skill.js',
  'roadmap.js',
  'notification.js',
  'chat.js',
  'admin.js',
  'savedJobs.js',
  'industry.js',
  'public.js',
];

let totalEndpoints = 0;
const endpointsByFile = {};

routeFiles.forEach(file => {
  const filePath = path.join(routesDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Count route definitions
  // Match: router.get, router.post, router.put, router.patch, router.delete
  // Also match: router.route(...).get(...).post(...)

  const routerMethodPattern = /router\.(get|post|put|patch|delete)\(/g;
  const routeChainPattern =
    /router\.route\([^)]+\)\s*(\.(get|post|put|patch|delete)\([^)]+\))+/g;

  // Count individual router.method() calls
  const methodMatches = content.match(routerMethodPattern) || [];

  // Count chained routes like router.route('/').get().post()
  const chainMatches = content.match(routeChainPattern) || [];

  let chainedMethodsCount = 0;
  chainMatches.forEach(chain => {
    const methods = chain.match(/\.(get|post|put|patch|delete)\(/g) || [];
    chainedMethodsCount += methods.length;
  });

  // Remove commented lines
  const lines = content.split('\n');
  let activeMethodCount = 0;

  lines.forEach(line => {
    const trimmed = line.trim();
    // Skip commented lines
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*')
    ) {
      return;
    }

    // Count active router methods
    const matches = trimmed.match(/router\.(get|post|put|patch|delete)\(/g);
    if (matches) {
      activeMethodCount += matches.length;
    }

    // Count chained methods in route()
    if (trimmed.includes('router.route(')) {
      const chainMethods = trimmed.match(/\.(get|post|put|patch|delete)\(/g);
      if (chainMethods) {
        activeMethodCount += chainMethods.length - 1; // -1 because route() itself is not a method
      }
    }
  });

  endpointsByFile[file] = activeMethodCount;
  totalEndpoints += activeMethodCount;

  console.log(`📁 ${file.padEnd(20)} → ${activeMethodCount} endpoints`);
});

console.log('\n' + '='.repeat(50));
console.log(`🎯 TOTAL ENDPOINTS: ${totalEndpoints}`);
console.log('='.repeat(50));

// Group by category
console.log('\n📊 BY CATEGORY:');
const categories = {
  Authentication: ['auth.js'],
  'User Profiles': ['candidate.js', 'employer.js'],
  'Jobs & Applications': ['jobPost.js', 'application.js', 'savedJobs.js'],
  'AI/NLP': ['ai.js'],
  'Skills & Learning': ['skill.js', 'roadmap.js'],
  Communication: ['notification.js', 'chat.js'],
  Admin: ['admin.js'],
  'Master Data': ['industry.js'],
  Public: ['public.js'],
};

Object.entries(categories).forEach(([category, files]) => {
  const count = files.reduce(
    (sum, file) => sum + (endpointsByFile[file] || 0),
    0
  );
  console.log(`  ${category.padEnd(25)} → ${count} endpoints`);
});
