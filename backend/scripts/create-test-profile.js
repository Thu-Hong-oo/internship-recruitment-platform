/**
 * 🌱 Create Sample Candidate Profile for Testing
 * 
 * Creates a complete candidate profile for roadmap testing
 * Usage: node scripts/create-test-profile.js [userId]
 */

const mongoose = require('mongoose');
const CandidateProfile = require('../src/models/CandidateProfile');
const User = require('../src/models/User');
const { logger } = require('../src/utils/logger');

async function createTestProfile() {
  try {
    // Get userId from command line or use provided one
    const userId = process.argv[2] || '68da2e6362b86d4ab4daff7b';

    logger.info('🌱 Creating Test Candidate Profile');
    logger.info(`   User ID: ${userId}\n`);

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internship-platform';
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB\n');

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`❌ User ${userId} not found!`);
      logger.info('\n💡 Available users:');
      const users = await User.find({ role: 'candidate' }).select('_id email fullName').limit(5);
      users.forEach(u => {
        logger.info(`   - ${u._id} (${u.email})`);
      });
      
      if (users.length === 0) {
        logger.error('\n❌ No candidate users found in database!');
        logger.info('💡 Create user first at POST /api/auth/register');
      }
      
      process.exit(1);
    }

    logger.info(`✅ User found: ${user.fullName || user.email}\n`);

    // Check if profile already exists
    const existingProfile = await CandidateProfile.findOne({ userId });
    if (existingProfile) {
      logger.warn('⚠️ Profile already exists!');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        readline.question('Delete and recreate? (yes/no): ', (ans) => {
          readline.close();
          resolve(ans);
        });
      });

      if (answer.toLowerCase() !== 'yes') {
        logger.info('Aborted.');
        process.exit(0);
      }

      await CandidateProfile.deleteOne({ userId });
      logger.info('🗑️ Deleted existing profile\n');
    }

    // Create comprehensive test profile
    const testProfile = new CandidateProfile({
      userId: userId,
      
      // Skills
      skills: {
        technical: [
          { name: 'React', level: 'intermediate', yearsOfExperience: 2 },
          { name: 'JavaScript', level: 'advanced', yearsOfExperience: 3 },
          { name: 'HTML', level: 'advanced', yearsOfExperience: 3 },
          { name: 'CSS', level: 'advanced', yearsOfExperience: 3 },
          { name: 'Node.js', level: 'intermediate', yearsOfExperience: 1 },
          { name: 'MongoDB', level: 'beginner', yearsOfExperience: 1 },
          { name: 'Git', level: 'intermediate', yearsOfExperience: 2 },
          { name: 'Prototyping', level: 'intermediate', yearsOfExperience: 1 },
          { name: 'User Research', level: 'intermediate', yearsOfExperience: 1 }
        ],
        soft: [
          'Communication',
          'Teamwork',
          'Problem Solving',
          'Time Management'
        ],
        languages: [
          { name: 'English', proficiency: 'intermediate' },
          { name: 'Vietnamese', proficiency: 'native' }
        ]
      },

      // Experience
      experience: {
        internships: [
          {
            company: 'Tech Company',
            position: 'Frontend Developer Intern',
            startDate: new Date('2023-06-01'),
            endDate: new Date('2023-09-01'),
            description: 'Developed web applications using React and Node.js',
            skills: ['React', 'JavaScript', 'HTML', 'CSS']
          },
          {
            company: 'Design Studio',
            position: 'UI/UX Design Intern',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-04-01'),
            description: 'Created prototypes and conducted user research',
            skills: ['Prototyping', 'User Research', 'Wireframing']
          }
        ]
      },

      workExperience: [
        {
          company: 'Startup Co',
          role: 'Junior Frontend Developer',
          startDate: new Date('2024-05-01'),
          endDate: null, // Current
          description: 'Building modern web applications with React',
          responsibilities: ['Frontend development', 'Code review', 'Testing']
        }
      ],

      // Education
      education: {
        university: {
          name: 'University of Technology',
          degree: "Bachelor's Degree",
          major: 'Computer Science',
          field: 'Software Engineering',
          graduationYear: 2025,
          gpa: 3.5
        },
        certifications: [
          {
            name: 'React Developer Certification',
            issuer: 'Meta',
            issueDate: new Date('2023-12-01')
          }
        ]
      },

      // Target Job
      targetJob: {
        title: 'Frontend Developer',
        level: 'mid',
        preferredIndustries: ['Technology', 'Software Development'],
        expectedSalary: {
          min: 15000000,
          max: 25000000,
          currency: 'VND'
        }
      },

      // Personal Info
      personalInfo: {
        dateOfBirth: new Date('2000-01-01'),
        gender: 'other',
        phone: '0123456789',
        address: {
          city: 'Hà Nội',
          district: 'Cầu Giấy',
          country: 'Vietnam'
        }
      },

      // Preferences
      preferences: {
        jobType: 'full-time',
        workLocation: 'hybrid',
        willingToRelocate: true,
        learning: {
          style: 'visual',
          budget: 'mixed',
          maxHoursPerWeek: 10,
          preferredResourceTypes: ['video', 'documentation', 'course'],
          preferredLanguage: 'en'
        },
        roadmap: {
          preferredPace: 'normal',
          focusAreas: ['frontend', 'fullstack'],
          skipBasics: false
        }
      }
    });

    await testProfile.save();

    logger.info('✅ Test profile created successfully!\n');
    logger.info('📊 Profile Summary:');
    logger.info(`   Technical Skills: ${testProfile.skills.technical.length}`);
    logger.info(`   Soft Skills: ${testProfile.skills.soft.length}`);
    logger.info(`   Work Experience: ${testProfile.workExperience.length}`);
    logger.info(`   Internships: ${testProfile.experience.internships.length}`);
    logger.info(`   Education: ${testProfile.education.university.name}`);
    logger.info(`   Target Job: ${testProfile.targetJob.title}\n`);

    logger.info('📝 Sample Request for Learning Roadmap:');
    logger.info('POST /api/nlp/learning-roadmap-rag');
    logger.info('Headers: { "Authorization": "Bearer <token>" }');
    logger.info('Body:');
    logger.info(JSON.stringify({
      candidateId: userId.toString(),
      targetRole: 'Frontend Developer',
      timeframe: 12
    }, null, 2));

    logger.info('\nOr with specific job:');
    logger.info(JSON.stringify({
      candidateId: userId.toString(),
      targetJobId: '<jobId>',
      timeframe: 12
    }, null, 2));

    logger.info('\n✅ Ready to test /api/nlp/learning-roadmap-rag!');

    process.exit(0);

  } catch (error) {
    logger.error('❌ Failed to create profile:', error);
    process.exit(1);
  }
}

// Run
createTestProfile();
