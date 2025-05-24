import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, Search, Trash2, Loader } from 'lucide-react';
import FileUpload from './components/FileUpload';
import QuestionBox from './components/QuestionBox';
import AnswerDisplay from './components/AnswerDisplay';
import PlaybookList from './components/PlaybookList';

function App() {
  const [playbooks, setPlaybooks] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState(null);

  useEffect(() => {
    fetchPlaybooks();
  }, []);

  const fetchPlaybooks = async () => {
    try {
      const response = await axios.get('/api/playbooks');
      setPlaybooks(response.data.playbooks);
    } catch (error) {
      console.error('Error fetching playbooks:', error);
    }
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert(`Successfully uploaded: ${response.data.filename}`);
      fetchPlaybooks();
    } catch (error) {
      alert(`Error uploading file: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (question) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/ask', {
        question,
        playbook_id: selectedPlaybook
      });
      setCurrentAnswer(response.data);
    } catch (error) {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaybook = async (playbookId) => {
    if (!confirm('Are you sure you want to delete this playbook?')) return;
    
    try {
      await axios.delete(`/api/playbooks/${playbookId}`);
      fetchPlaybooks();
      if (selectedPlaybook === playbookId) {
        setSelectedPlaybook(null);
      }
    } catch (error) {
      alert(`Error deleting playbook: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Brand Playbook Intelligence
              </h1>
            </div>
            {loading && (
              <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Upload Playbook</h2>
              <FileUpload onUpload={handleFileUpload} disabled={loading} />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Your Playbooks</h2>
              <PlaybookList
                playbooks={playbooks}
                selectedPlaybook={selectedPlaybook}
                onSelect={setSelectedPlaybook}
                onDelete={handleDeletePlaybook}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Ask a Question</h2>
              <QuestionBox 
                onAsk={handleAskQuestion} 
                disabled={loading || playbooks.length === 0}
              />
              {playbooks.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">
                  Upload a playbook to start asking questions
                </p>
              )}
            </div>

            {currentAnswer && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Answer</h2>
                <AnswerDisplay answer={currentAnswer} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
