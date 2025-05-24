import React from 'react';
import ReactMarkdown from 'react-markdown';

interface PassageDisplayProps {
  passage: {
    text: string;
    source: string;
    relevance_score: number;
    highlighted_text: string;
  };
}

export const PassageDisplay: React.FC<PassageDisplayProps> = ({ passage }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{passage.source}</span>
        <span className="text-xs text-gray-500">
          Relevance: {(passage.relevance_score * 100).toFixed(1)}%
        </span>
      </div>
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>{passage.highlighted_text || passage.text}</ReactMarkdown>
      </div>
    </div>
  );
};
