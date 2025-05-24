import React, { useEffect, useState } from 'react';
import { DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { listDocuments, deleteDocument, Document } from '../api/documents';
import toast from 'react-hot-toast';

interface DocumentListProps {
  refreshTrigger: number;
  onDocumentsLoaded: (documents: Document[]) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ 
  refreshTrigger, 
  onDocumentsLoaded 
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [refreshTrigger]);

  const loadDocuments = async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
      onDocumentsLoaded(docs);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      await deleteDocument(documentId);
      toast.success('Document deleted successfully');
      loadDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by uploading a brand playbook.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <li key={doc.id}>
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center">
                <DocumentIcon className="h-10 w-10 text-gray-400 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                  <p className="text-sm text-gray-500">
                    Uploaded {new Date(doc.upload_date).toLocaleDateString()}
                    {doc.page_count && ` • ${doc.page_count} pages`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id, doc.filename)}
                className="ml-4 p-2 text-gray-400 hover:text-red-600"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
