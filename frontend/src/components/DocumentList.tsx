import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Download, Info, Search } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { Playbook, PlaybookListResponse } from '../types';

interface DocumentListProps {
  refreshTrigger?: number;
  onDocumentsLoaded?: (documents: Playbook[]) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ 
  refreshTrigger, 
  onDocumentsLoaded 
}) => {
  const [documents, setDocuments] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Playbook | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response: PlaybookListResponse = await apiClient.listPlaybooks(page, 10);
      setDocuments(response.playbooks);
      setTotalPages(response.total_pages);
      
      if (onDocumentsLoaded) {
        onDocumentsLoaded(response.playbooks);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playbook?')) {
      return;
    }

    setDeleting(id);
    try {
      await apiClient.deletePlaybook(id);
      toast.success('Playbook deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete playbook');
    } finally {
      setDeleting(null);
    }
  };

  const fetchSummary = async (playbook: Playbook) => {
    try {
      const summary = await apiClient.getPlaybookSummary(playbook.id);
      toast(
        <div className="max-w-md">
          <h3 className="font-bold mb-2">{playbook.filename} Summary</h3>
          <div className="text-sm">{summary.summary}</div>
        </div>,
        {
          duration: 10000,
          position: 'top-center',
        }
      );
    } catch (error) {
      toast.error('Failed to generate summary');
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredDocuments = documents.filter(doc => 
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search playbooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">
            {searchTerm ? 'No playbooks found matching your search.' : 'No playbooks uploaded yet.'}  
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredDocuments.map((doc) => (
              <li key={doc.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-10 w-10 text-gray-400" />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {doc.filename}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span className="mx-2">•</span>
                          <span>{doc.chunk_count} chunks</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => fetchSummary(doc)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Generate summary"
                      >
                        <Info className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleting === doc.id}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete playbook"
                      >
                        {deleting === doc.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === i + 1
                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};
