'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Flag, X } from 'lucide-react';

interface ReportContextData {
  targetType: 'user' | 'project' | 'comment' | 'chat';
  targetId: string;
  reportedUserId: string;
  targetDetails?: {
    title?: string;
    description?: string;
    authorName?: string;
    content?: string;
  };
}

interface ReportContextType {
  showReportModal: (data: ReportContextData) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const useReport = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: ReportContextData;
  }>({
    visible: false,
    x: 0,
    y: 0,
    data: { targetType: 'project', targetId: '', reportedUserId: '' }
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<ReportContextData>({
    targetType: 'project',
    targetId: '',
    reportedUserId: ''
  });

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const showReportModal = (data: ReportContextData) => {
    setModalData(data);
    setModalVisible(true);
    hideContextMenu();
  };

  useEffect(() => {
    const handleClick = () => hideContextMenu();
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const reportable = target.closest('[data-reportable]');

      if (reportable) {
        e.preventDefault();

        const targetType = reportable.getAttribute('data-reportable-type') as ReportContextData['targetType'];
        const targetId = reportable.getAttribute('data-reportable-id') || '';
        const reportedUserId = reportable.getAttribute('data-reported-user-id') || '';
        const title = reportable.getAttribute('data-reportable-title') || '';
        const description = reportable.getAttribute('data-reportable-description') || '';
        const authorName = reportable.getAttribute('data-reportable-author') || '';
        const content = reportable.getAttribute('data-reportable-content') || '';

        if (targetType && targetId && reportedUserId) {
          setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            data: {
              targetType,
              targetId,
              reportedUserId,
              targetDetails: {
                title,
                description,
                authorName,
                content
              }
            }
          });
        }
      }
    };

    const handleCustomReportEvent = (e: CustomEvent) => {
      showReportModal(e.detail);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('showReportModal', handleCustomReportEvent as EventListener);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('showReportModal', handleCustomReportEvent as EventListener);
    };
  }, [showReportModal]);

  return (
    <ReportContext.Provider value={{ showReportModal }}>
      {children}

      {/* Custom Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-white border-2 border-red-200 rounded-lg shadow-2xl py-2 min-w-[180px] animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-xs font-semibold text-red-600 border-b border-red-100">
            REPORT CONTENT
          </div>
          <button
            onClick={() => showReportModal(contextMenu.data)}
            className="w-full px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50 flex items-center space-x-3 transition-colors"
          >
            <Flag className="h-4 w-4 text-red-500" />
            <span className="font-medium">Report Content</span>
          </button>
          <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
            Help keep our community safe
          </div>
        </div>
      )}

      {/* Report Modal */}
      {modalVisible && (
        <ReportModal
          data={modalData}
          onClose={() => setModalVisible(false)}
        />
      )}
    </ReportContext.Provider>
  );
};

interface ReportModalProps {
  data: ReportContextData;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ data, onClose }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'copyright_violation', label: 'Copyright Violation' },
    { value: 'fake_account', label: 'Fake Profile' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason || !description.trim()) {
      setError('Please provide both reason and description');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType: data.targetType,
          targetId: data.targetId,
          reportedUserId: data.reportedUserId,
          reason,
          description
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setReason('');
          setDescription('');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('An error occurred while submitting the report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-0 relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b border-red-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-white/50 p-1 rounded-full hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-red-100">
              <Flag className="h-6 w-6 text-red-600 fill-red-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Report Content</h2>
              <p className="text-xs text-red-600 font-medium mt-0.5">Help keep our community safe</p>
            </div>
          </div>
        </div>

        <div className="p-6">

          {success ? (
            <div className="text-center py-8">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-green-800 font-semibold mb-2">Report Submitted Successfully</div>
              <p className="text-gray-600 text-sm">Thank you for helping keep our community safe.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Report
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  required
                >
                  <option value="">Select a reason</option>
                  {reasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                  rows={4}
                  placeholder="Please provide more details about why you're reporting this content..."
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm transform active:scale-95"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// HOC to make components reportable
export const withReportable = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const ReportableComponent = (props: P & {
    reportable?: {
      type: 'user' | 'project' | 'comment' | 'chat';
      id: string;
      reportedUserId: string;
      title?: string;
      description?: string;
      authorName?: string;
      content?: string;
    };
  }) => {
    const { reportable, ...rest } = props;

    if (!reportable) {
      return <Component {...(rest as P)} />;
    }

    return (
      <div className="relative group/reportable">
        <div
          data-reportable="true"
          data-reportable-type={reportable.type}
          data-reportable-id={reportable.id}
          data-reported-user-id={reportable.reportedUserId}
          data-reportable-title={reportable.title || ''}
          data-reportable-description={reportable.description || ''}
          data-reportable-author={reportable.authorName || ''}
          data-reportable-content={reportable.content || ''}
          className="contents"
        >
          <Component {...(rest as P)} />
        </div>

        {/* Fallback Report Button for Mobile/Touch */}
        <button
          onClick={() => {
            const modalData = {
              targetType: reportable.type,
              targetId: reportable.id,
              reportedUserId: reportable.reportedUserId,
              targetDetails: {
                title: reportable.title,
                description: reportable.description,
                authorName: reportable.authorName,
                content: reportable.content
              }
            };
            // Use the context to show modal
            const event = new CustomEvent('showReportModal', { detail: modalData });
            window.dispatchEvent(event);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover/reportable:opacity-100 transition-opacity duration-200 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 z-10"
          title="Report content"
        >
          <Flag className="h-4 w-4" />
        </button>
      </div>
    );
  };

  ReportableComponent.displayName = `withReportable(${Component.displayName || Component.name})`;
  return ReportableComponent;
};
