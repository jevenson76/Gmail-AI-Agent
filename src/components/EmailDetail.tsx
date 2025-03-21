import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Archive, 
  ArrowLeft, 
  Clock, 
  Edit, 
  ExternalLink, 
  MessageSquare, 
  Trash2, 
  User, 
  X 
} from 'lucide-react';
import { useToast } from './ToastNotification';

interface EmailDetailProps {
  email: any;
  onClose: () => void;
  onArchive?: (emailId: string) => Promise<void>;
  onDelete?: (emailId: string) => Promise<void>;
  onReply?: (emailId: string) => Promise<void>;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  onClose,
  onArchive,
  onDelete,
  onReply
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  // Actions
  const handleArchive = async () => {
    if (!onArchive) return;
    
    try {
      setLoading('archive');
      await onArchive(email.id);
      showToast('Email archived successfully', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to archive email', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setLoading('delete');
      await onDelete(email.id);
      showToast('Email deleted successfully', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to delete email', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleReply = async () => {
    if (!onReply) return;
    
    try {
      setLoading('reply');
      await onReply(email.id);
      showToast('Reply draft created', 'success');
    } catch (error) {
      showToast('Failed to create reply', 'error');
    } finally {
      setLoading(null);
    }
  };

  // Get priority color
  const getPriorityColor = () => {
    if (email.importance_score > 7) {
      return 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/30';
    } else if (email.importance_score > 4) {
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800/30';
    } else {
      return 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {email.subject || 'No Subject'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Email metadata */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{email.sender}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(new Date(email.received_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor()}`}>
              Priority: {email.importance_score}/10
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm border border-blue-200 dark:border-blue-800/30">
              {email.category || 'Uncategorized'}
            </span>
            {email.has_draft && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm flex items-center border border-purple-200 dark:border-purple-800/30">
                <Edit className="w-3 h-3 mr-1" />
                Draft Ready
              </span>
            )}
            {email.applied_labels && email.applied_labels.length > 0 && email.applied_labels.map((label: string) => (
              <span key={label} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-full text-sm border border-gray-200 dark:border-gray-700">
                {label}
              </span>
            ))}
            {email.archived && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm flex items-center border border-gray-200 dark:border-gray-700">
                <Archive className="w-3 h-3 mr-1" />
                Archived
              </span>
            )}
          </div>
        </div>
        
        {/* Email content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Summary</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{email.ai_summary}</p>
            
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Original Email</h3>
            <div className="border dark:border-gray-700 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 whitespace-pre-wrap text-gray-800 dark:text-gray-200 max-h-80 overflow-y-auto">
              {email.content || 'No content available'}
            </div>
          </div>
          
          {email.suggested_actions && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Suggested Actions</h3>
              <div className="flex flex-wrap gap-2">
                {email.suggested_actions.map((action: string) => (
                  <span key={action} className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-md text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="p-4 border-t dark:border-gray-700 flex justify-between">
          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2"
            >
              Close
            </button>
            <a
              href={`https://mail.google.com/mail/u/0/#inbox/${email.thread_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors inline-flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open in Gmail
            </a>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleArchive}
              disabled={loading === 'archive' || email.archived}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                email.archived 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50'
              }`}
            >
              <Archive className="w-4 h-4 mr-1" />
              {loading === 'archive' ? 'Archiving...' : 'Archive'}
            </button>
            
            <button
              onClick={handleDelete}
              disabled={loading === 'delete'}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {loading === 'delete' ? 'Deleting...' : 'Delete'}
            </button>
            
            <button
              onClick={handleReply}
              disabled={loading === 'reply'}
              className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors flex items-center"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {loading === 'reply' ? 'Creating...' : 'Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 