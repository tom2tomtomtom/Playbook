import React, { useState } from 'react';
import { Search } from 'lucide-react';

function QuestionBox({ onAsk, disabled }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onAsk(question);
    }
  };

  const sampleQuestions = [
    "What is our primary brand color?",
    "How should the logo be used on dark backgrounds?",
    "What is our brand's tone of voice?",
    "What are the minimum size requirements for the logo?"
  ];

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your brand guidelines..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || !question.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Ask
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">Sample questions:</p>
        {sampleQuestions.map((q, index) => (
          <button
            key={index}
            onClick={() => setQuestion(q)}
            className="block text-left text-sm text-blue-600 hover:text-blue-800"
            disabled={disabled}
          >
            • {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuestionBox;
