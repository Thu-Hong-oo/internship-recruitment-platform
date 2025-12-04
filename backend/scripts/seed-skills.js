/**
 * 🌱 Seed Skills Database
 * 
 * Populate database with comprehensive skill categories
 * Usage: node scripts/seed-skills.js
 */

const mongoose = require('mongoose');
const Skill = require('../src/models/Skill');
const { logger } = require('../src/utils/logger');

// Comprehensive skill list with categories
const SKILLS_DATA = [
  // Programming Languages
  { name: 'Java', category: 'programming-languages', aliases: ['java programming', 'java developer'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Python', category: 'programming-languages', aliases: ['python programming', 'python developer'], demandLevel: 'critical', trend: 'growing' },
  { name: 'JavaScript', category: 'programming-languages', aliases: ['js', 'javascript programming'], demandLevel: 'critical', trend: 'stable' },
  { name: 'TypeScript', category: 'programming-languages', aliases: ['ts', 'typescript programming'], demandLevel: 'high', trend: 'growing' },
  { name: 'C++', category: 'programming-languages', aliases: ['cpp', 'c plus plus'], demandLevel: 'high', trend: 'stable' },
  { name: 'C#', category: 'programming-languages', aliases: ['csharp', 'c sharp'], demandLevel: 'high', trend: 'stable' },
  { name: 'PHP', category: 'programming-languages', aliases: ['php programming'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Ruby', category: 'programming-languages', aliases: ['ruby programming'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Go', category: 'programming-languages', aliases: ['golang', 'go programming'], demandLevel: 'high', trend: 'growing' },
  { name: 'Rust', category: 'programming-languages', aliases: ['rust programming'], demandLevel: 'medium', trend: 'emerging' },
  { name: 'Swift', category: 'programming-languages', aliases: ['swift programming'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Kotlin', category: 'programming-languages', aliases: ['kotlin programming'], demandLevel: 'medium', trend: 'growing' },
  { name: 'Dart', category: 'programming-languages', aliases: ['dart programming'], demandLevel: 'medium', trend: 'growing' },

  // Frontend Frameworks & Libraries
  { name: 'React', category: 'frontend', aliases: ['react.js', 'reactjs', 'react framework'], demandLevel: 'critical', trend: 'growing' },
  { name: 'Vue.js', category: 'frontend', aliases: ['vue', 'vuejs', 'vue framework'], demandLevel: 'high', trend: 'growing' },
  { name: 'Angular', category: 'frontend', aliases: ['angular.js', 'angularjs', 'angular framework'], demandLevel: 'high', trend: 'stable' },
  { name: 'Next.js', category: 'frontend', aliases: ['nextjs', 'next framework'], demandLevel: 'high', trend: 'growing' },
  { name: 'Nuxt.js', category: 'frontend', aliases: ['nuxt', 'nuxtjs'], demandLevel: 'medium', trend: 'growing' },
  { name: 'Svelte', category: 'frontend', aliases: ['svelte framework'], demandLevel: 'medium', trend: 'emerging' },
  { name: 'HTML', category: 'frontend', aliases: ['html5', 'html markup'], demandLevel: 'critical', trend: 'stable' },
  { name: 'CSS', category: 'frontend', aliases: ['css3', 'cascading style sheets'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Sass', category: 'frontend', aliases: ['scss', 'sass css'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Tailwind CSS', category: 'frontend', aliases: ['tailwind', 'tailwindcss'], demandLevel: 'high', trend: 'growing' },
  { name: 'Bootstrap', category: 'frontend', aliases: ['bootstrap css', 'bootstrap framework'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Material UI', category: 'frontend', aliases: ['mui', 'material-ui'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Redux', category: 'frontend', aliases: ['redux.js', 'redux state'], demandLevel: 'high', trend: 'stable' },
  { name: 'Webpack', category: 'frontend', aliases: ['webpack bundler'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Vite', category: 'frontend', aliases: ['vite build'], demandLevel: 'medium', trend: 'growing' },

  // Backend Frameworks
  { name: 'Node.js', category: 'backend', aliases: ['nodejs', 'node', 'node runtime'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Express.js', category: 'backend', aliases: ['express', 'expressjs'], demandLevel: 'critical', trend: 'stable' },
  { name: 'NestJS', category: 'backend', aliases: ['nest', 'nest.js'], demandLevel: 'high', trend: 'growing' },
  { name: 'Spring Boot', category: 'backend', aliases: ['spring', 'spring framework'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Django', category: 'backend', aliases: ['django framework'], demandLevel: 'high', trend: 'stable' },
  { name: 'Flask', category: 'backend', aliases: ['flask framework'], demandLevel: 'medium', trend: 'stable' },
  { name: 'FastAPI', category: 'backend', aliases: ['fast api'], demandLevel: 'high', trend: 'growing' },
  { name: 'Laravel', category: 'backend', aliases: ['laravel framework'], demandLevel: 'high', trend: 'stable' },
  { name: 'Ruby on Rails', category: 'backend', aliases: ['rails', 'ror'], demandLevel: 'medium', trend: 'stable' },
  { name: 'ASP.NET', category: 'backend', aliases: ['asp.net core', 'dotnet'], demandLevel: 'high', trend: 'stable' },

  // Databases
  { name: 'MongoDB', category: 'databases', aliases: ['mongo', 'mongodb database'], demandLevel: 'critical', trend: 'stable' },
  { name: 'PostgreSQL', category: 'databases', aliases: ['postgres', 'postgresql database'], demandLevel: 'critical', trend: 'growing' },
  { name: 'MySQL', category: 'databases', aliases: ['mysql database'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Redis', category: 'databases', aliases: ['redis cache', 'redis database'], demandLevel: 'high', trend: 'stable' },
  { name: 'Elasticsearch', category: 'databases', aliases: ['elastic search'], demandLevel: 'high', trend: 'stable' },
  { name: 'Microsoft SQL Server', category: 'databases', aliases: ['mssql', 'sql server'], demandLevel: 'high', trend: 'stable' },
  { name: 'Oracle Database', category: 'databases', aliases: ['oracle', 'oracle db'], demandLevel: 'medium', trend: 'stable' },
  { name: 'DynamoDB', category: 'databases', aliases: ['dynamodb', 'aws dynamodb'], demandLevel: 'medium', trend: 'growing' },
  { name: 'Cassandra', category: 'databases', aliases: ['apache cassandra'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Firebase', category: 'databases', aliases: ['firebase database', 'firestore'], demandLevel: 'medium', trend: 'stable' },

  // Cloud & DevOps
  { name: 'AWS', category: 'cloud-devops', aliases: ['amazon web services', 'aws cloud'], demandLevel: 'critical', trend: 'growing' },
  { name: 'Azure', category: 'cloud-devops', aliases: ['microsoft azure', 'azure cloud'], demandLevel: 'high', trend: 'growing' },
  { name: 'Google Cloud Platform', category: 'cloud-devops', aliases: ['gcp', 'google cloud'], demandLevel: 'high', trend: 'growing' },
  { name: 'Docker', category: 'cloud-devops', aliases: ['docker container', 'containerization'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Kubernetes', category: 'cloud-devops', aliases: ['k8s', 'kubernetes orchestration'], demandLevel: 'critical', trend: 'growing' },
  { name: 'Jenkins', category: 'cloud-devops', aliases: ['jenkins ci/cd'], demandLevel: 'high', trend: 'stable' },
  { name: 'GitLab CI/CD', category: 'cloud-devops', aliases: ['gitlab', 'gitlab ci'], demandLevel: 'high', trend: 'growing' },
  { name: 'GitHub Actions', category: 'cloud-devops', aliases: ['github action'], demandLevel: 'high', trend: 'growing' },
  { name: 'Terraform', category: 'cloud-devops', aliases: ['terraform iac'], demandLevel: 'high', trend: 'growing' },
  { name: 'Ansible', category: 'cloud-devops', aliases: ['ansible automation'], demandLevel: 'medium', trend: 'stable' },
  { name: 'CI/CD', category: 'cloud-devops', aliases: ['continuous integration', 'continuous deployment'], demandLevel: 'critical', trend: 'stable' },

  // Mobile Development
  { name: 'React Native', category: 'mobile', aliases: ['react-native', 'rn'], demandLevel: 'high', trend: 'stable' },
  { name: 'Flutter', category: 'mobile', aliases: ['flutter framework'], demandLevel: 'high', trend: 'growing' },
  { name: 'iOS Development', category: 'mobile', aliases: ['ios', 'iphone development'], demandLevel: 'high', trend: 'stable' },
  { name: 'Android Development', category: 'mobile', aliases: ['android', 'android app'], demandLevel: 'high', trend: 'stable' },
  { name: 'Xamarin', category: 'mobile', aliases: ['xamarin framework'], demandLevel: 'medium', trend: 'declining' },
  { name: 'Ionic', category: 'mobile', aliases: ['ionic framework'], demandLevel: 'medium', trend: 'stable' },

  // Design & UI/UX
  { name: 'Figma', category: 'design-tools', aliases: ['figma design', 'figma prototype'], demandLevel: 'critical', trend: 'growing' },
  { name: 'Adobe XD', category: 'design-tools', aliases: ['xd', 'adobe experience design'], demandLevel: 'high', trend: 'stable' },
  { name: 'Sketch', category: 'design-tools', aliases: ['sketch app', 'sketch design'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Adobe Photoshop', category: 'design-tools', aliases: ['photoshop', 'ps'], demandLevel: 'high', trend: 'stable' },
  { name: 'Adobe Illustrator', category: 'design-tools', aliases: ['illustrator', 'ai'], demandLevel: 'high', trend: 'stable' },
  { name: 'UI/UX Design', category: 'design-tools', aliases: ['user interface', 'user experience', 'uiux'], demandLevel: 'critical', trend: 'growing' },
  { name: 'Wireframing', category: 'design-tools', aliases: ['wireframe design'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Prototyping', category: 'design-tools', aliases: ['prototype design'], demandLevel: 'medium', trend: 'stable' },

  // Development Tools
  { name: 'Git', category: 'dev-tools', aliases: ['git version control'], demandLevel: 'critical', trend: 'stable' },
  { name: 'GitHub', category: 'dev-tools', aliases: ['github platform'], demandLevel: 'critical', trend: 'stable' },
  { name: 'GitLab', category: 'dev-tools', aliases: ['gitlab platform'], demandLevel: 'high', trend: 'stable' },
  { name: 'Bitbucket', category: 'dev-tools', aliases: ['bitbucket platform'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Jira', category: 'dev-tools', aliases: ['jira software'], demandLevel: 'high', trend: 'stable' },
  { name: 'Postman', category: 'dev-tools', aliases: ['postman api'], demandLevel: 'high', trend: 'stable' },
  { name: 'VS Code', category: 'dev-tools', aliases: ['visual studio code', 'vscode'], demandLevel: 'critical', trend: 'stable' },
  { name: 'IntelliJ IDEA', category: 'dev-tools', aliases: ['intellij', 'idea'], demandLevel: 'high', trend: 'stable' },
  { name: 'Eclipse', category: 'dev-tools', aliases: ['eclipse ide'], demandLevel: 'medium', trend: 'declining' },

  // Data Science & AI
  { name: 'Machine Learning', category: 'data-ai', aliases: ['ml', 'machine learning algorithms'], demandLevel: 'critical', trend: 'growing' },
  { name: 'Deep Learning', category: 'data-ai', aliases: ['dl', 'neural networks'], demandLevel: 'high', trend: 'growing' },
  { name: 'TensorFlow', category: 'data-ai', aliases: ['tensorflow framework'], demandLevel: 'high', trend: 'stable' },
  { name: 'PyTorch', category: 'data-ai', aliases: ['pytorch framework'], demandLevel: 'high', trend: 'growing' },
  { name: 'Scikit-learn', category: 'data-ai', aliases: ['sklearn', 'scikit learn'], demandLevel: 'high', trend: 'stable' },
  { name: 'Pandas', category: 'data-ai', aliases: ['pandas library'], demandLevel: 'high', trend: 'stable' },
  { name: 'NumPy', category: 'data-ai', aliases: ['numpy library'], demandLevel: 'high', trend: 'stable' },
  { name: 'Natural Language Processing', category: 'data-ai', aliases: ['nlp', 'text processing'], demandLevel: 'high', trend: 'growing' },
  { name: 'Computer Vision', category: 'data-ai', aliases: ['cv', 'image processing'], demandLevel: 'high', trend: 'growing' },
  { name: 'Data Analysis', category: 'data-ai', aliases: ['data analytics'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Data Visualization', category: 'data-ai', aliases: ['data viz'], demandLevel: 'high', trend: 'stable' },

  // Testing
  { name: 'Jest', category: 'testing', aliases: ['jest testing'], demandLevel: 'high', trend: 'stable' },
  { name: 'Mocha', category: 'testing', aliases: ['mocha testing'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Cypress', category: 'testing', aliases: ['cypress testing'], demandLevel: 'high', trend: 'growing' },
  { name: 'Selenium', category: 'testing', aliases: ['selenium testing'], demandLevel: 'high', trend: 'stable' },
  { name: 'JUnit', category: 'testing', aliases: ['junit testing'], demandLevel: 'high', trend: 'stable' },
  { name: 'Pytest', category: 'testing', aliases: ['pytest framework'], demandLevel: 'medium', trend: 'stable' },
  { name: 'Unit Testing', category: 'testing', aliases: ['unit tests'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Integration Testing', category: 'testing', aliases: ['integration tests'], demandLevel: 'high', trend: 'stable' },
  { name: 'E2E Testing', category: 'testing', aliases: ['end to end testing', 'e2e tests'], demandLevel: 'high', trend: 'stable' },

  // Soft Skills
  { name: 'Communication', category: 'soft-skills', aliases: ['verbal communication', 'written communication'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Teamwork', category: 'soft-skills', aliases: ['team collaboration', 'collaboration'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Problem Solving', category: 'soft-skills', aliases: ['analytical thinking', 'critical thinking'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Leadership', category: 'soft-skills', aliases: ['team leadership', 'leading teams'], demandLevel: 'high', trend: 'stable' },
  { name: 'Time Management', category: 'soft-skills', aliases: ['time planning', 'prioritization'], demandLevel: 'high', trend: 'stable' },
  { name: 'Agile', category: 'soft-skills', aliases: ['agile methodology', 'agile development'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Scrum', category: 'soft-skills', aliases: ['scrum methodology', 'scrum master'], demandLevel: 'high', trend: 'stable' },
  { name: 'Project Management', category: 'soft-skills', aliases: ['pm', 'project planning'], demandLevel: 'high', trend: 'stable' },
  { name: 'Adaptability', category: 'soft-skills', aliases: ['flexibility', 'adaptable'], demandLevel: 'high', trend: 'stable' },
  { name: 'Creativity', category: 'soft-skills', aliases: ['creative thinking', 'innovation'], demandLevel: 'high', trend: 'stable' },

  // Security
  { name: 'Cybersecurity', category: 'security', aliases: ['information security', 'security'], demandLevel: 'critical', trend: 'growing' },
  { name: 'OAuth', category: 'security', aliases: ['oauth2', 'oauth authentication'], demandLevel: 'high', trend: 'stable' },
  { name: 'JWT', category: 'security', aliases: ['json web token', 'jwt authentication'], demandLevel: 'high', trend: 'stable' },
  { name: 'Encryption', category: 'security', aliases: ['data encryption'], demandLevel: 'high', trend: 'stable' },
  { name: 'Penetration Testing', category: 'security', aliases: ['pentesting', 'pen test'], demandLevel: 'medium', trend: 'growing' },

  // Other Technical Skills
  { name: 'RESTful API', category: 'other-technical', aliases: ['rest api', 'rest', 'restful'], demandLevel: 'critical', trend: 'stable' },
  { name: 'GraphQL', category: 'other-technical', aliases: ['graphql api'], demandLevel: 'high', trend: 'growing' },
  { name: 'Microservices', category: 'other-technical', aliases: ['microservice architecture'], demandLevel: 'high', trend: 'growing' },
  { name: 'System Design', category: 'other-technical', aliases: ['architecture design', 'system architecture'], demandLevel: 'high', trend: 'stable' },
  { name: 'Design Patterns', category: 'other-technical', aliases: ['software design patterns'], demandLevel: 'high', trend: 'stable' },
  { name: 'Data Structures', category: 'other-technical', aliases: ['data structure algorithms'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Algorithms', category: 'other-technical', aliases: ['algorithm design'], demandLevel: 'critical', trend: 'stable' },
  { name: 'OOP', category: 'other-technical', aliases: ['object oriented programming', 'oop programming'], demandLevel: 'critical', trend: 'stable' },
  { name: 'Functional Programming', category: 'other-technical', aliases: ['fp', 'functional paradigm'], demandLevel: 'medium', trend: 'growing' },
];

async function seedSkills() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internship-platform';
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Clear existing skills (optional - remove if you want to keep existing)
    const existingCount = await Skill.countDocuments();
    if (existingCount > 0) {
      logger.warn(`⚠️ Found ${existingCount} existing skills`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise((resolve) => {
        readline.question('Delete existing skills and reseed? (yes/no): ', (answer) => {
          readline.close();
          if (answer.toLowerCase() === 'yes') {
            Skill.deleteMany({}).then(() => {
              logger.info('🗑️ Cleared existing skills');
              resolve();
            });
          } else {
            logger.info('⏭️ Skipping deletion, will update existing skills');
            resolve();
          }
        });
      });
    }

    // Insert or update skills
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const skillData of SKILLS_DATA) {
      try {
        const existing = await Skill.findOne({ name: skillData.name });
        
        if (existing) {
          // Update existing skill
          Object.assign(existing, skillData);
          await existing.save();
          updated++;
          logger.info(`🔄 Updated: ${skillData.name}`);
        } else {
          // Create new skill
          await Skill.create(skillData);
          created++;
          logger.info(`✅ Created: ${skillData.name}`);
        }
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error
          skipped++;
          logger.warn(`⏭️ Skipped duplicate: ${skillData.name}`);
        } else {
          throw error;
        }
      }
    }

    // Summary
    const totalSkills = await Skill.countDocuments({ isActive: true });
    logger.info('\n📊 Seeding Summary:');
    logger.info(`✅ Created: ${created}`);
    logger.info(`🔄 Updated: ${updated}`);
    logger.info(`⏭️ Skipped: ${skipped}`);
    logger.info(`📈 Total active skills: ${totalSkills}`);

    // Show sample by category
    logger.info('\n📋 Skills by Category:');
    const categories = await Skill.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    categories.forEach(cat => {
      logger.info(`   ${cat._id}: ${cat.count} skills`);
    });

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

// Run seeding
seedSkills();
