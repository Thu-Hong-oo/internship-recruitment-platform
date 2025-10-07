// Test PDF Export với CV hiện tại
const testPDFExport = async () => {
  const cvUrl =
    'https://res.cloudinary.com/du10thaqs/raw/upload/v1759725453/internbridge/documents/ai_resume_1759725454689_htkguhggv.html';

  const requestBody = {
    cvUrl: cvUrl,
    template: 'modern',
    pdfOptions: {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
    },
    filename: 'CV_Nguyen_Thi_Thu_Hau_Senior_Full_Stack_Developer_Test.pdf',
  };

  try {
    console.log('🔄 Testing PDF export...');
    console.log('📄 CV URL:', cvUrl);
    console.log('📁 Filename:', requestBody.filename);

    const response = await fetch('/api/candidates/me/cv-builder/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ PDF exported successfully!');
      console.log('📄 PDF URL:', result.data.pdf.url);
      console.log('📊 File size:', result.data.pdf.size, 'bytes');
      console.log('📁 Filename:', result.data.pdf.filename);

      // Open PDF in new tab
      window.open(result.data.pdf.url, '_blank');

      return result.data.pdf.url;
    } else {
      console.error('❌ PDF export failed:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    return null;
  }
};

// Test với HTML content trực tiếp
const testPDFExportDirect = async htmlContent => {
  const requestBody = {
    htmlContent: htmlContent,
    template: 'modern',
    pdfOptions: {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
    },
    filename: 'CV_Direct_Export_Test.pdf',
  };

  try {
    console.log('🔄 Testing direct PDF export from HTML...');

    const response = await fetch(
      '/api/candidates/me/cv-builder/export-pdf-direct',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
        },
        body: JSON.stringify(requestBody),
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log('✅ Direct PDF export successful!');
      console.log('📄 PDF URL:', result.data.pdf.url);

      return result.data.pdf.url;
    } else {
      console.error('❌ Direct PDF export failed:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Direct export request failed:', error);
    return null;
  }
};

// Export functions for use
window.testPDFExport = testPDFExport;
window.testPDFExportDirect = testPDFExportDirect;

console.log('📋 PDF Export Test Functions Loaded');
console.log('Usage:');
console.log('1. testPDFExport() - Export from CV URL');
console.log('2. testPDFExportDirect(htmlContent) - Export from HTML content');
