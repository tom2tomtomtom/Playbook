import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { queryDocuments, Document } from '../api/documents';
import { PassageDisplay } from './PassageDisplay';
import toast from 'react-hot-toast';

interface QueryInterfaceProps {
  documents: Document[];
}

export const QueryInterface: React.FC<QueryInterfaceProps> = ({ documents }) => {
  const [question, setQuestion] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await queryDocuments({
        question,
        document_id: selectedDocument || undefined,
      });
      setResult(response);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="document" className="block text-sm font-medium text-gray-700">
            Search in specific document (optional)
          </label>
          <select
            id="document"
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All documents</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.filename}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label htmlFor="question" className="block text-sm font-medium text-gray-700">
            Ask a question about your brand playbook
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What are our primary brand colors?"
              className="block w-full rounded-md border-gray-300 pr-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={loading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Ask Question'}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Answer</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{result.answer}</p>
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
              <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
              <span>•</span>
              <span>Processing time: {result.processing_time.toFixed(2)}s</span>
            </div>
          </div>

          {result.passages && result.passages.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Source Passages
              </h3>
              <div className="space-y-4">
                {result.passages.map((passage: any, index: number) => (
                  <PassageDisplay key={index} passage={passage} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Example questions */}
      {!result && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900">Example questions:</h3>
          <ul className="mt-2 space-y-2">
            {[
              "What are our brand's core values?",
              "How should I use the logo on dark backgrounds?",
              "What fonts are approved for marketing materials?",
              "What is our brand's tone of voice?",
              "What are the minimum clear space requirements for the logo?"
            ].map((example, index) => (
              <li key={index}>
                <button
                  onClick={() => setQuestion(example)}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
