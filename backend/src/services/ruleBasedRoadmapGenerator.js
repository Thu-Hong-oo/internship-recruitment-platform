/**
 * Rule-Based Roadmap Generator
 * 
 * Tạo lộ trình học tập dựa trên deterministic algorithms thay vì AI
 * 
 * Căn cứ nghiên cứu:
 * - Bloom's Taxonomy (1956): Phân chia learning objectives theo levels
 * - Spaced Repetition Theory (Ebbinghaus, 1885): Milestones tại intervals
 * - Zone of Proximal Development (Vygotsky, 1978): Progression từ current → target
 * - Learning Path Design (Wenger, 1998): Phases với clear milestones
 * 
 * Lợi ích:
 * - Deterministic: Cùng input → cùng output
 * - Reproducible: Có thể test và validate
 * - Transparent: Logic rõ ràng, có thể giải thích
 * - Có căn cứ: Dựa trên learning theory cổ điển
 */

const { logger } = require('../utils/logger');

class RuleBasedRoadmapGenerator {
  constructor() {
    // Level order for progression
    this.levelOrder = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];
    
    // Bloom's Taxonomy levels
    this.bloomLevels = {
      remember: {
        keywords: ['understand', 'learn', 'identify', 'recognize', 'recall'],
        phase: 1,
        weekRange: [1, 2],
      },
      understand: {
        keywords: ['explain', 'describe', 'compare', 'summarize', 'interpret'],
        phase: 1,
        weekRange: [3, 4],
      },
      apply: {
        keywords: ['build', 'implement', 'practice', 'use', 'execute'],
        phase: 2,
        weekRange: [1, 4],
      },
      analyze: {
        keywords: ['analyze', 'optimize', 'debug', 'evaluate', 'compare'],
        phase: 3,
        weekRange: [1, 4],
      },
      create: {
        keywords: ['create', 'design', 'develop', 'build', 'lead'],
        phase: 4,
        weekRange: [1, 4],
      },
    };
    
    // Phase templates
    this.phaseTemplates = {
      1: {
        title: 'Foundation Phase',
        focus: 'fundamentals',
        description: 'Build strong foundation with core concepts and basics',
        bloomLevel: 'remember',
        preferredTypes: ['documentation', 'video', 'course'],
      },
      2: {
        title: 'Intermediate Phase',
        focus: 'practice',
        description: 'Apply knowledge through hands-on practice and projects',
        bloomLevel: 'apply',
        preferredTypes: ['course', 'video', 'project'],
      },
      3: {
        title: 'Advanced Phase',
        focus: 'mastery',
        description: 'Master advanced techniques and optimization',
        bloomLevel: 'analyze',
        preferredTypes: ['course', 'article', 'project'],
      },
      4: {
        title: 'Specialization Phase',
        focus: 'expertise',
        description: 'Become an expert and build production-ready applications',
        bloomLevel: 'create',
        preferredTypes: ['course', 'article', 'documentation'],
      },
    };
  }

  /**
   * Generate roadmap structure dựa trên rules
   * 
   * @param {Array} skillGaps - Skill gaps với priority và importance
   * @param {string} targetRole - Target role (e.g., "Frontend Developer")
   * @param {number} timeframe - Total weeks
   * @param {string} currentLevel - Current level (beginner/intermediate/advanced/expert)
   * @returns {Object} Roadmap structure với phases, weeks, milestones, successMetrics
   */
  generateStructure(skillGaps, targetRole, timeframe, currentLevel = 'beginner') {
    try {
      // 1. Determine number of phases (cá nhân hóa theo currentLevel)
      const numPhases = this._determinePhaseCount(skillGaps.length, timeframe, currentLevel);
      
      // 2. Create phases (cá nhân hóa theo currentLevel)
      const phases = this._createPhases(numPhases, timeframe, currentLevel);
      
      // 3. Distribute skills across phases based on priority và currentLevel
      const skillDistribution = this._distributeSkills(skillGaps, phases, currentLevel);
      
      // 4. Generate weeks for each phase (cá nhân hóa theo currentLevel)
      let globalWeekNumber = 1;
      for (const phase of phases) {
        const phaseSkills = skillDistribution[phase.phaseNumber] || [];
        phase.weeks = this._generateWeeks(
          phase,
          phaseSkills,
          globalWeekNumber,
          timeframe,
          currentLevel
        );
        globalWeekNumber += phase.weeks.length;
      }
      
      // 5. Generate milestones (cá nhân hóa theo currentLevel)
      const milestones = this._generateMilestones(phases, currentLevel);
      
      // 6. Generate success metrics (cá nhân hóa theo currentLevel)
      const successMetrics = this._generateSuccessMetrics(targetRole, skillGaps.length, currentLevel);
      
      // 7. Calculate difficulty
      const difficulty = this._calculateDifficulty(currentLevel, skillGaps);
      
      return {
        phases,
        milestones,
        successMetrics,
        difficulty,
      };
    } catch (error) {
      logger.error('Error generating rule-based roadmap:', error);
      throw error;
    }
  }

  /**
   * Determine phase count based on skill gaps, timeframe, và currentLevel
   * 
   * Rules:
   * - Beginner: Cần đầy đủ phases (Foundation → Intermediate → Advanced)
   * - Intermediate: Có thể bỏ qua Foundation Phase, bắt đầu từ Intermediate
   * - Advanced/Expert: Tập trung vào Advanced và Specialization, bỏ qua Foundation
   * 
   * @param {number} skillCount - Số lượng skill gaps
   * @param {number} timeframe - Total weeks
   * @param {string} currentLevel - Current level của ứng viên
   * @returns {number} Số phases phù hợp
   */
  _determinePhaseCount(skillCount, timeframe, currentLevel = 'beginner') {
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    // Base phase count dựa trên timeframe
    let basePhases;
    if (timeframe <= 8) {
      basePhases = 2;
    } else if (timeframe <= 16) {
      basePhases = 3;
    } else {
      basePhases = 4;
    }
    
    // Điều chỉnh theo currentLevel:
    // - Beginner: Giữ nguyên (cần đầy đủ phases)
    // - Intermediate: Có thể giảm 1 phase (bỏ Foundation)
    // - Advanced/Expert: Có thể giảm 1-2 phases (bỏ Foundation, có thể bỏ Intermediate)
    if (currentIndex >= 3) {
      // Advanced/Expert: Bỏ Foundation Phase
      return Math.max(2, basePhases - 1);
    } else if (currentIndex >= 2) {
      // Intermediate: Có thể bỏ Foundation nếu timeframe ngắn
      if (timeframe <= 8) {
        return 2; // Intermediate + Advanced
      }
      return basePhases - 1; // Bỏ Foundation
    }
    
    // Beginner: Giữ nguyên
    return basePhases;
  }

  /**
   * Create phases với titles và objectives (cá nhân hóa theo currentLevel)
   * 
   * @param {number} numPhases - Số phases
   * @param {number} timeframe - Total weeks
   * @param {string} currentLevel - Current level của ứng viên
   * @returns {Array} Phases array
   */
  _createPhases(numPhases, timeframe, currentLevel = 'beginner') {
    const weeksPerPhase = Math.ceil(timeframe / numPhases);
    const phases = [];
    
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    // Xác định phase bắt đầu dựa trên currentLevel
    let startPhaseNumber = 1;
    if (currentIndex >= 3) {
      // Advanced/Expert: Bỏ Foundation, bắt đầu từ Intermediate (phase 2)
      startPhaseNumber = 2;
    } else if (currentIndex >= 2) {
      // Intermediate: Có thể bỏ Foundation nếu timeframe ngắn
      if (timeframe <= 8) {
        startPhaseNumber = 2; // Bỏ Foundation
      }
    }
    
    // Tạo phases từ startPhaseNumber
    let phaseIndex = 0;
    for (let i = startPhaseNumber; i <= 4 && phaseIndex < numPhases; i++) {
      const template = this.phaseTemplates[i];
      if (!template) break;
      
      phases.push({
        phaseNumber: phaseIndex + 1, // Renumber từ 1
        originalPhaseNumber: i, // Giữ số gốc để reference
        title: template.title,
        duration: `${weeksPerPhase} weeks`,
        focus: template.focus,
        description: template.description,
        bloomLevel: template.bloomLevel,
        preferredTypes: template.preferredTypes,
        objectives: [],
        weeks: [],
      });
      phaseIndex++;
    }
    
    return phases;
  }

  /**
   * Distribute skills across phases based on priority và currentLevel
   * 
   * Algorithm:
   * 1. Sort skills by priority: critical > high > medium > low
   * 2. Distribute evenly across phases
   * 3. Critical skills go to early phases
   * 4. Advanced/Expert: Tập trung advanced skills vào early phases
   */
  _distributeSkills(skillGaps, phases, currentLevel = 'beginner') {
    // Sort by priority: critical > high > medium > low
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const levelOrder = { none: 0, beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    const sorted = [...skillGaps].sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Advanced/Expert: Ưu tiên skills có targetLevel cao hơn
      if (currentIndex >= 3) {
        const targetDiff = (levelOrder[b.targetLevel] || 2) - (levelOrder[a.targetLevel] || 2);
        if (targetDiff !== 0) return targetDiff;
      }
      
      // If same priority, sort by importance
      return b.importance - a.importance;
    });
    
    const distribution = {};
    const skillsPerPhase = Math.ceil(sorted.length / phases.length);
    
    phases.forEach((phase, index) => {
      const start = index * skillsPerPhase;
      const end = Math.min(start + skillsPerPhase, sorted.length);
      distribution[phase.phaseNumber] = sorted.slice(start, end);
    });
    
    return distribution;
  }

  /**
   * Generate weeks for a phase (cá nhân hóa theo currentLevel)
   * 
   * Algorithm:
   * 1. Calculate weeks per phase
   * 2. Distribute skills across weeks
   * 3. Generate learning objectives based on Bloom's Taxonomy và currentLevel
   * 4. Assign time commitment (cá nhân hóa theo currentLevel)
   */
  _generateWeeks(phase, skills, startWeekNumber, totalWeeks, currentLevel = 'beginner') {
    const weeks = [];
    const weeksPerPhase = parseInt(phase.duration) || Math.ceil(totalWeeks / 4);
    
    if (skills.length === 0) {
      // If no skills, create generic weeks
      for (let weekNum = 1; weekNum <= weeksPerPhase; weekNum++) {
        weeks.push(this._createGenericWeek(
          startWeekNumber + weekNum - 1,
          phase,
          weekNum,
          weeksPerPhase,
          currentLevel
        ));
      }
      return weeks;
    }
    
    // Distribute skills across weeks
    const skillsPerWeek = Math.ceil(skills.length / weeksPerPhase);
    
    for (let weekNum = 1; weekNum <= weeksPerPhase; weekNum++) {
      const skillIndex = Math.min(
        Math.floor((weekNum - 1) * skillsPerWeek),
        skills.length - 1
      );
      const weekSkills = skills.slice(skillIndex, skillIndex + skillsPerWeek);
      
      if (weekSkills.length > 0) {
        weeks.push(this._createWeek(
          startWeekNumber + weekNum - 1,
          phase,
          weekSkills,
          weekNum,
          weeksPerPhase,
          currentLevel
        ));
      } else {
        // Fallback: generic week
        weeks.push(this._createGenericWeek(
          startWeekNumber + weekNum - 1,
          phase,
          weekNum,
          weeksPerPhase,
          currentLevel
        ));
      }
    }
    
    return weeks;
  }

  /**
   * Create a week with specific skills (cá nhân hóa theo currentLevel)
   */
  _createWeek(weekNumber, phase, skills, weekIndex, totalWeeksInPhase, currentLevel = 'beginner') {
    const primarySkill = skills[0];
    const focus = skills.map(s => s.skill).join(', ');
    
    // Determine Bloom's Taxonomy level based on phase, week progress, và currentLevel
    const bloomLevel = this._determineBloomLevel(phase, weekIndex, totalWeeksInPhase, currentLevel);
    
    // Generate learning objectives (cá nhân hóa theo currentLevel)
    const learningObjectives = this._generateObjectives(
      primarySkill,
      bloomLevel,
      skills,
      currentLevel
    );
    
    // Generate projects and assessments (cá nhân hóa theo currentLevel)
    const projects = this._generateProjects(primarySkill, bloomLevel, phase, currentLevel);
    const assessments = this._generateAssessments(primarySkill, bloomLevel, phase, currentLevel);
    
    // Time commitment cá nhân hóa theo currentLevel
    const timeCommitment = this._determineTimeCommitment(currentLevel, phase.phaseNumber);
    
    return {
      weekNumber,
      focus,
      learningObjectives,
      timeCommitment,
      // Resources will be added by _enhanceWithRealResources
      resources: [],
      projects,
      assessments,
    };
  }

  /**
   * Create a generic week (fallback) - cá nhân hóa theo currentLevel
   */
  _createGenericWeek(weekNumber, phase, weekIndex, totalWeeksInPhase, currentLevel = 'beginner') {
    const bloomLevel = this._determineBloomLevel(phase, weekIndex, totalWeeksInPhase, currentLevel);
    
    // Generate projects and assessments for generic week
    const genericSkill = { skill: phase.focus || 'Programming' };
    const projects = this._generateProjects(genericSkill, bloomLevel, phase, currentLevel);
    const assessments = this._generateAssessments(genericSkill, bloomLevel, phase, currentLevel);
    
    // Time commitment cá nhân hóa theo currentLevel
    const timeCommitment = this._determineTimeCommitment(currentLevel, phase.phaseNumber);
    
    return {
      weekNumber,
      focus: `${phase.focus} - Week ${weekIndex}`,
      learningObjectives: this._generateGenericObjectives(phase, bloomLevel, currentLevel),
      timeCommitment,
      resources: [],
      projects,
      assessments,
    };
  }

  /**
   * Determine Bloom's Taxonomy level based on phase, week progress, và currentLevel
   * 
   * Advanced/Expert có thể bỏ qua remember/understand và bắt đầu từ apply/analyze
   */
  _determineBloomLevel(phase, weekIndex, totalWeeksInPhase, currentLevel = 'beginner') {
    const progress = weekIndex / totalWeeksInPhase;
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    // Sử dụng originalPhaseNumber nếu có (khi bỏ qua Foundation)
    const actualPhaseNumber = phase.originalPhaseNumber || phase.phaseNumber;
    
    if (actualPhaseNumber === 1 || phase.phaseNumber === 1) {
      // Foundation: Remember → Understand
      // Advanced/Expert có thể bỏ qua remember
      if (currentIndex >= 3) {
        return progress < 0.5 ? 'understand' : 'apply';
      }
      return progress < 0.5 ? 'remember' : 'understand';
    } else if (actualPhaseNumber === 2 || phase.phaseNumber === 2) {
      // Intermediate: Understand → Apply
      // Advanced/Expert có thể bỏ qua understand
      if (currentIndex >= 3) {
        return progress < 0.5 ? 'apply' : 'analyze';
      }
      return progress < 0.5 ? 'understand' : 'apply';
    } else if (actualPhaseNumber === 3 || phase.phaseNumber === 3) {
      // Advanced: Apply → Analyze
      return progress < 0.5 ? 'apply' : 'analyze';
    } else {
      // Specialization: Analyze → Create
      return progress < 0.5 ? 'analyze' : 'create';
    }
  }

  /**
   * Generate learning objectives based on Bloom's Taxonomy và currentLevel
   */
  _generateObjectives(primarySkill, bloomLevel, allSkills, currentLevel = 'beginner') {
    const bloom = this.bloomLevels[bloomLevel] || this.bloomLevels.remember;
    const keywords = bloom.keywords;
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    const objectives = [];
    
    // Primary skill objectives - phù hợp với Bloom's Taxonomy level và currentLevel
    let levelDescription;
    if (bloomLevel === 'remember') {
      levelDescription = currentIndex >= 2 ? 'fundamentals' : 'basics';
    } else if (bloomLevel === 'understand') {
      levelDescription = currentIndex >= 3 ? 'advanced concepts' : 'fundamentals';
    } else if (bloomLevel === 'apply') {
      levelDescription = currentIndex >= 3 ? 'advanced techniques' : 'through practice';
    } else if (bloomLevel === 'analyze') {
      levelDescription = 'advanced concepts and optimization';
    } else {
      levelDescription = 'expert-level concepts';
    }
    
    objectives.push(
      `${keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1)} ${primarySkill.skill} ${levelDescription}`
    );
    
    // Additional objectives based on skill count và currentLevel
    if (allSkills.length > 1) {
      const otherSkills = allSkills.slice(1, 3); // Max 2 additional
      otherSkills.forEach(skill => {
        const desc = currentIndex >= 2 ? 'concepts' : 'fundamentals';
        objectives.push(`Learn ${skill.skill} ${desc}`);
      });
    }
    
    // Add specific objectives based on bloom level và currentLevel
    if (bloomLevel === 'apply') {
      if (currentIndex >= 3) {
        objectives.push(`Build advanced projects using ${primarySkill.skill}`);
        objectives.push(`Implement ${primarySkill.skill} best practices`);
      } else {
        objectives.push(`Build projects using ${primarySkill.skill}`);
        objectives.push(`Practice ${primarySkill.skill} exercises`);
      }
    } else if (bloomLevel === 'analyze') {
      objectives.push(`Analyze ${primarySkill.skill} architecture`);
      objectives.push(`Optimize ${primarySkill.skill} performance`);
    } else if (bloomLevel === 'create') {
      objectives.push(`Create production ${primarySkill.skill} applications`);
      objectives.push(`Design ${primarySkill.skill} solutions`);
    }
    
    return objectives.slice(0, 5); // Limit to 5 objectives
  }

  /**
   * Generate generic objectives (fallback) - cá nhân hóa theo currentLevel
   */
  _generateGenericObjectives(phase, bloomLevel, currentLevel = 'beginner') {
    const bloom = this.bloomLevels[bloomLevel] || this.bloomLevels.remember;
    const keywords = bloom.keywords;
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    const desc = currentIndex >= 2 ? 'concepts' : 'fundamentals';
    
    return [
      `${keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1)} ${phase.focus} ${desc}`,
      `Learn ${phase.focus} ${desc}`,
      currentIndex >= 3 ? `Master ${phase.focus} advanced techniques` : `Practice ${phase.focus} skills`,
    ];
  }

  /**
   * Generate projects based on skill, Bloom's Taxonomy level, và currentLevel
   * @param {Object} skill - Skill object with skill name
   * @param {string} bloomLevel - Bloom's Taxonomy level
   * @param {Object} phase - Phase object
   * @param {string} currentLevel - Current level của ứng viên
   * @returns {Array} Array of project objects
   */
  _generateProjects(skill, bloomLevel, phase, currentLevel = 'beginner') {
    const skillName = skill?.skill || 'Programming';
    const projects = [];
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    // Sử dụng originalPhaseNumber nếu có
    const actualPhaseNumber = phase.originalPhaseNumber || phase.phaseNumber;
    
    // Determine project based on phase number và currentLevel
    if (actualPhaseNumber === 1 || phase.phaseNumber === 1) {
      // Foundation phase: Simple practice projects
      // Advanced/Expert có thể bỏ qua beginner projects
      if (currentIndex >= 3) {
        projects.push({
          title: `${skillName} Fundamentals Project`,
          description: `Build a ${skillName} project to reinforce fundamental concepts. Apply knowledge through hands-on practice.`,
          difficulty: 'intermediate',
          estimatedTime: '8-12 hours',
          skills: [skillName],
        });
      } else {
        projects.push({
          title: `${skillName} Basics Practice Project`,
          description: `Build a simple ${skillName} application to practice fundamentals. Create a basic project that demonstrates core concepts learned this week.`,
          difficulty: 'beginner',
          estimatedTime: '5-8 hours',
          skills: [skillName],
        });
      }
    } else if (actualPhaseNumber === 2 || phase.phaseNumber === 2) {
      // Intermediate phase: Practical application projects
      if (currentIndex >= 3) {
        // Advanced/Expert: Bỏ qua beginner projects
        projects.push({
          title: `${skillName} Practical Application`,
          description: `Build a functional ${skillName} project that solves a real-world problem. Apply advanced concepts through hands-on development.`,
          difficulty: 'intermediate',
          estimatedTime: '10-15 hours',
          skills: [skillName],
        });
      } else if (bloomLevel === 'understand') {
        projects.push({
          title: `${skillName} Fundamentals Project`,
          description: `Build a ${skillName} project to reinforce fundamental concepts. Apply basic knowledge through hands-on practice.`,
          difficulty: 'beginner',
          estimatedTime: '6-10 hours',
          skills: [skillName],
        });
      } else {
        projects.push({
          title: `${skillName} Practical Application`,
          description: `Build a functional ${skillName} project that solves a real-world problem. Apply concepts learned through hands-on development.`,
          difficulty: 'intermediate',
          estimatedTime: '10-15 hours',
          skills: [skillName],
        });
      }
    } else if (actualPhaseNumber >= 3 || phase.phaseNumber >= 3) {
      // Advanced phase: Complex projects
      if (currentIndex >= 3) {
        projects.push({
          title: `${skillName} Advanced Production Project`,
          description: `Design and build a production-ready ${skillName} application with advanced features. Implement best practices, optimize performance, and demonstrate expert-level mastery.`,
          difficulty: 'advanced',
          estimatedTime: '20-25 hours',
          skills: [skillName],
        });
      } else {
        projects.push({
          title: `${skillName} Advanced Project`,
          description: `Design and build a production-ready ${skillName} application. Implement best practices, optimize performance, and demonstrate mastery.`,
          difficulty: 'advanced',
          estimatedTime: '15-20 hours',
          skills: [skillName],
        });
      }
    }
    
    return projects;
  }

  /**
   * Generate assessments based on skill, Bloom's Taxonomy level, và currentLevel
   * @param {Object} skill - Skill object with skill name
   * @param {string} bloomLevel - Bloom's Taxonomy level
   * @param {Object} phase - Phase object
   * @param {string} currentLevel - Current level của ứng viên
   * @returns {Array} Array of assessment objects
   */
  _generateAssessments(skill, bloomLevel, phase, currentLevel = 'beginner') {
    const skillName = skill?.skill || 'Programming';
    const assessments = [];
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    if (bloomLevel === 'remember' || bloomLevel === 'understand') {
      // Foundation: Quiz to test understanding
      // Advanced/Expert có thể bỏ qua quiz đơn giản
      if (currentIndex >= 3) {
        assessments.push({
          type: 'project',
          description: `Complete a ${skillName} project to demonstrate understanding of core concepts and best practices.`,
          passingCriteria: 'Working project with clean code and proper implementation',
        });
      } else {
        assessments.push({
          type: 'quiz',
          description: `Complete a quiz on ${skillName} fundamentals to verify understanding of core concepts.`,
          passingCriteria: 'Score at least 70% on the quiz',
        });
      }
    } else if (bloomLevel === 'apply') {
      // Intermediate: Project-based assessment
      if (currentIndex >= 3) {
        assessments.push({
          type: 'coding-challenge',
          description: `Complete a coding challenge that demonstrates ${skillName} skills and problem-solving abilities.`,
          passingCriteria: 'Solve the challenge with optimal solution and clean code',
        });
      } else {
        assessments.push({
          type: 'project',
          description: `Complete the ${skillName} practical project and demonstrate working implementation.`,
          passingCriteria: 'Working project with all required features implemented',
        });
      }
    } else if (bloomLevel === 'analyze' || bloomLevel === 'create') {
      // Advanced: Coding challenge
      assessments.push({
        type: 'coding-challenge',
        description: `Complete a coding challenge that demonstrates advanced ${skillName} skills and problem-solving abilities.`,
        passingCriteria: currentIndex >= 3 
          ? 'Solve the challenge with optimal solution, clean code, and demonstrate expert-level understanding'
          : 'Solve the challenge with optimal solution and clean code',
      });
    }
    
    return assessments;
  }

  /**
   * Generate milestones (cá nhân hóa theo currentLevel)
   * 
   * Rules:
   * - Milestone at end of each phase (except first)
   * - Major milestone at midpoint
   * - Final milestone at end
   * - Advanced/Expert: Milestones tập trung vào advanced achievements
   */
  _generateMilestones(phases, currentLevel = 'beginner') {
    const milestones = [];
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    // Midpoint milestone
    const totalWeeks = phases.reduce((sum, p) => sum + p.weeks.length, 0);
    const midpointWeek = Math.ceil(totalWeeks / 2);
    
    if (midpointWeek > 0) {
      const projectCount = currentIndex >= 3 ? 3 : 2;
      milestones.push({
        weekNumber: midpointWeek,
        title: 'Midpoint Review',
        description: 'Complete half of the learning roadmap',
        criteria: [
          'Complete all projects from first half',
          'Pass all assessments',
          `Build ${projectCount} portfolio projects`,
        ],
      });
    }
    
    // Phase completion milestones
    let currentWeek = 0;
    phases.forEach((phase, index) => {
      if (index > 0) { // Skip first phase
        currentWeek += phase.weeks.length;
        const criteria = currentIndex >= 3
          ? [
              `Complete all ${phase.title} projects with advanced features`,
              `Pass ${phase.title} assessments with high scores`,
              `Apply ${phase.focus} concepts in production-ready code`,
            ]
          : [
              `Complete all ${phase.title} projects`,
              `Pass ${phase.title} assessments`,
              `Apply ${phase.focus} concepts`,
            ];
        
        milestones.push({
          weekNumber: currentWeek,
          title: `Complete ${phase.title}`,
          description: `Master skills from ${phase.title}`,
          criteria,
        });
      } else {
        currentWeek += phase.weeks.length;
      }
    });
    
    return milestones;
  }

  /**
   * Generate success metrics (cá nhân hóa theo currentLevel)
   */
  _generateSuccessMetrics(targetRole, skillCount, currentLevel = 'beginner') {
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    const projectCount = currentIndex >= 3 
      ? Math.min(5, Math.ceil(skillCount / 2) + 2) 
      : Math.min(3, Math.ceil(skillCount / 2));
    
    const completionRate = currentIndex >= 3 ? '90%' : '80%';
    
    return [
      `Complete ${completionRate} of all exercises`,
      `Build ${projectCount} portfolio projects`,
      'Pass all weekly assessments',
      `Apply to 5 ${targetRole} positions`,
      'Complete all milestones',
    ];
  }
  
  /**
   * Determine time commitment dựa trên currentLevel và phase
   * 
   * - Beginner: Cần nhiều thời gian hơn (15-20 hours/week)
   * - Intermediate: Trung bình (12-15 hours/week)
   * - Advanced/Expert: Có thể học nhanh hơn (10-12 hours/week)
   */
  _determineTimeCommitment(currentLevel, phaseNumber) {
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const currentIndex = levelOrder[currentLevel] || 1;
    
    if (currentIndex >= 3) {
      // Advanced/Expert: Có thể học nhanh hơn
      if (phaseNumber === 1) {
        return '10-12 hours/week';
      } else if (phaseNumber >= 3) {
        return '12-15 hours/week'; // Advanced phases vẫn cần nhiều thời gian
      }
      return '10-12 hours/week';
    } else if (currentIndex >= 2) {
      // Intermediate: Trung bình
      return '12-15 hours/week';
    } else {
      // Beginner: Cần nhiều thời gian hơn
      if (phaseNumber === 1) {
        return '15-20 hours/week'; // Foundation phase cần nhiều thời gian
      }
      return '12-15 hours/week';
    }
  }

  /**
   * Calculate difficulty based on current level và skill gaps
   */
  _calculateDifficulty(currentLevel, skillGaps) {
    if (skillGaps.length === 0) return 'beginner';
    
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const current = levelOrder[currentLevel] || 1;
    
    // Calculate average target level
    const avgTargetLevel = skillGaps.reduce((sum, gap) => {
      return sum + (levelOrder[gap.targetLevel] || 2);
    }, 0) / skillGaps.length;
    
    const gap = avgTargetLevel - current;
    
    if (gap >= 2) return 'advanced';
    if (gap >= 1) return 'intermediate';
    return 'beginner';
  }
}

module.exports = new RuleBasedRoadmapGenerator();

