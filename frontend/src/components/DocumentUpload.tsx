import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { UploadResponse } from '../types';

interface DocumentUploadProps {
  onUploadSuccess?: (response: UploadResponse) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      toast.error('File size exceeds 50MB limit');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await apiClient.uploadPlaybook(file, (progress) => {
        setUploadProgress(progress);
      });

      setLastUpload(response);
      toast.success(`Successfully uploaded ${response.filename}`);
      
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {uploading ? (
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
              </div>
            ) : (
              <Upload className="h-16 w-16 text-gray-400" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive
                ? 'Drop the file here'
                : 'Drag and drop your brand playbook here'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              or click to select a file
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Supported formats: PDF, PowerPoint (PPT/PPTX), Word (DOC/DOCX)
            </p>
            <p className="text-xs text-gray-400">
              Maximum file size: 50MB
            </p>
          </div>
        </div>
      </div>

      {lastUpload && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">
                Upload Successful
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>File:</strong> {lastUpload.filename}</p>
                <p><strong>Playbook ID:</strong> {lastUpload.playbook_id}</p>
                <p><strong>Chunks processed:</strong> {lastUpload.chunk_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
