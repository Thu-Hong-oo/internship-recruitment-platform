// CVPreviewModal.jsx
import React, { useState } from 'react';

const CVPreviewModal = ({ cvUrl, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">CV Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(cvUrl, '_blank')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Open in New Tab
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* CV Content */}
        <div className="h-full p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Loading CV...</p>
              </div>
            </div>
          )}

          <iframe
            src={cvUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            title="CV Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default CVPreviewModal;
