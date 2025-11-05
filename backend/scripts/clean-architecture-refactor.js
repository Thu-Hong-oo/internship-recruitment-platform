#!/usr/bin/env node

/**
 * Clean Architecture Refactoring Script
 * Chuyển đổi từ CQRS + Use Cases sang Clean Architecture thuần
 */

const fs = require('fs');
const path = require('path');

class CleanArchitectureRefactor {
  constructor() {
    this.basePath = path.join(__dirname, '..');
  }

  /**
   * Đọc file và parse nội dung
   */
  readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Ghi file
   */
  writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  /**
   * Refactor Job Controller
   */
  refactorJobController() {
    const controllerPath = path.join(
      this.basePath,
      'src/presentation/controllers/jobPostController.js'
    );
    let content = this.readFile(controllerPath);

    // Thay thế direct imports từ DI container
    content = content.replace(
      /const \{\s*createJobUseCase,\s*getJobUseCase,\s*getAllJobsUseCase,\s*updateJobUseCase,\s*deleteJobUseCase,\s*\} = require\('\.\.\/\.\.\/infrastructure\/config\/diContainer'\);/,
      '// Use cases will be injected via constructor'
    );

    // Thêm constructor
    const constructorPattern =
      /const JobResponseDTO = require\('\.\.\/dtos\/JobResponseDTO'\);\s*\n/;
    content = content.replace(
      constructorPattern,
      `const JobResponseDTO = require('../dtos/JobResponseDTO');

class JobPostController {
  constructor(createJobUseCase, getJobUseCase, getAllJobsUseCase, updateJobUseCase, deleteJobUseCase) {
    this.createJobUseCase = createJobUseCase;
    this.getJobUseCase = getJobUseCase;
    this.getAllJobsUseCase = getAllJobsUseCase;
    this.updateJobUseCase = updateJobUseCase;
    this.deleteJobUseCase = deleteJobUseCase;
  }

`
    );

    // Thay thế function declarations thành methods
    content = content.replace(
      /const createJobPost = asyncHandler\(async \(req, res\) => \{/g,
      '  async createJobPost(req, res) {'
    );
    content = content.replace(
      /const getJobPost = asyncHandler\(async \(req, res\) => \{/g,
      '  async getJobPost(req, res) {'
    );
    content = content.replace(
      /const getAllJobPosts = asyncHandler\(async \(req, res\) => \{/g,
      '  async getAllJobPosts(req, res) {'
    );
    content = content.replace(
      /const updateJobPost = asyncHandler\(async \(req, res\) => \{/g,
      '  async updateJobPost(req, res) {'
    );
    content = content.replace(
      /const deleteJobPost = asyncHandler\(async \(req, res\) => \{/g,
      '  async deleteJobPost(req, res) {'
    );

    // Thay thế use case calls
    content = content.replace(
      /createJobUseCase\.execute/g,
      'this.createJobUseCase.execute'
    );
    content = content.replace(
      /getJobUseCase\.execute/g,
      'this.getJobUseCase.execute'
    );
    content = content.replace(
      /getAllJobsUseCase\.execute/g,
      'this.getAllJobsUseCase.execute'
    );
    content = content.replace(
      /updateJobUseCase\.execute/g,
      'this.updateJobUseCase.execute'
    );
    content = content.replace(
      /deleteJobUseCase\.execute/g,
      'this.deleteJobUseCase.execute'
    );

    // Thêm export
    content += '\n}\n\nmodule.exports = JobPostController;';

    this.writeFile(controllerPath, content);
    console.log('✅ Refactored JobPostController');
  }

  /**
   * Cập nhật DI Container
   */
  updateDIContainer() {
    const diPath = path.join(
      this.basePath,
      'src/infrastructure/config/diContainer.js'
    );
    let content = this.readFile(diPath);

    // Thêm controller instantiation với dependencies
    const exportPattern = /module\.exports = \{\s*[\s\S]*?\};/;
    const newExport = `// Controllers with dependency injection
const JobPostController = require('../../presentation/controllers/jobPostController');
const jobPostController = new JobPostController(
  createJobUseCase,
  getJobUseCase,
  getAllJobsUseCase,
  updateJobUseCase,
  deleteJobUseCase
);

module.exports = {
  // Use Cases
  createJobUseCase,
  getJobUseCase,
  getAllJobsUseCase,
  updateJobUseCase,
  deleteJobUseCase,

  // Controllers
  jobPostController,

  // Repositories
  jobRepository,
  employerRepository,
  companyRepository,

  // Services
  validationService,
  fileUploadService,
  emailService,
};`;

    content = content.replace(exportPattern, newExport);

    this.writeFile(diPath, content);
    console.log('✅ Updated DI Container');
  }

  /**
   * Cập nhật routes để sử dụng controller instance
   */
  updateRoutes() {
    const routePath = path.join(
      this.basePath,
      'src/presentation/routes/jobPost.js'
    );
    let content = this.readFile(routePath);

    // Thay thế import controller
    content = content.replace(
      /const jobPostController = require\('\.\.\/controllers\/jobPostController'\);/,
      `const { jobPostController } = require('../../../infrastructure/config/diContainer');`
    );

    // Thay thế method calls
    content = content.replace(/jobPostController\./g, 'jobPostController.');

    this.writeFile(routePath, content);
    console.log('✅ Updated Job Routes');
  }

  /**
   * Chạy toàn bộ refactoring
   */
  run() {
    console.log('🚀 Starting Clean Architecture Refactoring...\n');

    try {
      this.refactorJobController();
      this.updateDIContainer();
      this.updateRoutes();

      console.log('\n✅ Refactoring completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Test the refactored controller');
      console.log('2. Apply same pattern to other controllers');
      console.log('3. Remove redundant command/query files');
      console.log('4. Update tests');
    } catch (error) {
      console.error('❌ Refactoring failed:', error.message);
    }
  }
}

// Chạy refactoring
if (require.main === module) {
  const refactor = new CleanArchitectureRefactor();
  refactor.run();
}

module.exports = CleanArchitectureRefactor;
