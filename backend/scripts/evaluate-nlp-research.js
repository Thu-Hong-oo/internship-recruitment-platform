#!/usr/bin/env node

/**
 * NLP Research Evaluation Script
 * Generates comprehensive research metrics and benchmarks
 */

const AdvancedNLPEngine = require('../src/domain/ai-nlp/services/AdvancedNLPEngine');
const fs = require('fs');
const path = require('path');

class NLPResearchEvaluator {
  constructor() {
    this.nlpEngine = new AdvancedNLPEngine();
    this.results = {
      performance: {},
      accuracy: {},
      research: {},
    };
  }

  async runFullEvaluation() {
    console.log('Starting NLP Research Evaluation...\n');

    try {
      await this.evaluatePerformance();
      await this.evaluateAccuracy();
      await this.evaluateResearchContributions();

      this.generateReport();
      this.saveResults();

      console.log('✅ Research evaluation completed successfully!');
    } catch (error) {
      console.error('❌ Evaluation failed:', error.message);
      process.exit(1);
    }
  }

  async evaluatePerformance() {
    console.log('Evaluating Performance Metrics...');

    const testCases = [
      { name: 'Simple CV', text: 'JavaScript developer with React experience' },
      {
        name: 'Medium CV',
        text: 'Full stack developer with 3 years experience in Node.js, React, and MongoDB',
      },
      {
        name: 'Complex CV',
        text: 'Senior software engineer with expertise in microservices, cloud architecture, DevOps, and agile methodologies. 5+ years experience with React, Node.js, Python, AWS, Docker, Kubernetes.'.repeat(
          3
        ),
      },
    ];

    for (const testCase of testCases) {
      const startTime = process.hrtime.bigint();

      const skills = await this.nlpEngine.extractSkills(testCase.text);
      const similarity = await this.nlpEngine.calculateSemanticSimilarity(
        testCase.text,
        'Software developer with web technologies'
      );

      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      this.results.performance[testCase.name] = {
        textLength: testCase.text.length,
        processingTime: durationMs,
        skillsExtracted: skills.length,
        similarityScore: similarity,
      };

      console.log(
        `  ${testCase.name}: ${durationMs.toFixed(2)}ms, ${
          skills.length
        } skills`
      );
    }
  }

  async evaluateAccuracy() {
    console.log('🎯 Evaluating Accuracy Metrics...');

    // Ground truth dataset (simplified for demo)
    const testDataset = [
      {
        text: 'I am a React developer with JavaScript and Node.js skills',
        expectedSkills: ['javascript', 'react', 'nodejs'],
        category: 'technical',
      },
      {
        text: 'Experienced project manager with strong communication skills',
        expectedSkills: ['communication', 'project management'],
        category: 'soft',
      },
      {
        text: 'Python developer working with machine learning and data science',
        expectedSkills: ['python', 'machine learning', 'data science'],
        category: 'technical',
      },
    ];

    let totalPrecision = 0;
    let totalRecall = 0;
    let totalF1 = 0;

    for (const testCase of testDataset) {
      const extractedSkills = await this.nlpEngine.extractSkills(testCase.text);
      const predictedSkills = extractedSkills.map(s => s.skill.toLowerCase());

      const truePositives = testCase.expectedSkills.filter(expected =>
        predictedSkills.some(predicted => predicted.includes(expected))
      ).length;

      const precision = truePositives / predictedSkills.length || 0;
      const recall = truePositives / testCase.expectedSkills.length || 0;
      const f1 =
        precision + recall > 0
          ? (2 * (precision * recall)) / (precision + recall)
          : 0;

      totalPrecision += precision;
      totalRecall += recall;
      totalF1 += f1;
    }

    const avgPrecision = totalPrecision / testDataset.length;
    const avgRecall = totalRecall / testDataset.length;
    const avgF1 = totalF1 / testDataset.length;

    this.results.accuracy = {
      precision: avgPrecision,
      recall: avgRecall,
      f1Score: avgF1,
      improvement: {
        baseline: 0.61, // From research documentation
        current: avgF1,
        gain: avgF1 - 0.61,
      },
    };

    console.log(`  Precision: ${(avgPrecision * 100).toFixed(1)}%`);
    console.log(`  Recall: ${(avgRecall * 100).toFixed(1)}%`);
    console.log(`  F1-Score: ${(avgF1 * 100).toFixed(1)}%`);
    console.log(
      `  Improvement: ${((avgF1 - 0.61) * 100).toFixed(1)}% over baseline`
    );
  }

  async evaluateResearchContributions() {
    console.log('🔬 Evaluating Research Contributions...');

    // Test Vietnamese support
    const vietnameseText =
      'Tôi là lập trình viên JavaScript với kinh nghiệm React';
    const vietnameseAnalysis = await this.nlpEngine.analyzeVietnameseCV(
      vietnameseText
    );

    // Test taxonomy classification
    const skills = await this.nlpEngine.extractSkills(
      'React JavaScript Python Docker Kubernetes'
    );
    const taxonomyCoverage =
      skills.filter(s => s.category !== 'other').length / skills.length;

    // Test hybrid approach simulation
    const complexText =
      'Senior full-stack developer with microservices architecture experience';
    const traditionalResult = await this.nlpEngine.extractSkills(complexText);

    this.results.research = {
      vietnameseSupport: {
        confidence: vietnameseAnalysis.confidence,
        languageDetected: vietnameseAnalysis.language,
      },
      taxonomyClassification: {
        coverage: taxonomyCoverage,
        categories: [...new Set(skills.map(s => s.category))],
      },
      hybridApproach: {
        traditionalSkills: traditionalResult.length,
        complexity: this._estimateComplexity(complexText),
      },
      domainSpecific: {
        skillLevels: skills.filter(s => s.level).length / skills.length,
        contextAwareness: true, // Implemented context-aware processing
      },
    };

    console.log(
      `  Vietnamese Support: ${(vietnameseAnalysis.confidence * 100).toFixed(
        1
      )}% confidence`
    );
    console.log(`  Taxonomy Coverage: ${(taxonomyCoverage * 100).toFixed(1)}%`);
    console.log(
      `  Skill Level Detection: ${(
        (skills.filter(s => s.level).length / skills.length) *
        100
      ).toFixed(1)}%`
    );
  }

  _estimateComplexity(text) {
    // Simple complexity estimation
    const words = text.split(' ').length;
    const technicalTerms = [
      'microservices',
      'architecture',
      'senior',
      'full-stack',
    ].filter(term => text.toLowerCase().includes(term)).length;

    return words * 0.1 + technicalTerms * 0.3;
  }

  generateReport() {
    console.log('\n📋 Research Evaluation Report');
    console.log('='.repeat(50));

    console.log('\n🔥 PERFORMANCE METRICS:');
    Object.entries(this.results.performance).forEach(([name, data]) => {
      console.log(`  ${name}:`);
      console.log(`    Processing Time: ${data.processingTime.toFixed(2)}ms`);
      console.log(`    Skills Extracted: ${data.skillsExtracted}`);
      console.log(`    Similarity Score: ${data.similarityScore.toFixed(3)}`);
    });

    console.log('\n🎯 ACCURACY METRICS:');
    console.log(
      `  Precision: ${(this.results.accuracy.precision * 100).toFixed(1)}%`
    );
    console.log(
      `  Recall: ${(this.results.accuracy.recall * 100).toFixed(1)}%`
    );
    console.log(
      `  F1-Score: ${(this.results.accuracy.f1Score * 100).toFixed(1)}%`
    );
    console.log(
      `  Improvement over baseline: ${(
        this.results.accuracy.improvement.gain * 100
      ).toFixed(1)}%`
    );

    console.log('\n🔬 RESEARCH CONTRIBUTIONS:');
    console.log(
      `  Vietnamese Support: ${(
        this.results.research.vietnameseSupport.confidence * 100
      ).toFixed(1)}%`
    );
    console.log(
      `  Taxonomy Coverage: ${(
        this.results.research.taxonomyClassification.coverage * 100
      ).toFixed(1)}%`
    );
    console.log(
      `  Categories: ${this.results.research.taxonomyClassification.categories.join(
        ', '
      )}`
    );
    console.log(
      `  Skill Level Detection: ${(
        this.results.research.domainSpecific.skillLevels * 100
      ).toFixed(1)}%`
    );

    console.log('\n✅ EVALUATION COMPLETE');
    console.log('Results saved to: research-evaluation-results.json');
  }

  saveResults() {
    const outputPath = path.join(
      __dirname,
      '..',
      'research-evaluation-results.json'
    );
    const resultsWithMetadata = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      description:
        'NLP Research Evaluation Results for Internship Recruitment Platform',
      ...this.results,
    };

    fs.writeFileSync(outputPath, JSON.stringify(resultsWithMetadata, null, 2));
  }
}

// Run evaluation if called directly
if (require.main === module) {
  const evaluator = new NLPResearchEvaluator();
  evaluator.runFullEvaluation().catch(console.error);
}

module.exports = NLPResearchEvaluator;
