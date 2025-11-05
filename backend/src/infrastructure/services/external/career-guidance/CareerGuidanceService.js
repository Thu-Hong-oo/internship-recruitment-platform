const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../../config/logger');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * CareerGuidanceService - Handles career guidance features like objectives, roadmaps, and skill suggestions
 * Infrastructure Layer Service following Clean Architecture
 */
class CareerGuidanceService {
  constructor() {
    // Career guidance templates and configurations
    this.timeframes = {
      '3months': { weeks: 12, focus: 'intensive' },
      '6months': { weeks: 26, focus: 'balanced' },
      '1year': { weeks: 52, focus: 'comprehensive' },
    };
  }

  /**
   * Generate career objective based on target job and context
   * @param {Object} targetJobData - Target job information
   * @param {Object} context - Current context (experience, education, etc.)
   * @returns {Promise<Object>} Career objective suggestions
   */
  async generateCareerObjective(targetJobData, context) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Tạo career objective professional cho:
- Target job: ${targetJobData.title || 'Not specified'}
- Industry: ${targetJobData.industry || 'Not specified'}
- Level: ${targetJobData.level || 'fresher'}
- Current experience: ${JSON.stringify(context.experience || [])}
- Education: ${JSON.stringify(context.education || [])}

Yêu cầu:
- 2-3 câu ngắn gọn
- Highlight relevant skills và experience
- Show passion và commitment
- Professional tone
- Tiếng Việt

Return JSON:
{
  "suggestions": [
    "objective1",
    "objective2",
    "objective3"
  ],
  "tips": ["tip1", "tip2"]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        suggestions: [
          'Tìm kiếm vị trí ' +
            (targetJobData.title || 'developer') +
            ' để áp dụng kiến thức và kỹ năng đã học.',
          'Mong muốn đóng góp vào đội ngũ phát triển sản phẩm chất lượng cao.',
        ],
        tips: [
          'Đề cập đến kỹ năng chính của bạn',
          'Thể hiện sự nhiệt tình với công việc',
        ],
      };
    } catch (error) {
      logger.error('Career objective generation error:', error);
      return {
        suggestions: [],
        tips: [],
        error: error.message,
      };
    }
  }

  /**
   * Analyze skill gaps between current skills and target job
   * @param {Object} cvData - Current CV data
   * @param {Object} jobData - Target job data
   * @returns {Promise<Object>} Skill gap analysis
   */
  async analyzeSkillGaps(cvData, jobData) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Phân tích skill gaps giữa CV hiện tại và job requirements:

CURRENT SKILLS:
${JSON.stringify(cvData.skills, null, 2)}

TARGET JOB:
- Title: ${jobData.title}
- Description: ${jobData.description}
- Industry: ${jobData.industry}

Identify:
1. Missing critical skills
2. Skills needing improvement
3. Skills that are strong matches
4. Priority order for learning

Return JSON:
{
  "missingSkills": [
    {
      "name": "AWS",
      "category": "technical",
      "importance": "high",
      "reason": "Required for cloud deployment"
    }
  ],
  "skillsToImprove": [
    {
      "name": "React",
      "currentLevel": "beginner",
      "targetLevel": "intermediate",
      "importance": "high"
    }
  ],
  "strongSkills": [
    {
      "name": "JavaScript",
      "level": "advanced",
      "relevance": "high"
    }
  ],
  "learningPriority": [
    {
      "skill": "AWS",
      "priority": 1,
      "timeToLearn": "4-6 weeks",
      "difficulty": "medium"
    }
  ],
  "overallGapLevel": "medium" // low/medium/high
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this._analyzeSkillGapsBasic(cvData, jobData);
    } catch (error) {
      logger.error('Skill gap analysis error:', error);
      return this._analyzeSkillGapsBasic(cvData, jobData);
    }
  }

  /**
   * Basic skill gap analysis
   * @private
   */
  _analyzeSkillGapsBasic(cvData, jobData) {
    const currentSkills = Object.values(cvData.skills || {}).flat();
    const jobText = `${jobData.title} ${jobData.description}`.toLowerCase();

    const missingSkills = [];
    const skillsToImprove = [];
    const strongSkills = [];

    // Common job requirements by role
    const jobRequirements = {
      'frontend developer': [
        'react',
        'javascript',
        'html',
        'css',
        'typescript',
      ],
      'backend developer': ['node.js', 'python', 'java', 'sql', 'api'],
      'fullstack developer': ['react', 'node.js', 'javascript', 'sql', 'git'],
      'devops engineer': ['docker', 'kubernetes', 'aws', 'jenkins', 'linux'],
      'data scientist': [
        'python',
        'machine learning',
        'sql',
        'statistics',
        'pandas',
      ],
    };

    const jobTitle = jobData.title?.toLowerCase() || '';
    const requiredSkills = [];

    // Find matching job requirements
    Object.entries(jobRequirements).forEach(([role, skills]) => {
      if (jobTitle.includes(role.split(' ')[0])) {
        requiredSkills.push(...skills);
      }
    });

    // If no specific match, check job description for keywords
    if (requiredSkills.length === 0) {
      const commonTech = [
        'react',
        'angular',
        'vue',
        'node.js',
        'python',
        'java',
        'c#',
        'php',
        'aws',
        'docker',
      ];
      commonTech.forEach(tech => {
        if (jobText.includes(tech)) {
          requiredSkills.push(tech);
        }
      });
    }

    // Analyze gaps
    requiredSkills.forEach(requiredSkill => {
      const hasSkill = currentSkills.some(skill => {
        const skillName = (skill.name || skill).toLowerCase();
        return skillName.includes(requiredSkill);
      });

      if (!hasSkill) {
        missingSkills.push({
          name: requiredSkill,
          category: 'technical',
          importance: 'high',
          reason: `Required for ${jobData.title}`,
        });
      }
    });

    // Identify strong skills
    currentSkills.forEach(skill => {
      const skillName = (skill.name || skill).toLowerCase();
      if (requiredSkills.some(req => skillName.includes(req))) {
        strongSkills.push({
          name: skill.name || skill,
          level: skill.level || 'intermediate',
          relevance: 'high',
        });
      }
    });

    const gapLevel =
      missingSkills.length > 3
        ? 'high'
        : missingSkills.length > 1
        ? 'medium'
        : 'low';

    return {
      missingSkills,
      skillsToImprove,
      strongSkills,
      learningPriority: missingSkills.map((skill, index) => ({
        skill: skill.name,
        priority: index + 1,
        timeToLearn: '4-6 weeks',
        difficulty: 'medium',
      })),
      overallGapLevel: gapLevel,
    };
  }

  /**
   * Generate personalized learning roadmap
   * @param {Object} data - Roadmap generation data
   * @returns {Promise<Object>} Learning roadmap
   */
  async generateLearningRoadmap(data) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Tạo learning roadmap cá nhân hóa:

CURRENT SITUATION:
- Current Skills: ${JSON.stringify(data.currentSkills)}
- Target Job: ${data.targetJob.title}
- Skill Gaps: ${JSON.stringify(data.skillGaps)}
- Timeframe: ${data.timeframe}
- Learning Preferences: ${JSON.stringify(data.preferences)}

Create detailed roadmap with:
1. Weekly breakdown
2. Learning objectives
3. Resources (courses, books, projects)
4. Milestones and assessments
5. Success criteria

Return JSON:
{
  "roadmapTitle": "Full Stack Developer Learning Path",
  "totalDuration": "12 weeks",
  "overview": "Comprehensive plan to bridge skill gaps",
  "phases": [
    {
      "phase": 1,
      "title": "Foundation Phase",
      "duration": "4 weeks",
      "objectives": ["Master ES6", "Learn React basics"],
      "weeks": [
        {
          "week": 1,
          "focus": "JavaScript ES6",
          "learningObjectives": ["arrow functions", "destructuring"],
          "resources": [
            {
              "type": "course",
              "title": "ES6 Masterclass",
              "url": "https://...",
              "duration": "10 hours"
            }
          ],
          "projects": ["Build a calculator app"],
          "assessments": ["Complete 5 coding challenges"],
          "timeCommitment": "15 hours/week"
        }
      ]
    }
  ],
  "milestones": [
    {
      "week": 4,
      "title": "Complete React Fundamentals",
      "criteria": ["Build 3 React apps", "Pass React quiz"]
    }
  ],
  "successMetrics": [
    "Complete 80% of assignments",
    "Build 2 portfolio projects"
  ]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this._generateBasicRoadmap(data);
    } catch (error) {
      logger.error('Roadmap generation error:', error);
      return this._generateBasicRoadmap(data);
    }
  }

  /**
   * Generate basic learning roadmap
   * @private
   */
  _generateBasicRoadmap(data) {
    const timeframe =
      this.timeframes[data.timeframe] || this.timeframes['6months'];
    const skillGaps = data.skillGaps?.missingSkills || [];

    const phases = [];
    let currentWeek = 1;

    // Foundation phase
    if (skillGaps.length > 0) {
      phases.push({
        phase: 1,
        title: 'Foundation Phase',
        duration: '4 weeks',
        objectives: skillGaps
          .slice(0, 2)
          .map(skill => `Learn ${skill.name} basics`),
        weeks: [
          {
            week: currentWeek,
            focus: skillGaps[0]?.name || 'Programming Fundamentals',
            learningObjectives: ['Basic concepts', 'Hello world projects'],
            resources: [
              {
                type: 'course',
                title: 'Introduction to Programming',
                url: 'https://www.coursera.org',
                duration: '20 hours',
              },
            ],
            projects: ['Build a simple application'],
            assessments: ['Complete basic exercises'],
            timeCommitment: '10 hours/week',
          },
        ],
      });
      currentWeek += 4;
    }

    // Advanced phase
    phases.push({
      phase: 2,
      title: 'Advanced Skills Phase',
      duration: '8 weeks',
      objectives: ['Master advanced concepts', 'Build complex projects'],
      weeks: [
        {
          week: currentWeek,
          focus: 'Advanced Development',
          learningObjectives: ['Advanced patterns', 'Best practices'],
          resources: [
            {
              type: 'course',
              title: 'Advanced Development Course',
              url: 'https://www.udemy.com',
              duration: '30 hours',
            },
          ],
          projects: ['Build a full-stack application'],
          assessments: ['Code reviews', 'Project presentation'],
          timeCommitment: '15 hours/week',
        },
      ],
    });

    return {
      roadmapTitle: `${data.targetJob?.title || 'Developer'} Learning Path`,
      totalDuration: `${timeframe.weeks} weeks`,
      overview: `Personalized learning plan for ${
        data.targetJob?.title || 'your target role'
      }`,
      phases,
      milestones: [
        {
          week: 4,
          title: 'Complete Foundation Skills',
          criteria: ['Pass basic assessments', 'Complete foundation projects'],
        },
        {
          week: 12,
          title: 'Ready for Job Applications',
          criteria: ['Build portfolio projects', 'Master key skills'],
        },
      ],
      successMetrics: [
        'Complete 80% of learning objectives',
        'Build 3 portfolio projects',
        'Pass technical interviews',
      ],
    };
  }

  /**
   * Suggest skills based on target job and experience
   * @param {Object} targetJob - Target job information
   * @param {Array} experience - Current experience
   * @returns {Promise<Object>} Skill suggestions
   */
  async suggestSkills(targetJob, experience) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Gợi ý skills phù hợp cho:
- Target job: ${JSON.stringify(targetJob)}
- Current experience: ${JSON.stringify(experience)}

Return JSON:
{
  "technical": [
    {"name": "React", "importance": "high", "reason": "Required for frontend development"}
  ],
  "soft": [
    {"name": "Communication", "importance": "medium", "reason": "Important for team collaboration"}
  ],
  "trending": [
    {"name": "AI/ML", "importance": "medium", "reason": "Growing field with opportunities"}
  ]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this._suggestSkillsBasic(targetJob, experience);
    } catch (error) {
      logger.error('Skill suggestions error:', error);
      return this._suggestSkillsBasic(targetJob, experience);
    }
  }

  /**
   * Basic skill suggestions
   * @private
   */
  _suggestSkillsBasic(targetJob, experience) {
    const jobTitle = targetJob.title?.toLowerCase() || '';
    const suggestions = {
      technical: [],
      soft: [],
      trending: [],
    };

    // Technical skills based on job title
    if (jobTitle.includes('frontend') || jobTitle.includes('react')) {
      suggestions.technical = [
        {
          name: 'React',
          importance: 'high',
          reason: 'Core frontend framework',
        },
        {
          name: 'TypeScript',
          importance: 'high',
          reason: 'Type safety and better development experience',
        },
        {
          name: 'CSS/SCSS',
          importance: 'medium',
          reason: 'Styling and responsive design',
        },
      ];
    } else if (jobTitle.includes('backend') || jobTitle.includes('node')) {
      suggestions.technical = [
        {
          name: 'Node.js',
          importance: 'high',
          reason: 'Server-side JavaScript runtime',
        },
        {
          name: 'Express.js',
          importance: 'high',
          reason: 'Web application framework',
        },
        { name: 'MongoDB', importance: 'medium', reason: 'NoSQL database' },
      ];
    } else if (
      jobTitle.includes('fullstack') ||
      jobTitle.includes('full stack')
    ) {
      suggestions.technical = [
        { name: 'React', importance: 'high', reason: 'Frontend development' },
        { name: 'Node.js', importance: 'high', reason: 'Backend development' },
        {
          name: 'PostgreSQL',
          importance: 'medium',
          reason: 'Database management',
        },
      ];
    }

    // Soft skills (universal)
    suggestions.soft = [
      {
        name: 'Communication',
        importance: 'high',
        reason: 'Essential for team collaboration',
      },
      {
        name: 'Problem Solving',
        importance: 'high',
        reason: 'Core programming skill',
      },
      {
        name: 'Time Management',
        importance: 'medium',
        reason: 'Important for productivity',
      },
    ];

    // Trending skills
    suggestions.trending = [
      {
        name: 'AI/ML',
        importance: 'medium',
        reason: 'Growing field with high demand',
      },
      {
        name: 'Cloud Computing',
        importance: 'high',
        reason: 'Essential for modern development',
      },
      {
        name: 'DevOps',
        importance: 'medium',
        reason: 'Important for deployment and scaling',
      },
    ];

    return suggestions;
  }

  /**
   * Enhance experience descriptions
   * @param {Object} experienceData - Experience data to enhance
   * @returns {Promise<Object>} Enhanced experience data
   */
  async enhanceExperienceDescription(experienceData) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Enhance experience description:
${JSON.stringify(experienceData)}

Cải thiện:
1. Use action verbs
2. Quantify achievements
3. Highlight impact
4. Professional tone

Return JSON:
{
  "enhanced": "Enhanced description",
  "suggestions": ["tip1", "tip2"],
  "keywords": ["keyword1", "keyword2"]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        enhanced: experienceData.description || '',
        suggestions: [
          'Use action verbs to start sentences',
          'Include specific metrics and achievements',
        ],
        keywords: ['developed', 'implemented', 'improved', 'managed'],
      };
    } catch (error) {
      logger.error('Experience enhancement error:', error);
      return {
        enhanced: experienceData.description || '',
        suggestions: [],
        keywords: [],
        error: error.message,
      };
    }
  }

  /**
   * Get available timeframes for roadmaps
   * @returns {Object} Available timeframes
   */
  getAvailableTimeframes() {
    return { ...this.timeframes };
  }
}

module.exports = new CareerGuidanceService();
