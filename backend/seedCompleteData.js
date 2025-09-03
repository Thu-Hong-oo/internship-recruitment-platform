const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Skill = require('./src/models/Skill');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const Job = require('./src/models/Job');
const Application = require('./src/models/Application');
const CandidateProfile = require('./src/models/CandidateProfile');
const EmployerProfile = require('./src/models/EmployerProfile');

// Import sample data
const { sampleSkills } = require('./src/data/sampleData');
const { sampleUsers } = require('./src/data/sampleData');
const { sampleCompanies } = require('./src/data/sampleData');
const { sampleJobs } = require('./src/data/sampleJobs');
const { sampleApplications } = require('./src/data/sampleApplications');

// Connect to MongoDB


async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri)
      throw new Error('MONGO_URI environment variable is not defined');

    await mongoose.connect(mongoUri);

    console.log('Database Connected Successfully');
  } catch (error) {
    console.error('Database connection error:', error.message);

    process.exit(1);
  }
}

// Clear existing data
const clearData = async () => {
  try {
    await Skill.deleteMany({});
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await CandidateProfile.deleteMany({});
    await EmployerProfile.deleteMany({});
    console.log('Existing data cleared');
  } catch (err) {
    console.error('Error clearing data:', err);
  }
};

// Seed Skills
const seedSkills = async () => {
  try {
    const skills = await Skill.insertMany(sampleSkills);
    console.log(`${skills.length} skills seeded`);
    return skills;
  } catch (err) {
    console.error('Error seeding skills:', err);
    return [];
  }
};

// Seed Users
const seedUsers = async () => {
  try {
    const users = await User.insertMany(sampleUsers);
    console.log(`${users.length} users seeded`);
    return users;
  } catch (err) {
    console.error('Error seeding users:', err);
    return [];
  }
};

// Seed Companies
const seedCompanies = async () => {
  try {
    const companies = await Company.insertMany(sampleCompanies);
    console.log(`${companies.length} companies seeded`);
    return companies;
  } catch (err) {
    console.error('Error seeding companies:', err);
    return [];
  }
};

// Create Candidate Profiles
const createCandidateProfiles = async (users, skills) => {
  try {
    const candidateProfiles = [];
    
    // Student profiles
    const students = users.filter(user => user.role === 'student');
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const profile = {
        userId: student._id,
        personalInfo: {
          dateOfBirth: student.profile.dateOfBirth,
          gender: student.profile.gender,
          phone: student.profile.phone,
          address: {
            city: student.profile.location.city,
            district: student.profile.location.district,
            fullAddress: `${student.profile.location.district}, ${student.profile.location.city}`
          },
          linkedin: `https://linkedin.com/in/${student.profile.firstName.toLowerCase()}-${student.profile.lastName.toLowerCase()}`,
          github: `https://github.com/${student.profile.firstName.toLowerCase()}${student.profile.lastName.toLowerCase()}`,
          portfolio: `https://portfolio.com/${student.profile.firstName.toLowerCase()}-${student.profile.lastName.toLowerCase()}`
        },
        education: {
          currentStatus: 'student',
          university: 'Đại học Bách khoa TP.HCM',
          major: i === 0 ? 'Công nghệ thông tin' : i === 1 ? 'Kinh tế' : 'Thiết kế đồ họa',
          degree: 'Bachelor',
          expectedGraduation: new Date('2025-06-01'),
          currentSemester: i === 0 ? 6 : i === 1 ? 8 : 4,
          gpa: 3.2 + (i * 0.3)
        },
        experience: [
          {
            type: 'project',
            title: i === 0 ? 'Web Development Project' : i === 1 ? 'Data Analysis Project' : 'UI/UX Design Project',
            company: 'Personal Project',
            description: i === 0 ? 'Built a full-stack web application using React and Node.js' : 
                        i === 1 ? 'Analyzed customer data and created visualization dashboards' : 
                        'Designed user interface for mobile application',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-03-01'),
            isCurrent: false,
            skills: i === 0 ? ['JavaScript', 'React', 'Node.js'] : 
                   i === 1 ? ['SQL', 'Excel', 'Data Analysis'] : 
                   ['Figma', 'UI Design', 'Prototyping'],
            achievements: ['Completed project successfully', 'Received positive feedback'],
            technologies: i === 0 ? ['React', 'Node.js', 'MongoDB'] : 
                         i === 1 ? ['SQL', 'Python', 'Tableau'] : 
                         ['Figma', 'Adobe Creative Suite', 'Sketch']
          }
        ],
        skills: [
          {
            skillId: skills[i % skills.length]._id,
            level: 'intermediate',
            experience: 12,
            addedAt: new Date('2024-01-01')
          },
          {
            skillId: skills[(i + 1) % skills.length]._id,
            level: 'beginner',
            experience: 6,
            addedAt: new Date('2024-02-01')
          }
        ],
        preferences: {
          internshipType: ['full-time', 'part-time'],
          duration: '3-months',
          location: ['TP.HCM', 'Hà Nội'],
          industries: i === 0 ? ['Technology', 'Software'] : 
                     i === 1 ? ['E-commerce', 'Finance'] : 
                     ['Technology', 'Design'],
          salaryExpectation: {
            min: 5000000,
            max: 10000000,
            currency: 'VND'
          }
        },
        aiAnalysis: {
          skillGaps: [
            {
              skillId: skills[(i + 2) % skills.length]._id,
              gapLevel: 'medium',
              recommendedLevel: 'intermediate',
              priority: 'high'
            }
          ],
          matchingScore: 75 + (i * 5),
          careerPath: 'entry-level',
          lastAnalyzed: new Date()
        },
        status: 'active'
      };
      
      candidateProfiles.push(profile);
    }
    
    const profiles = await CandidateProfile.insertMany(candidateProfiles);
    console.log(`${profiles.length} candidate profiles created`);
    
    // Update users with candidate profile references
    for (let i = 0; i < students.length; i++) {
      await User.findByIdAndUpdate(students[i]._id, {
        candidateProfile: profiles[i]._id
      });
    }
    
    return profiles;
  } catch (err) {
    console.error('Error creating candidate profiles:', err);
    return [];
  }
};

// Create Employer Profiles
const createEmployerProfiles = async (users, companies) => {
  try {
    const employerProfiles = [];
    
    // Employer users
    const employers = users.filter(user => user.role === 'employer');
    
    for (let i = 0; i < employers.length; i++) {
      const employer = employers[i];
      const company = companies[i];
      
      const profile = {
        userId: employer._id,
        company: {
          name: company.name,
          industry: company.industry[0],
          size: company.size === '1000+' ? 'large' : 'medium',
          website: company.website,
          description: company.description,
          foundedYear: company.foundedYear,
          headquarters: {
            city: company.location.city,
            country: company.location.country
          }
        },
        position: {
          title: i === 0 ? 'HR Manager' : i === 1 ? 'Talent Acquisition Specialist' : 'Senior HR Manager',
          department: 'Human Resources',
          level: i === 0 ? 'manager' : i === 1 ? 'mid-level' : 'senior',
          responsibilities: ['Talent acquisition', 'Employee development', 'HR strategy'],
          hiringAuthority: true
        },
        contact: {
          phone: employer.profile.phone,
          linkedin: `https://linkedin.com/in/${employer.profile.firstName.toLowerCase()}-${employer.profile.lastName.toLowerCase()}`,
          workEmail: employer.email,
          availability: 'weekdays'
        },
        preferences: {
          internshipTypes: ['full-time', 'part-time'],
          durations: ['3-months', '6-months'],
          locations: [company.location.city],
          salaryRange: {
            min: 5000000,
            max: 15000000,
            currency: 'VND'
          }
        },
        hiring: {
          totalPositions: 20,
          activePositions: 5,
          averageHiringTime: 30,
          successRate: 85
        },
        verification: {
          isVerified: true,
          verifiedAt: new Date(),
          documents: [
            {
              type: 'business-license',
              url: 'https://example.com/documents/business-license.pdf',
              filename: 'business-license.pdf',
              uploadedAt: new Date(),
              verified: true
            },
            {
              type: 'tax-certificate',
              url: 'https://example.com/documents/tax-certificate.pdf',
              filename: 'tax-certificate.pdf',
              uploadedAt: new Date(),
              verified: true
            }
          ]
        },
        status: 'active'
      };
      
      employerProfiles.push(profile);
    }
    
    const profiles = await EmployerProfile.insertMany(employerProfiles);
    console.log(`${profiles.length} employer profiles created`);
    
    // Update users with employer profile references
    for (let i = 0; i < employers.length; i++) {
      await User.findByIdAndUpdate(employers[i]._id, {
        employerProfile: profiles[i]._id
      });
    }
    
    return profiles;
  } catch (err) {
    console.error('Error creating employer profiles:', err);
    return [];
  }
};

// Seed Jobs with proper relationships
const seedJobs = async (companies, users, skills) => {
  try {
    const jobs = [];
    
    for (let i = 0; i < sampleJobs.length; i++) {
      const jobData = sampleJobs[i];
      const company = companies[i % companies.length];
      
      // Find employer based on company
      let employer;
      if (company.slug === 'fpt-software') {
        employer = users.find(user => user.email === 'hr@fpt.com.vn');
      } else if (company.slug === 'tiki') {
        employer = users.find(user => user.email === 'tuyendung@tiki.vn');
      } else if (company.slug === 'vng-corporation') {
        employer = users.find(user => user.email === 'careers@vng.com.vn');
      } else if (company.slug === 'grab-vietnam') {
        employer = users.find(user => user.email === 'hr@fpt.com.vn'); // Use FPT employer as fallback
      } else if (company.slug === 'shopee-vietnam') {
        employer = users.find(user => user.email === 'tuyendung@tiki.vn'); // Use Tiki employer as fallback
      }
      
      // Fallback to first employer if not found
      if (!employer) {
        employer = users.find(user => user.role === 'employer');
      }
      
      // Map skill names to skill IDs
      const skillMapping = {
        'JavaScript': skills.find(s => s.name === 'JavaScript'),
        'React': skills.find(s => s.name === 'React'),
        'Node.js': skills.find(s => s.name === 'Node.js'),
        'SQL': skills.find(s => s.name === 'SQL'),
        'Python': skills.find(s => s.name === 'Python'),
        'Figma': skills.find(s => s.name === 'Figma'),
        'Data Analysis': skills.find(s => s.name === 'Data Analysis'),
        'Digital Marketing': skills.find(s => s.name === 'Digital Marketing'),
        'Communication': skills.find(s => s.name === 'Communication'),
        'Problem Solving': skills.find(s => s.name === 'Problem Solving'),
        'Teamwork': skills.find(s => s.name === 'Teamwork')
      };
      
      const job = {
        ...jobData,
        companyId: company._id,
        postedBy: employer._id,
        requirements: {
          ...jobData.requirements,
          skills: jobData.requirements.skills.map((skill, index) => {
            const skillNames = ['JavaScript', 'React', 'Node.js', 'SQL', 'Python', 'Figma', 'Data Analysis', 'Digital Marketing'];
            const skillName = skillNames[index % skillNames.length];
            const skillDoc = skillMapping[skillName];
            return {
              skillId: skillDoc._id,
              level: skill.level,
              importance: skill.importance
            };
          })
        }
      };
      
      jobs.push(job);
    }
    
    const createdJobs = await Job.insertMany(jobs);
    console.log(`${createdJobs.length} jobs seeded`);
    return createdJobs;
  } catch (err) {
    console.error('Error seeding jobs:', err);
    return [];
  }
};

// Seed Applications with proper relationships
const seedApplications = async (jobs, users, skills) => {
  try {
    const applications = [];
    
    for (let i = 0; i < sampleApplications.length; i++) {
      const appData = sampleApplications[i];
      const job = jobs[i % jobs.length];
      const applicant = users.find(user => user.role === 'student');
      
      if (!job || !applicant) {
        console.log('Skipping application due to missing job or applicant');
        continue;
      }
      
      const application = {
        ...appData,
        job: job._id,
        applicant: applicant._id
      };
      
      applications.push(application);
    }
    
    if (applications.length > 0) {
      const createdApplications = await Application.insertMany(applications);
      console.log(`${createdApplications.length} applications seeded`);
      return createdApplications;
    } else {
      console.log('No applications to seed');
      return [];
    }
  } catch (err) {
    console.error('Error seeding applications:', err);
    return [];
  }
};

// Main seeding function
const seedData = async () => {
  try {
    await connectDB();
    await clearData();
    
    console.log('Starting data seeding...');
    
    // Seed in order
    const skills = await seedSkills();
    const users = await seedUsers();
    const companies = await seedCompanies();
    
    // Create profiles
    await createCandidateProfiles(users, skills);
    await createEmployerProfiles(users, companies);
    
    // Seed jobs and applications
    const jobs = await seedJobs(companies, users, skills);
    await seedApplications(jobs, users, skills);
    
    console.log('Data seeding completed successfully!');
    console.log('\nSeeded data summary:');
    console.log(`- ${skills.length} skills`);
    console.log(`- ${users.length} users`);
    console.log(`- ${companies.length} companies`);
    console.log(`- ${jobs.length} jobs`);
    console.log(`- 5 applications`);
    console.log(`- 3 candidate profiles`);
    console.log(`- 3 employer profiles`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

// Run seeding
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
