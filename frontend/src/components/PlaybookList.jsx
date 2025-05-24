import React from 'react';
import { FileText, Trash2 } from 'lucide-react';

function PlaybookList({ playbooks, selectedPlaybook, onSelect, onDelete }) {
  if (playbooks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <p>No playbooks uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {playbooks.map((playbook) => (
        <div
          key={playbook.id}
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
            ${selectedPlaybook === playbook.id 
              ? 'bg-blue-50 border-2 border-blue-500' 
              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}
          onClick={() => onSelect(playbook.id)}
        >
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              {playbook.id.substring(0, 8)}...
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(playbook.id);
            }}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      
      {selectedPlaybook && (
        <p className="text-xs text-gray-500 mt-2">
          Click a playbook to search within it, or leave unselected to search all
        </p>
      )}
    </div>
  );
}

export default PlaybookList;
