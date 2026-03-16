'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Bookmark, Flag, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface PostOptionsMenuProps {
  projectId: string;
  initialIsSaved?: boolean;
  className?: string;
}

export default function PostOptionsMenu({
  projectId,
  initialIsSaved = false,
  className = ''
}: PostOptionsMenuProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveToggle = async () => {
    if (isLoading) return;

    console.log('🔍 Save toggle clicked for project:', projectId);
    setIsLoading(true);
    try {
      console.log('📤 Sending save request...');
      const response = await fetch('/api/projects/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      console.log('📊 Save response status:', response.status);
      const data = await response.json();
      console.log('📊 Save response data:', data);

      if (data.success) {
        setIsSaved(data.isSaved);
        toast.success(data.message, {
          duration: 3000,
          position: 'top-right',
        });
        console.log('✅ Save successful:', data.message);
      } else {
        toast.error(data.error || 'Failed to save post', {
          duration: 3000,
          position: 'top-right',
        });
        console.log('❌ Save failed:', data.error);
      }
    } catch (error) {
      console.error('Save post error:', error);
      toast.error('Failed to save post', {
        duration: 3000,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async () => {
    if (isLoading) return;

    // Show a simple confirmation dialog with reason selection
    const reasons = [
      { value: 'spam', label: 'Spam' },
      { value: 'inappropriate_content', label: 'Inappropriate Content' },
      { value: 'harassment', label: 'Harassment' },
      { value: 'copyright_violation', label: 'Copyright Violation' },
      { value: 'fake_account', label: 'Fake Account' },
      { value: 'other', label: 'Other' }
    ];

    const reasonChoice = prompt(
      'Please select a reason for reporting:\n\n' +
      reasons.map((r, i) => `${i + 1}. ${r.label}`).join('\n') +
      '\n\nEnter the number (1-6):'
    );

    if (reasonChoice === null) return; // User cancelled

    const reasonIndex = parseInt(reasonChoice) - 1;
    if (reasonIndex < 0 || reasonIndex >= reasons.length) {
      toast.error('Invalid selection. Please try again.', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    const selectedReason = reasons[reasonIndex].value;

    // Optional details
    const details = prompt('Additional details (optional):');
    if (details === null) return; // User cancelled

    setIsLoading(true);
    try {
      // Fetch project to get author ID
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project details');
      }
      const projectData = await projectResponse.json();

      // Debug log to inspect what data we're receiving
      console.log('📊 Post Data in Menu:', projectData);
      console.log('📊 Author field:', projectData.author);
      console.log('📊 AuthorId field:', projectData.authorId);
      console.log('📊 _doc check:', projectData._doc); // Check for Mongoose document wrapper

      // Handle both string author ID and object author
      // Priority: author._id > author (if string) > _doc.author > authorId
      let reportedUserId = null;

      // Check if data is wrapped in _doc (Mongoose document not properly serialized)
      const actualData = projectData._doc || projectData;
      const authorField = actualData.author || projectData.author;

      if (authorField) {
        if (typeof authorField === 'string') {
          // Author is just an ID string
          reportedUserId = authorField;
        } else if (typeof authorField === 'object' && authorField._id) {
          // Author is a full object with _id
          reportedUserId = authorField._id;
        } else if (typeof authorField === 'object' && authorField.id) {
          // Author object has id instead of _id
          reportedUserId = authorField.id;
        }
      } else if (actualData.authorId || projectData.authorId) {
        // Fallback to authorId field
        reportedUserId = actualData.authorId || projectData.authorId;
      }

      console.log('📊 Resolved reportedUserId:', reportedUserId);

      if (!reportedUserId) {
        console.error('❌ Missing Author ID. Full post data:', projectData);
        toast.error('Cannot report this content: Author information is missing/deleted.', {
          duration: 3000,
          position: 'top-right',
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/projects/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: projectId,
          targetType: 'project',
          reportedUserId: reportedUserId,
          reason: selectedReason,
          details: details?.trim() || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Report submitted to admin for review', {
          duration: 3000,
          position: 'top-right',
        });
      } else {
        toast.error(data.error || 'Failed to report post', {
          duration: 3000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Report post error:', error);
      toast.error('Failed to report post', {
        duration: 3000,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 hover:bg-gray-100 transition-colors duration-200 ${className}`}
          disabled={isLoading}
        >
          <motion.div
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ duration: 0.5, ease: "linear" }}
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </motion.div>
        </Button>
      </DropdownMenuTrigger>

      <AnimatePresence>
        <DropdownMenuContent
          align="end"
          className="w-48 rounded-xl border border-gray-200 bg-white shadow-lg"
          forceMount
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1],
              stiffness: 300,
              damping: 30
            }}
          >
            <DropdownMenuItem
              onClick={handleSaveToggle}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              disabled={isLoading}
            >
              <AnimatePresence mode="wait">
                {isSaved ? (
                  <motion.div
                    key="saved"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <BookmarkCheck
                      className="h-4 w-4"
                      style={{ color: 'oklch(0.47 0.13 220)' }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="unsaved"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Bookmark className="h-4 w-4 text-gray-500" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className={`text-sm ${isSaved ? 'font-medium' : ''}`}
                style={{ color: isSaved ? 'oklch(0.47 0.13 220)' : 'inherit' }}
              >
                {isSaved ? 'Unsave Post' : 'Save Post'}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={handleReport}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors duration-200"
              disabled={isLoading}
            >
              <Flag className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">Report Post</span>
            </DropdownMenuItem>
          </motion.div>
        </DropdownMenuContent>
      </AnimatePresence>
    </DropdownMenu>
  );
}
