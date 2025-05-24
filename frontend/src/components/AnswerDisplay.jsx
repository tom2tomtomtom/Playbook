import React from 'react';
import ReactMarkdown from 'react-markdown';

function AnswerDisplay({ answer }) {
  const confidenceColor = answer.confidence > 0.8 ? 'text-green-600' : 
                         answer.confidence > 0.5 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Answer section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Answer</h3>
          <span className={`text-sm ${confidenceColor}`}>
            Confidence: {(answer.confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="prose max-w-none">
          <ReactMarkdown>{answer.answer}</ReactMarkdown>
        </div>
      </div>

      {/* Source passages */}
      {answer.passages && answer.passages.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Source Passages</h3>
          <div className="space-y-3">
            {answer.passages.map((passage, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Page {passage.metadata.page_number}
                  </span>
                  <span className="text-sm text-gray-500">
                    Relevance: {(passage.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {passage.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnswerDisplay;
