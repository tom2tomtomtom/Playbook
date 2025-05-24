import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DocumentUpload } from './components/DocumentUpload';
import { QueryInterface } from './components/QueryInterface';
import { DocumentList } from './components/DocumentList';
import { Login } from './components/Login';
import { ApiKeySettings } from './components/ApiKeySettings';
import { ErrorBoundary } from './components/ErrorBoundary';
import toast, { Toaster } from 'react-hot-toast';
import apiClient from './api/client';
import { Playbook } from './types';
import { LogOut, BarChart3, Settings, X } from 'lucide-react';

function App() {
  const [documents, setDocuments] = useState<Playbook[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshDocuments, setRefreshDocuments] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(apiClient.isAuthenticated());
  const [stats, setStats] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(apiClient.hasApiKey());

  useEffect(() => {
    if (isAuthenticated && hasApiKey) {
      fetchStats();
    }
  }, [isAuthenticated, hasApiKey]);

  useEffect(() => {
    // Show settings if no API key is set
    if (isAuthenticated && !hasApiKey) {
      setShowSettings(true);
    }
  }, [isAuthenticated, hasApiKey]);

  const fetchStats = async () => {
    try {
      const statistics = await apiClient.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleUploadSuccess = useCallback(() => {
    setRefreshDocuments(prev => prev + 1);
    setActiveTab('query');
    fetchStats();
  }, []);

  const handleLogout = () => {
    apiClient.logout();
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const handleApiKeySet = () => {
    setHasApiKey(true);
    setShowSettings(false);
    fetchStats();
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Brand Playbook Intelligence
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Upload brand playbooks and ask questions to get instant insights
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {stats && (
                  <div className="text-sm text-gray-600 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {stats.vector_store.total_playbooks} playbooks • 
                    {stats.vector_store.total_chunks} chunks
                  </div>
                )}
                
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex items-center px-3 py-2 text-sm rounded-md ${
                    hasApiKey
                      ? 'text-gray-700 hover:text-gray-900'
                      : 'text-orange-600 hover:text-orange-800 bg-orange-50'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {hasApiKey ? 'Settings' : 'Set API Key'}
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
              <div className="flex justify-between items-center p-6 pb-4">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 pb-6">
                <ApiKeySettings onApiKeySet={handleApiKeySet} />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                disabled={!hasApiKey}
                className={`${
                  activeTab === 'upload'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Upload Documents
              </button>
              <button
                onClick={() => setActiveTab('query')}
                disabled={!hasApiKey}
                className={`${
                  activeTab === 'query'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Ask Questions
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                disabled={!hasApiKey}
                className={`${
                  activeTab === 'documents'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Documents
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!hasApiKey ? (
            <div className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No API Key Set</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please set your OpenAI API key to start using the application.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowSettings(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Open Settings
                </button>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto py-4 text-center text-sm text-gray-500">
          <p>API Version: v{stats?.api_version || '2.0.0'}</p>
          {stats?.token_usage && (
            <p className="mt-1">
              Total API Cost: ${stats.token_usage.total_cost.toFixed(2)} • 
              Avg per query: ${stats.token_usage.average_cost_per_query.toFixed(4)}
            </p>
          )}
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
