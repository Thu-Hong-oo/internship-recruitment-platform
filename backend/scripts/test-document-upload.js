#!/usr/bin/env node

/**
 * Test Script for Company Document Verification API
 *
 * Usage:
 *   node test-document-upload.js
 *
 * Prerequisites:
 *   - Server running on http://localhost:5001
 *   - Valid employer JWT token
 *   - Sample PDF files in ./test-files/ directory
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001/api/employers';
const TOKEN = process.env.EMPLOYER_TOKEN || 'YOUR_EMPLOYER_JWT_TOKEN_HERE';

// Test configuration
const config = {
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: msg => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: msg =>
    console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
};

// Test functions
async function getDocuments() {
  log.section('Test 1: Get Documents & Verification Status');
  try {
    const response = await axios.get(`${BASE_URL}/documents`, config);
    log.success('GET /documents - Success');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    log.error(
      `GET /documents - Failed: ${error.response?.data?.error || error.message}`
    );
    throw error;
  }
}

async function uploadDocument(documentType, filePath, metadata) {
  log.section(`Test 2: Upload ${documentType}`);
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      log.warn(`File not found: ${filePath}`);
      log.info('Creating dummy file for testing...');
      // Create a dummy PDF file
      fs.writeFileSync(filePath, '%PDF-1.4 Dummy PDF for testing');
    }

    const form = new FormData();
    form.append('document', fs.createReadStream(filePath));
    form.append('documentType', documentType);
    form.append('metadata', JSON.stringify(metadata));

    const response = await axios.post(`${BASE_URL}/documents/upload`, form, {
      headers: {
        ...config.headers,
        ...form.getHeaders(),
      },
    });

    log.success(`POST /documents/upload (${documentType}) - Success`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    log.error(
      `POST /documents/upload (${documentType}) - Failed: ${
        error.response?.data?.error || error.message
      }`
    );
    if (error.response?.data) {
      console.log(
        'Error details:',
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}

async function deleteDocument(documentType) {
  log.section(`Test 3: Delete ${documentType}`);
  try {
    const response = await axios.delete(
      `${BASE_URL}/documents/${documentType}`,
      config
    );
    log.success(`DELETE /documents/${documentType} - Success`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    log.error(
      `DELETE /documents/${documentType} - Failed: ${
        error.response?.data?.error || error.message
      }`
    );
    throw error;
  }
}

// Main test flow
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Company Document Verification API Test Suite            ║');
  console.log(
    '╚════════════════════════════════════════════════════════════╝\n'
  );

  if (TOKEN === 'YOUR_EMPLOYER_JWT_TOKEN_HERE') {
    log.error(
      'Please set EMPLOYER_TOKEN environment variable or update the script'
    );
    log.info(
      'Example: EMPLOYER_TOKEN="your_jwt_token" node test-document-upload.js'
    );
    process.exit(1);
  }

  // Create test-files directory if not exists
  const testFilesDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testFilesDir)) {
    fs.mkdirSync(testFilesDir, { recursive: true });
    log.info(`Created test-files directory: ${testFilesDir}`);
  }

  try {
    // Test 1: Get initial status
    await getDocuments();

    // Test 2: Upload business license
    await uploadDocument(
      'business-license',
      path.join(testFilesDir, 'business-license.pdf'),
      {
        documentNumber: '0123456789',
        issueDate: '2020-01-15',
        issuePlace: 'Sở Kế hoạch và Đầu tư TP. HCM',
      }
    );

    // Test 3: Upload tax certificate
    await uploadDocument(
      'tax-certificate',
      path.join(testFilesDir, 'tax-certificate.pdf'),
      {
        documentNumber: '0123456789-001',
        issueDate: '2020-01-20',
      }
    );

    // Test 4: Get updated status
    await getDocuments();

    // Test 5: Upload optional document
    await uploadDocument(
      'legal-representative-id',
      path.join(testFilesDir, 'id-card.pdf'),
      {
        documentNumber: '079012345678',
        issueDate: '2019-05-10',
        issuePlace: 'Công an TP. HCM',
      }
    );

    // Test 6: Get final status
    const finalStatus = await getDocuments();

    // Print summary
    log.section('Test Summary');
    log.success('All tests completed successfully!');
    console.log('\nVerification Progress:');
    console.log(
      `  Percentage: ${finalStatus.data.verificationProgress.percentage}%`
    );
    console.log(
      `  Uploaded: ${finalStatus.data.verificationProgress.uploadedRequired}/${finalStatus.data.verificationProgress.totalRequired} required documents`
    );
    console.log(
      `  Missing: ${
        finalStatus.data.verificationProgress.missingRequired.join(', ') ||
        'None'
      }`
    );

    // Optional: Test delete (uncomment if needed)
    // await deleteDocument('legal-representative-id');

    log.info('\n✨ Test suite completed!');
  } catch (error) {
    log.error('\n❌ Test suite failed!');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { getDocuments, uploadDocument, deleteDocument };
