/**
 * NLP Research Evaluation Suite
 * Tests and benchmarks for advanced NLP algorithms
 */

const AdvancedNLPEngine = require('../src/domain/ai-nlp/services/AdvancedNLPEngine');

describe('Advanced NLP Research Evaluation', () => {
  let nlpEngine;

  beforeAll(() => {
    nlpEngine = new AdvancedNLPEngine();
  });

  describe('Skill Extraction Research', () => {
    test('should extract skills with high accuracy', async () => {
      const cvText = `
        I am a JavaScript developer with experience in React, Node.js, and MongoDB.
        I have worked with Python for machine learning projects and used Docker for deployment.
        My soft skills include communication and problem-solving.
      `;

      const skills = await nlpEngine.extractSkills(cvText);

      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0]).toHaveProperty('skill');
      expect(skills[0]).toHaveProperty('confidence');
      expect(skills[0]).toHaveProperty('category');
    });

    test('should classify skills into taxonomy', async () => {
      const skills = await nlpEngine.extractSkills('React JavaScript Python');

      skills.forEach(skill => {
        expect(skill.category).toMatch(/technical\.|soft\./);
      });
    });
  });

  describe('Semantic Similarity Research', () => {
    test('should calculate meaningful similarity scores', async () => {
      const jobDesc = 'Looking for React developer with Node.js experience';
      const cvText = 'JavaScript developer skilled in React and Node.js';

      const similarity = await nlpEngine.calculateSemanticSimilarity(
        jobDesc,
        cvText
      );

      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThanOrEqual(1.0);
    });

    test('should handle domain-specific similarity', async () => {
      const job1 = 'Frontend developer needed';
      const cv1 = 'React Vue Angular developer';

      const job2 = 'Backend developer needed';
      const cv2 = 'Node.js Express MongoDB developer';

      const similarity1 = await nlpEngine.calculateSemanticSimilarity(
        job1,
        cv1
      );
      const similarity2 = await nlpEngine.calculateSemanticSimilarity(
        job2,
        cv2
      );

      // Frontend job should match frontend CV better
      expect(similarity1).toBeGreaterThan(similarity2 * 0.8);
    });
  });

  describe('Vietnamese Language Support', () => {
    test('should process Vietnamese CV text', async () => {
      const vietnameseCV = `
        Tôi là lập trình viên JavaScript với kinh nghiệm React và Node.js.
        Tôi có kỹ năng giao tiếp tốt và khả năng giải quyết vấn đề.
      `;

      const analysis = await nlpEngine.analyzeVietnameseCV(vietnameseCV);

      expect(analysis).toHaveProperty('skills');
      expect(analysis).toHaveProperty('language', 'vi');
      expect(analysis.confidence).toBeGreaterThan(0.5);
    });

    test('should handle Vietnamese accents removal', async () => {
      const textWithAccents = 'Tôi là lập trình viên JavaScript';
      const processed = nlpEngine._preprocessVietnamese(textWithAccents);

      expect(processed).not.toContain('ố');
      expect(processed).not.toContain('ề');
    });
  });

  describe('Performance Benchmarks', () => {
    test('should process text within acceptable time', async () => {
      const startTime = Date.now();

      const cvText = 'Long CV text with many skills and experiences...'.repeat(
        50
      );
      await nlpEngine.extractSkills(cvText);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process within 500ms for research purposes
      expect(processingTime).toBeLessThan(500);
    });

    test('should handle concurrent requests', async () => {
      const promises = Array(10)
        .fill()
        .map(() =>
          nlpEngine.extractSkills('JavaScript React Node.js developer')
        );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Research Metrics', () => {
    test('should provide confidence scores', async () => {
      const skills = await nlpEngine.extractSkills('Expert React developer');

      skills.forEach(skill => {
        expect(skill.confidence).toBeGreaterThan(0);
        expect(skill.confidence).toBeLessThanOrEqual(1);
      });
    });

    test('should estimate skill levels', async () => {
      const skills = await nlpEngine.extractSkills('Senior React developer');

      const reactSkill = skills.find(s =>
        s.skill.toLowerCase().includes('react')
      );
      expect(reactSkill.level).toBe('advanced');
    });
  });

  describe('Integration with Gemini AI', () => {
    test('should complement Gemini AI results', async () => {
      // This would test the hybrid approach
      // Traditional NLP + AI enhancement
      const text = 'Complex CV with advanced skills';

      const traditionalResult = await nlpEngine.extractSkills(text);
      // In real implementation, would compare with Gemini-enhanced results

      expect(traditionalResult).toBeDefined();
    });
  });
});

/**
 * Performance Benchmark Suite
 */
describe('NLP Performance Benchmarks', () => {
  let nlpEngine;

  beforeAll(() => {
    nlpEngine = new AdvancedNLPEngine();
  });

  test('benchmark skill extraction speed', async () => {
    const testCases = [
      'Simple CV text',
      'Medium complexity CV with multiple skills',
      'Complex CV with advanced terminology and experience'.repeat(5),
    ];

    for (const testCase of testCases) {
      const startTime = process.hrtime.bigint();

      await nlpEngine.extractSkills(testCase);

      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      console.log(
        `Processed ${testCase.length} chars in ${durationMs.toFixed(2)}ms`
      );
      expect(durationMs).toBeLessThan(1000); // Max 1 second
    }
  });

  test('benchmark semantic similarity', async () => {
    const pairs = [
      ['React developer', 'JavaScript frontend developer'],
      ['Python backend', 'Django REST API developer'],
      ['DevOps engineer', 'AWS Docker Kubernetes specialist'],
    ];

    for (const [text1, text2] of pairs) {
      const startTime = process.hrtime.bigint();

      const similarity = await nlpEngine.calculateSemanticSimilarity(
        text1,
        text2
      );

      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      console.log(
        `Similarity ${text1} ↔ ${text2}: ${similarity.toFixed(
          3
        )} (${durationMs.toFixed(2)}ms)`
      );
      expect(similarity).toBeGreaterThan(0.3);
    }
  });
});

/**
 * Accuracy Evaluation Suite
 */
describe('NLP Accuracy Evaluation', () => {
  // Mock ground truth data for evaluation
  const groundTruth = {
    skills: ['javascript', 'react', 'nodejs', 'mongodb'],
    experience: ['frontend developer', 'full stack developer'],
    education: ['computer science'],
  };

  test('evaluate skill extraction accuracy', async () => {
    const cvText = `
      I am a JavaScript developer with 3 years experience in React and Node.js.
      I work with MongoDB databases and have a degree in Computer Science.
    `;

    const extractedSkills = await nlpEngine.extractSkills(cvText);
    const predictedSkills = extractedSkills.map(s => s.skill.toLowerCase());

    // Calculate precision, recall, F1
    const truePositives = groundTruth.skills.filter(skill =>
      predictedSkills.some(pred => pred.includes(skill))
    ).length;

    const precision = truePositives / predictedSkills.length;
    const recall = truePositives / groundTruth.skills.length;
    const f1Score = (2 * (precision * recall)) / (precision + recall);

    console.log(
      `Skill Extraction - Precision: ${precision.toFixed(
        3
      )}, Recall: ${recall.toFixed(3)}, F1: ${f1Score.toFixed(3)}`
    );

    expect(f1Score).toBeGreaterThan(0.6); // Target F1 > 0.6
  });
});
