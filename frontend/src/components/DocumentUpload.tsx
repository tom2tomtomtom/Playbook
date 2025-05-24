import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { uploadDocument } from '../api/documents';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      const response = await uploadDocument(file);
      toast.success(`Successfully uploaded ${file.name}`);
      onUploadSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div
        {...getRootProps()}
        className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="space-y-1 text-center">
          <input {...getInputProps()} />
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Uploading and processing...</p>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <p className="text-center">
                  {isDragActive
                    ? 'Drop the file here...'
                    : 'Drag and drop a PowerPoint or PDF file here, or click to select'}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Supported formats: .pptx, .ppt, .pdf (up to 100MB)
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900">Quick Tips:</h3>
        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>Upload your brand playbook or guidelines document</li>
          <li>The system will extract text, tables, and visual elements</li>
          <li>Processing may take a few moments for large documents</li>
          <li>Once uploaded, you can ask questions about the content</li>
        </ul>
      </div>
    </div>
  );
};
