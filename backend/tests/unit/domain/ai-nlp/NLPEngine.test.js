/**
 * NLPEngine Service - Unit Tests
 * Tests for natural language processing functionality
 */
const NLPEngine = require('../../../../src/domain/ai-nlp/services/NLPEngine');

describe('NLPEngine', () => {
  let nlpEngine;

  beforeEach(() => {
    nlpEngine = new NLPEngine();
  });

  describe('extractSkills', () => {
    test('should extract skills from text', async () => {
      const text =
        'I have experience with JavaScript, React, Node.js, and MongoDB.';

      const skills = await nlpEngine.extractSkills(text);

      expect(skills).toBeDefined();
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills).toContain('javascript');
    });

    test('should handle empty text', async () => {
      const skills = await nlpEngine.extractSkills('');

      expect(skills).toEqual([]);
    });

    test('should extract technical skills', async () => {
      const text =
        'Proficient in Python, Django, PostgreSQL, and AWS cloud services.';

      const skills = await nlpEngine.extractSkills(text);

      expect(skills).toContain('python');
      expect(skills).toContain('django');
    });
  });

  describe('calculateSemanticSimilarity', () => {
    test('should calculate similarity between similar texts', async () => {
      const text1 = 'Software engineer with JavaScript experience';
      const text2 = 'JavaScript developer role';

      const similarity = await nlpEngine.calculateSemanticSimilarity(
        text1,
        text2
      );

      expect(similarity).toBeDefined();
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    test('should return 1 for identical texts', async () => {
      const text = 'Full stack developer';

      const similarity = await nlpEngine.calculateSemanticSimilarity(
        text,
        text
      );

      expect(similarity).toBe(1);
    });

    test('should return low similarity for different texts', async () => {
      const text1 = 'Chef with culinary experience';
      const text2 = 'Software engineer role';

      const similarity = await nlpEngine.calculateSemanticSimilarity(
        text1,
        text2
      );

      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('analyzeSentiment', () => {
    test('should analyze positive sentiment', async () => {
      const text =
        'I love working with this amazing team and great technology stack.';

      const sentiment = await nlpEngine.analyzeSentiment(text);

      expect(sentiment).toBeDefined();
      expect(sentiment.score).toBeDefined();
      expect(sentiment.label).toBeDefined();
      expect(sentiment.score).toBeGreaterThan(0);
    });

    test('should analyze negative sentiment', async () => {
      const text = 'This project is terrible and the code quality is awful.';

      const sentiment = await nlpEngine.analyzeSentiment(text);

      expect(sentiment).toBeDefined();
      expect(sentiment.score).toBeDefined();
      expect(sentiment.label).toBeDefined();
      expect(sentiment.score).toBeLessThan(0);
    });

    test('should handle neutral text', async () => {
      const text = 'The meeting is scheduled for tomorrow.';

      const sentiment = await nlpEngine.analyzeSentiment(text);

      expect(sentiment).toBeDefined();
      expect(sentiment.score).toBeDefined();
      expect(sentiment.label).toBeDefined();
    });
  });

  describe('extractJobRequirements', () => {
    test('should extract requirements from job description', async () => {
      const jobDescription = `
        We are looking for a Senior Software Engineer with:
        - 3+ years of experience in Node.js
        - Proficiency in React and TypeScript
        - Experience with MongoDB and PostgreSQL
        - Knowledge of AWS cloud services
        - Bachelor's degree in Computer Science
      `;

      const requirements = await nlpEngine.extractJobRequirements(
        jobDescription
      );

      expect(requirements).toBeDefined();
      expect(requirements.skills).toBeDefined();
      expect(requirements.experience).toBeDefined();
      expect(requirements.education).toBeDefined();

      expect(requirements.skills).toContain('nodejs');
      expect(requirements.skills).toContain('react');
      expect(requirements.experience).toContain('3+ years');
    });

    test('should handle empty job description', async () => {
      const requirements = await nlpEngine.extractJobRequirements('');

      expect(requirements).toEqual({
        skills: [],
        experience: [],
        education: [],
        certifications: [],
      });
    });
  });

  describe('extractCandidateInfo', () => {
    test('should extract information from resume text', async () => {
      const resumeText = `
        John Doe
        Software Engineer
        2 years experience
        Skills: JavaScript, Python, React, Node.js
        Education: Bachelor of Science in Computer Science
        Contact: john.doe@email.com
      `;

      const candidateInfo = await nlpEngine.extractCandidateInfo(resumeText);

      expect(candidateInfo).toBeDefined();
      expect(candidateInfo.name).toContain('John Doe');
      expect(candidateInfo.skills).toContain('javascript');
      expect(candidateInfo.experience).toContain('2 years');
      expect(candidateInfo.education).toContain('computer science');
    });

    test('should handle minimal resume text', async () => {
      const resumeText = 'Entry level developer';

      const candidateInfo = await nlpEngine.extractCandidateInfo(resumeText);

      expect(candidateInfo).toBeDefined();
      expect(candidateInfo.skills).toBeDefined();
      expect(Array.isArray(candidateInfo.skills)).toBe(true);
    });
  });
});
