import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface ApiKeySettingsProps {
  onApiKeySet?: () => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's already an API key set
    const existingKey = apiClient.getApiKey();
    if (existingKey) {
      setCurrentKey(existingKey);
      setApiKey(existingKey);
      setIsValid(true);
    }
  }, []);

  const handleValidateAndSet = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast.error('Invalid API key format. OpenAI API keys start with "sk-"');
      return;
    }

    setValidating(true);
    try {
      const response = await apiClient.validateApiKey(apiKey);
      
      if (response.valid) {
        apiClient.setApiKey(apiKey);
        setCurrentKey(apiKey);
        setIsValid(true);
        setModel(response.model);
        toast.success(`API key validated! Using model: ${response.model}`);
        
        if (onApiKeySet) {
          onApiKeySet();
        }
      } else {
        setIsValid(false);
        toast.error(response.message);
      }
    } catch (error: any) {
      setIsValid(false);
      toast.error('Failed to validate API key');
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveKey = () => {
    apiClient.setApiKey(null);
    setApiKey('');
    setCurrentKey(null);
    setIsValid(null);
    setModel(null);
    toast.success('API key removed');
  };

  const maskApiKey = (key: string) => {
    if (key.length < 8) return key;
    return `${key.substring(0, 3)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Key className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">OpenAI API Key</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Enter your OpenAI API key to use the application. Your key will be stored only for this session and sent directly to OpenAI.
      </p>

      {currentKey && isValid && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm text-green-800">
                Active API Key: {maskApiKey(currentKey)}
                {model && ` (${model})`}
              </span>
            </div>
            <button
              onClick={handleRemoveKey}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <div className="relative">
            <input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={validating}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {isValid === false && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm text-red-800">
                Invalid API key. Please check and try again.
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Get an API key from OpenAI →
          </a>

          <button
            onClick={handleValidateAndSet}
            disabled={validating || !apiKey.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? (
              <>
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Validating...
              </>
            ) : (
              'Set API Key'
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>Privacy:</strong> Your API key is stored only in your browser's session storage and is sent directly to OpenAI. It is never stored on our servers.
        </p>
      </div>
    </div>
  );
};
