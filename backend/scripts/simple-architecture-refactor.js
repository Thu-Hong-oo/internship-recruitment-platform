#!/usr/bin/env node

/**
 * Simple Architecture Refactor Script
 * Chuyển từ Clean Architecture phức tạp sang Feature-based đơn giản
 */

const fs = require('fs');
const path = require('path');

class SimpleArchitectureRefactor {
  constructor() {
    this.basePath = path.join(__dirname, '..', 'src');
  }

  /**
   * Tạo cấu trúc thư mục mới
   */
  createDirectories() {
    const dirs = [
      'features/jobs/services',
      'features/jobs/models',
      'features/users/services',
      'features/users/models',
      'features/applications/services',
      'features/applications/models',
      'features/admin/services',
      'features/admin/models',
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(this.basePath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created: ${dir}`);
      }
    });
  }

  /**
   * Refactor Job Use Cases thành simple services
   */
  refactorJobServices() {
    const useCasesPath = path.join(
      this.basePath,
      'application/recruitment/use-cases'
    );
    const servicesPath = path.join(this.basePath, 'features/jobs/services');

    // Đọc tất cả use case files
    const files = fs.readdirSync(useCasesPath).filter(f => f.endsWith('.js'));

    files.forEach(file => {
      const useCasePath = path.join(useCasesPath, file);
      let content = fs.readFileSync(useCasePath, 'utf8');

      // Đơn giản hóa class thành function export
      const className = file.replace('.js', '').replace('UseCase', '');
      const functionName = this.toCamelCase(className);

      // Thay thế class structure thành simple function
      content = content.replace(
        /const \{ logger \} = require\('[\.\/]*shared\/utils\/logger'\);\s*\n/g,
        ''
      );

      content = content.replace(
        /class \w+UseCase \{\s*\n[\s\S]*?constructor\(([\s\S]*?)\) \{([\s\S]*?)\}/,
        `const ${functionName} = ({${this.extractDependencies(content)}}) => {`
      );

      // Thay thế execute method thành direct function
      content = content.replace(
        /async execute\((.*?)\) \{([\s\S]*)\}/,
        `return async ($1) => {$2};`
      );

      // Thay thế this. thành direct calls
      content = content.replace(/this\./g, '');

      // Thêm export
      content += `\n\nmodule.exports = ${functionName};`;

      // Ghi file mới
      const newFileName = file.replace('UseCase.js', '.js').toLowerCase();
      const newPath = path.join(servicesPath, newFileName);
      fs.writeFileSync(newPath, content);

      console.log(`✅ Refactored: ${file} -> ${newFileName}`);
    });
  }

  /**
   * Extract dependencies từ constructor
   */
  extractDependencies(content) {
    const constructorMatch = content.match(/constructor\(([\s\S]*?)\) \{/);
    if (!constructorMatch) return '';

    const params = constructorMatch[1]
      .split(',')
      .map(p => p.trim().split(' ')[1]) // Lấy tên parameter
      .filter(p => p)
      .join(', ');

    return params;
  }

  /**
   * Convert PascalCase to camelCase
   */
  toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Tạo index file cho jobs feature
   */
  createJobIndex() {
    const indexPath = path.join(this.basePath, 'features/jobs/index.js');
    const content = `const createJob = require('./services/create-job');
const getJob = require('./services/get-job');
const getAllJobs = require('./services/get-all-jobs');
const updateJob = require('./services/update-job');
const deleteJob = require('./services/delete-job');

module.exports = {
  create: createJob,
  get: getJob,
  getAll: getAllJobs,
  update: updateJob,
  delete: deleteJob
};`;

    fs.writeFileSync(indexPath, content);
    console.log('✅ Created: features/jobs/index.js');
  }

  /**
   * Refactor Job Controller thành simple functions
   */
  refactorJobController() {
    const controllerPath = path.join(
      this.basePath,
      'presentation/controllers/jobPostController.js'
    );
    let content = fs.readFileSync(controllerPath, 'utf8');

    // Thay thế class thành simple functions
    content = content.replace(
      /const asyncHandler = require\('express-async-handler'\);\s*const \{ logger \} = require\('[\.\/]*shared\/utils\/logger'\);\s*\/\/ Use cases will be injected via constructor\s*const JobResponseDTO = require\('[\.\/]*dtos\/JobResponseDTO'\);\s*\nclass JobPostController \{\s*constructor\([\s\S]*?\) \{\s*[\s\S]*?\}\s*\n/g,
      `const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const jobService = require('../../features/jobs');
const JobResponseDTO = require('../dtos/JobResponseDTO');

`
    );

    // Thay thế methods thành functions
    content = content.replace(
      /async createJobPost\(req, res\) \{/g,
      'const createJobPost = asyncHandler(async (req, res) => {'
    );
    content = content.replace(
      /async getJobPost\(req, res\) \{/g,
      'const getJobPost = asyncHandler(async (req, res) => {'
    );
    content = content.replace(
      /async getAllJobPosts\(req, res\) \{/g,
      'const getAllJobPosts = asyncHandler(async (req, res) => {'
    );
    content = content.replace(
      /async updateJobPost\(req, res\) \{/g,
      'const updateJobPost = asyncHandler(async (req, res) => {'
    );
    content = content.replace(
      /async deleteJobPost\(req, res\) \{/g,
      'const deleteJobPost = asyncHandler(async (req, res) => {'
    );

    // Thay thế this.createJobUseCase.execute thành jobService.create
    content = content.replace(
      /await this\.createJobUseCase\.execute\(/g,
      'await jobService.create('
    );
    content = content.replace(
      /await this\.getJobUseCase\.execute\(/g,
      'await jobService.get('
    );
    content = content.replace(
      /await this\.getAllJobsUseCase\.execute\(/g,
      'await jobService.getAll('
    );
    content = content.replace(
      /await this\.updateJobUseCase\.execute\(/g,
      'await jobService.update('
    );
    content = content.replace(
      /await this\.deleteJobUseCase\.execute\(/g,
      'await jobService.delete('
    );

    // Thêm export
    content +=
      '\n\nmodule.exports = {\n  createJobPost,\n  getJobPost,\n  getAllJobPosts,\n  updateJobPost,\n  deleteJobPost\n};';

    fs.writeFileSync(controllerPath, content);
    console.log('✅ Refactored: jobPostController.js');
  }

  /**
   * Chạy toàn bộ refactoring
   */
  run() {
    console.log('🚀 Starting Simple Architecture Refactoring...\n');

    try {
      this.createDirectories();
      this.refactorJobServices();
      this.createJobIndex();
      this.refactorJobController();

      console.log('\n✅ Refactoring completed successfully!');
      console.log('\n📋 New Structure:');
      console.log('src/features/jobs/');
      console.log('├── services/     # Business logic functions');
      console.log('├── models/       # Data access');
      console.log('└── index.js      # Feature API');
    } catch (error) {
      console.error('❌ Refactoring failed:', error.message);
    }
  }
}

// Chạy refactoring
if (require.main === module) {
  const refactor = new SimpleArchitectureRefactor();
  refactor.run();
}

module.exports = SimpleArchitectureRefactor;
