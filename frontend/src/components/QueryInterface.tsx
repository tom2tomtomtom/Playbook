import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ChevronDown, Sparkles } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { Playbook, ConversationMessage, Passage } from '../types';

interface QueryInterfaceProps {
  documents: Playbook[];
}

export const QueryInterface: React.FC<QueryInterfaceProps> = ({ documents }) => {
  const [question, setQuestion] = useState('');
  const [selectedPlaybook, setSelectedPlaybook] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [showPassages, setShowPassages] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const userMessage: ConversationMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = conversation.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await apiClient.askQuestion(
        question,
        selectedPlaybook === 'all' ? undefined : selectedPlaybook,
        conversationHistory
      );

      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        passages: response.passages,
        confidence: response.confidence,
      };

      setConversation(prev => [...prev, assistantMessage]);

      // Show follow-up questions if available
      if (response.follow_up_questions && response.follow_up_questions.length > 0) {
        toast(
          <div>
            <p className="font-medium mb-2">Suggested follow-up questions:</p>
            {response.follow_up_questions.map((q: string, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setQuestion(q);
                  toast.dismiss();
                }}
                className="block text-left w-full p-2 text-sm hover:bg-gray-100 rounded"
              >
                • {q}
              </button>
            ))}
          </div>,
          {
            duration: 10000,
            position: 'bottom-right',
          }
        );
      }
    } catch (error: any) {
      console.error('Query error:', error);
      toast.error(error.response?.data?.detail || 'Failed to get answer');
      
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
        confidence: 0,
      };
      
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatPassage = (passage: Passage) => {
    return (
      <div className="border-l-2 border-gray-300 pl-3 py-2">
        <div className="text-xs text-gray-500 mb-1">
          Page {passage.page_number} • {passage.chunk_type} • Score: {passage.score.toFixed(2)}
        </div>
        <div className="text-sm text-gray-700">{passage.content}</div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Playbook Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Playbook
        </label>
        <select
          value={selectedPlaybook}
          onChange={(e) => setSelectedPlaybook(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Playbooks</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.filename}
            </option>
          ))}
        </select>
      </div>

      {/* Conversation Display */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 h-96 overflow-y-auto">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p>Ask a question about your brand playbook</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="text-sm">{msg.content}</div>
                  
                  {msg.role === 'assistant' && msg.confidence !== undefined && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={`flex items-center ${
                        msg.confidence > 0.8 ? 'text-green-600' : 
                        msg.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Confidence: {(msg.confidence * 100).toFixed(0)}%
                      </span>
                      
                      {msg.passages && msg.passages.length > 0 && (
                        <button
                          onClick={() => setShowPassages(showPassages === index ? null : index)}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <ChevronDown
                            className={`h-3 w-3 mr-1 transform transition-transform ${
                              showPassages === index ? 'rotate-180' : ''
                            }`}
                          />
                          {msg.passages.length} sources
                        </button>
                      )}
                    </div>
                  )}
                  
                  {showPassages === index && msg.passages && (
                    <div className="mt-3 space-y-2">
                      {msg.passages.map((passage, i) => (
                        <div key={i}>{formatPassage(passage)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full"></div>
                    <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full delay-100"></div>
                    <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Question Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about brand colors, logo usage, typography..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
