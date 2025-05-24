import React, { useState, useCallback } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { QueryInterface } from './components/QueryInterface';
import { DocumentList } from './components/DocumentList';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshDocuments, setRefreshDocuments] = useState(0);

  const handleUploadSuccess = useCallback(() => {
    setRefreshDocuments(prev => prev + 1);
    setActiveTab('query');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Brand Playbook Intelligence
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload brand playbooks and ask questions to get instant insights
            </p>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`${
                activeTab === 'upload'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Upload Documents
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`${
                activeTab === 'query'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Ask Questions
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`${
                activeTab === 'documents'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Documents
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
        )}
        {activeTab === 'query' && (
          <QueryInterface documents={documents} />
        )}
        {activeTab === 'documents' && (
          <DocumentList 
            refreshTrigger={refreshDocuments}
            onDocumentsLoaded={setDocuments}
          />
        )}
      </main>
    </div>
  );
}

export default App;
