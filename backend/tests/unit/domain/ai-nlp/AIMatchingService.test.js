/**
 * AIMatchingService - Unit Tests
 * Tests for AI-powered candidate-job matching functionality
 */
const AIMatchingService = require('../../../../src/domain/ai-nlp/services/AIMatchingService');

describe('AIMatchingService', () => {
  let aiMatchingService;
  let mockNLPEngine;
  let mockCVParser;
  let mockJobDescriptionParser;
  let mockSkillRepository;
  let mockMatchingHistoryRepository;

  beforeEach(() => {
    // Mock NLP Engine
    mockNLPEngine = {
      extractSkills: jest.fn(),
      calculateSemanticSimilarity: jest.fn(),
      analyzeSentiment: jest.fn(),
      extractJobRequirements: jest.fn(),
      extractCandidateInfo: jest.fn(),
    };

    // Mock CV Parser
    mockCVParser = {
      parseCV: jest.fn(),
    };

    // Mock Job Description Parser
    mockJobDescriptionParser = {
      parseJobDescription: jest.fn(),
    };

    // Mock Skill Repository
    mockSkillRepository = {
      findByIds: jest.fn(),
      findByNames: jest.fn(),
    };

    // Mock Matching History Repository
    mockMatchingHistoryRepository = {
      create: jest.fn(),
      findByCandidateAndJob: jest.fn(),
    };

    aiMatchingService = new AIMatchingService({
      nlpEngine: mockNLPEngine,
      cvParser: mockCVParser,
      jobDescriptionParser: mockJobDescriptionParser,
      skillRepository: mockSkillRepository,
      matchingHistoryRepository: mockMatchingHistoryRepository,
    });
  });

  describe('matchCandidateToJob', () => {
    const mockCandidate = {
      _id: 'candidate123',
      userId: 'user123',
      skills: ['javascript', 'react', 'nodejs'],
      experience: '2 years',
      education: 'Bachelor in Computer Science',
      resumeText: 'Experienced developer with JavaScript skills',
    };

    const mockJob = {
      _id: 'job123',
      title: 'Frontend Developer',
      description: 'Looking for React developer',
      requirements: ['javascript', 'react', 'html', 'css'],
      requiredExperience: '1-3 years',
    };

    test('should successfully match candidate to job', async () => {
      // Mock NLP engine responses
      mockNLPEngine.extractSkills.mockResolvedValue(['javascript', 'react']);
      mockNLPEngine.calculateSemanticSimilarity.mockResolvedValue(0.8);
      mockJobDescriptionParser.parseJobDescription.mockResolvedValue({
        skills: ['javascript', 'react'],
        experience: { min: 1, max: 3 },
        education: [{ level: 'bachelor' }],
        requirements: [],
        responsibilities: [],
        location: 'Remote',
        employmentType: 'full-time',
      });
      mockNLPEngine.extractCandidateInfo.mockResolvedValue({
        skills: ['javascript', 'react', 'nodejs'],
        experience: '2 years',
        education: 'Bachelor in Computer Science',
      });

      const result = await aiMatchingService.matchCandidateToJob(
        mockCandidate,
        mockJob
      );

      expect(result).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.skillMatch).toBeDefined();
      expect(result.experienceMatch).toBeDefined();
      expect(result.educationMatch).toBeDefined();
      expect(result.locationMatch).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should handle missing candidate data', async () => {
      await expect(
        aiMatchingService.matchCandidateToJob(null, mockJob)
      ).rejects.toThrow('Candidate data is required');
    });

    test('should handle missing job data', async () => {
      await expect(
        aiMatchingService.matchCandidateToJob(mockCandidate, null)
      ).rejects.toThrow('Job data is required');
    });

    test('should calculate skill match score correctly', async () => {
      mockNLPEngine.extractSkills
        .mockResolvedValueOnce(['javascript', 'react', 'nodejs']) // candidate skills
        .mockResolvedValueOnce(['javascript', 'react', 'html', 'css']); // job skills
      mockNLPEngine.calculateSemanticSimilarity.mockResolvedValue(0.8);
      mockJobDescriptionParser.parseJobDescription.mockResolvedValue({
        skills: ['javascript', 'react'],
        experience: { min: 1, max: 3 },
        education: [{ level: 'bachelor' }],
        requirements: [],
        responsibilities: [],
        location: 'Remote',
        employmentType: 'full-time',
      });
      mockNLPEngine.extractCandidateInfo.mockResolvedValue({
        skills: ['javascript', 'react', 'nodejs'],
        experience: '2 years',
        education: 'Bachelor in Computer Science',
      });

      const result = await aiMatchingService.matchCandidateToJob(
        mockCandidate,
        mockJob
      );

      expect(result.skillMatch).toBeDefined();
      expect(typeof result.skillMatch).toBe('number');
      expect(result.skillMatch).toBeGreaterThanOrEqual(0);
      expect(result.skillMatch).toBeLessThanOrEqual(1);
    });

    test('should generate recommendations', async () => {
      mockNLPEngine.extractSkills.mockResolvedValue(['javascript']);
      mockNLPEngine.calculateSemanticSimilarity.mockResolvedValue(0.6);
      mockJobDescriptionParser.parseJobDescription.mockResolvedValue({
        skills: ['javascript', 'react', 'nodejs'],
        experience: { min: 2, max: null },
        education: [{ level: 'bachelor' }],
        requirements: [],
        responsibilities: [],
        location: 'Remote',
        employmentType: 'full-time',
      });
      mockNLPEngine.extractCandidateInfo.mockResolvedValue({
        skills: ['javascript'],
        experience: '1 year',
        education: 'Bachelor in Computer Science',
      });

      const result = await aiMatchingService.matchCandidateToJob(
        mockCandidate,
        mockJob
      );

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('calculateSkillMatchScore', () => {
    test('should calculate perfect match when all skills match', () => {
      const candidateSkills = ['javascript', 'react', 'nodejs'];
      const jobSkills = ['javascript', 'react', 'nodejs'];

      const score = aiMatchingService.calculateSkillMatchScore(
        candidateSkills,
        jobSkills
      );

      expect(score).toBe(1);
    });

    test('should calculate partial match', () => {
      const candidateSkills = ['javascript', 'react'];
      const jobSkills = ['javascript', 'react', 'nodejs', 'mongodb'];

      const score = aiMatchingService.calculateSkillMatchScore(
        candidateSkills,
        jobSkills
      );

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    test('should return 0 when no skills match', () => {
      const candidateSkills = ['python', 'django'];
      const jobSkills = ['javascript', 'react'];

      const score = aiMatchingService.calculateSkillMatchScore(
        candidateSkills,
        jobSkills
      );

      expect(score).toBe(0);
    });
  });

  describe('calculateExperienceMatchScore', () => {
    test('should calculate experience match', () => {
      const candidateExperience = '3 years';
      const jobExperience = '2-4 years';

      const score = aiMatchingService.calculateExperienceMatchScore(
        candidateExperience,
        jobExperience
      );

      expect(score).toBeDefined();
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should handle missing experience data', () => {
      const score = aiMatchingService.calculateExperienceMatchScore(
        '',
        '2-4 years'
      );

      expect(score).toBe(0.5); // Default neutral score
    });
  });

  describe('generateRecommendations', () => {
    test('should generate skill-based recommendations', () => {
      const matchResult = {
        skillMatch: 0.5,
        experienceMatch: 0.8,
        educationMatch: 1,
        missingSkills: ['nodejs', 'mongodb'],
      };

      const recommendations =
        aiMatchingService.generateRecommendations(matchResult);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(
        recommendations.some(
          rec => rec.includes('nodejs') || rec.includes('mongodb')
        )
      ).toBe(true);
    });

    test('should generate experience-based recommendations', () => {
      const matchResult = {
        skillMatch: 0.8,
        experienceMatch: 0.3,
        educationMatch: 1,
        missingSkills: [],
      };

      const recommendations =
        aiMatchingService.generateRecommendations(matchResult);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(
        recommendations.some(rec => rec.toLowerCase().includes('experience'))
      ).toBe(true);
    });
  });
});
