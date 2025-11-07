/**
 * Comprehensive Pre-Flight Check for Document Verification Feature
 * This script validates all dependencies and configurations before actual testing
 */

const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   Document Verification - Pre-Flight Check              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

const log = {
  pass: msg => {
    console.log(`✅ ${msg}`);
    checks.passed++;
  },
  fail: msg => {
    console.log(`❌ ${msg}`);
    checks.failed++;
  },
  warn: msg => {
    console.log(`⚠️  ${msg}`);
    checks.warnings++;
  },
  info: msg => console.log(`ℹ️  ${msg}`),
  section: msg => console.log(`\n━━━ ${msg} ━━━`),
};

// Check 1: File Existence
log.section('1. Checking File Existence');

const requiredFiles = [
  'src/application/profile/use-cases/UploadCompanyDocumentUseCase.js',
  'src/application/profile/use-cases/GetCompanyDocumentsUseCase.js',
  'src/application/profile/use-cases/DeleteCompanyDocumentUseCase.js',
  'src/presentation/controllers/documentController.js',
  'src/presentation/routes/employer.js',
  'src/infrastructure/config/container.js',
  'src/infrastructure/config/documentTypes.js',
  'src/infrastructure/repositories/CompanyRepository.js',
  'src/infrastructure/repositories/EmployerRepository.js',
  'src/infrastructure/services/external/core/UnifiedUploadService.js',
  'src/presentation/middlewares/upload.js',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    log.pass(`File exists: ${file}`);
  } else {
    log.fail(`File missing: ${file}`);
  }
});

// Check 2: Module Loading
log.section('2. Checking Module Loading');

try {
  const UploadCompanyDocumentUseCase = require('../src/application/profile/use-cases/UploadCompanyDocumentUseCase');
  log.pass('UploadCompanyDocumentUseCase loaded');

  const GetCompanyDocumentsUseCase = require('../src/application/profile/use-cases/GetCompanyDocumentsUseCase');
  log.pass('GetCompanyDocumentsUseCase loaded');

  const DeleteCompanyDocumentUseCase = require('../src/application/profile/use-cases/DeleteCompanyDocumentUseCase');
  log.pass('DeleteCompanyDocumentUseCase loaded');

  const documentController = require('../src/presentation/controllers/documentController');
  log.pass('documentController loaded');

  const documentTypes = require('../src/infrastructure/config/documentTypes');
  log.pass('documentTypes loaded');

  // Validate documentTypes exports
  if (documentTypes.validateDocumentType) {
    log.pass('validateDocumentType function exists');
  } else {
    log.fail('validateDocumentType function missing');
  }

  if (documentTypes.validateDocumentMetadata) {
    log.pass('validateDocumentMetadata function exists');
  } else {
    log.fail('validateDocumentMetadata function missing');
  }

  if (documentTypes.getVerificationProgress) {
    log.pass('getVerificationProgress function exists');
  } else {
    log.fail('getVerificationProgress function missing');
  }
} catch (error) {
  log.fail(`Module loading error: ${error.message}`);
  console.log(error.stack);
}

// Check 3: Repository Methods
log.section('3. Checking Repository Methods');

try {
  const CompanyRepository = require('../src/infrastructure/repositories/CompanyRepository');
  const companyRepo = new CompanyRepository();

  const requiredMethods = ['findById', 'update', 'create'];
  requiredMethods.forEach(method => {
    if (typeof companyRepo[method] === 'function') {
      log.pass(`CompanyRepository.${method}() exists`);
    } else {
      log.fail(`CompanyRepository.${method}() missing`);
    }
  });

  const EmployerRepository = require('../src/infrastructure/repositories/EmployerRepository');
  const employerRepo = new EmployerRepository();

  const employerMethods = ['findByUserId', 'findById'];
  employerMethods.forEach(method => {
    if (typeof employerRepo[method] === 'function') {
      log.pass(`EmployerRepository.${method}() exists`);
    } else {
      log.fail(`EmployerRepository.${method}() missing`);
    }
  });
} catch (error) {
  log.fail(`Repository check error: ${error.message}`);
}

// Check 4: UnifiedUploadService
log.section('4. Checking UnifiedUploadService');

try {
  const UnifiedUploadService = require('../src/infrastructure/services/external/core/UnifiedUploadService');

  // UnifiedUploadService is a singleton class instance
  const requiredMethods = ['uploadFile', 'deleteFile'];
  requiredMethods.forEach(method => {
    if (
      typeof UnifiedUploadService[method] === 'function' ||
      (UnifiedUploadService.prototype &&
        typeof UnifiedUploadService.prototype[method] === 'function')
    ) {
      log.pass(`UnifiedUploadService.${method}() exists`);
    } else {
      log.fail(`UnifiedUploadService.${method}() missing`);
    }
  });
} catch (error) {
  log.fail(`UnifiedUploadService check error: ${error.message}`);
}

// Check 5: Container Configuration
log.section('5. Checking DI Container Configuration');

try {
  // Read container.js content
  const containerPath = path.join(
    __dirname,
    '..',
    'src/infrastructure/config/container.js'
  );
  const containerContent = fs.readFileSync(containerPath, 'utf8');

  const requiredRegistrations = [
    'uploadCompanyDocumentUseCase',
    'getCompanyDocumentsUseCase',
    'deleteCompanyDocumentUseCase',
    'uploadService',
  ];

  requiredRegistrations.forEach(registration => {
    if (containerContent.includes(registration)) {
      log.pass(`Container has: ${registration}`);
    } else {
      log.fail(`Container missing: ${registration}`);
    }
  });
} catch (error) {
  log.fail(`Container check error: ${error.message}`);
}

// Check 6: Routes Configuration
log.section('6. Checking Routes Configuration');

try {
  const routesPath = path.join(
    __dirname,
    '..',
    'src/presentation/routes/employer.js'
  );
  const routesContent = fs.readFileSync(routesPath, 'utf8');

  const requiredRoutes = [
    '/documents',
    '/documents/upload',
    'uploadDocument',
    'getDocuments',
    'deleteDocument',
  ];

  requiredRoutes.forEach(route => {
    if (routesContent.includes(route)) {
      log.pass(`Route includes: ${route}`);
    } else {
      log.fail(`Route missing: ${route}`);
    }
  });
} catch (error) {
  log.fail(`Routes check error: ${error.message}`);
}

// Check 7: Environment Variables
log.section('7. Checking Environment Variables');

const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'MONGO_URI',
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    log.pass(`Environment variable set: ${envVar}`);
  } else {
    log.warn(`Environment variable missing: ${envVar}`);
  }
});

// Check 8: Document Types Configuration
log.section('8. Checking Document Types Configuration');

try {
  const documentTypes = require('../src/infrastructure/config/documentTypes');

  const requiredDocTypes = ['business-license', 'tax-certificate'];

  requiredDocTypes.forEach(docType => {
    const isValid = documentTypes.validateDocumentType(docType, 'technology');
    if (isValid) {
      log.pass(`Document type configured: ${docType}`);
    } else {
      log.fail(`Document type not configured: ${docType}`);
    }
  });

  // Test metadata validation
  const testMetadata = {
    documentNumber: '123456',
    issueDate: '2020-01-01',
    issuePlace: 'Test Place',
  };

  const metadataValidation = documentTypes.validateDocumentMetadata(
    'business-license',
    testMetadata
  );

  if (metadataValidation.valid) {
    log.pass('Metadata validation works correctly');
  } else {
    log.fail(
      `Metadata validation failed: ${
        metadataValidation.error || 'Unknown error'
      }`
    );
  }
} catch (error) {
  log.fail(`Document types check error: ${error.message}`);
}

// Final Summary
log.section('Summary');

console.log(`\n📊 Check Results:`);
console.log(`   ✅ Passed: ${checks.passed}`);
console.log(`   ❌ Failed: ${checks.failed}`);
console.log(`   ⚠️  Warnings: ${checks.warnings}`);

if (checks.failed === 0) {
  console.log('\n🎉 All checks passed! System is ready for testing.');
  console.log('\n📝 Next steps:');
  console.log('   1. Start the server: npm start');
  console.log('   2. Get JWT token for employer user');
  console.log(
    '   3. Run: EMPLOYER_TOKEN="your_token" node scripts/test-document-upload.js'
  );
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}
