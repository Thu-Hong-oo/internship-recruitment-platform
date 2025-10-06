// CVBuilder.jsx - Main Component
import React, { useState } from 'react';
import CVPreviewModal from './CVPreviewModal';

const CVBuilder = () => {
  const [cvUrl, setCvUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateCV = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/candidates/me/cv-builder/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          template: 'modern',
          customization: {
            colors: {
              primary: '#2563eb',
              secondary: '#64748b',
              accent: '#10b981',
            },
            fonts: {
              heading: 'Inter',
              body: 'Inter',
            },
          },
          sections: [
            'personalInfo',
            'careerObjective',
            'experience',
            'education',
            'skills',
          ],
          targetJob: 'Senior Developer',
          format: 'html',
          setAsCurrent: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCvUrl(data.data.cv.url);
        setShowPreview(true);
        console.log('✅ CV Generated:', data.data.cv);
      } else {
        alert('Error generating CV: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error generating CV');
    } finally {
      setLoading(false);
    }
  };

  const previewCV = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/candidates/me/cv-builder/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          template: 'modern',
          customization: {
            colors: { primary: '#2563eb' },
          },
          sections: ['personalInfo', 'experience', 'skills'],
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Create blob URL for preview HTML
        const blob = new Blob([data.data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setCvUrl(url);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">CV Builder</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Generate Your Smart CV</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={previewCV}
            disabled={loading}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : '👁️ Preview CV'}
          </button>

          <button
            onClick={generateCV}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Generating...' : '🚀 Generate Smart CV'}
          </button>
        </div>

        {cvUrl && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Generated CV:</h3>
            <p className="text-sm text-gray-600 mb-3">URL: {cvUrl}</p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                View Preview
              </button>

              <button
                onClick={() => window.open(cvUrl, '_blank')}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Open in New Tab
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(cvUrl)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Copy URL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CV Preview Modal */}
      <CVPreviewModal
        cvUrl={cvUrl}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
};

export default CVBuilder;
