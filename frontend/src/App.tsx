import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DocumentUpload } from './components/DocumentUpload';
import { QueryInterface } from './components/QueryInterface';
import { DocumentList } from './components/DocumentList';
import { Login } from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import toast, { Toaster } from 'react-hot-toast';
import apiClient from './api/client';
import { Playbook } from './types';
import { LogOut, BarChart3 } from 'lucide-react';

function App() {
  const [documents, setDocuments] = useState<Playbook[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshDocuments, setRefreshDocuments] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(apiClient.isAuthenticated());
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

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
