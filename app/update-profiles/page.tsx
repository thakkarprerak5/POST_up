"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function UpdateProfilesPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const updateProjectAuthors = async () => {
    if (!session) {
      setMessage('Please sign in to update projects');
      setIsError(true);
      return;
    }

    setIsUpdating(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/projects/update-author-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`Successfully updated ${data.updatedCount} projects with your current profile information`);
        // Refresh the page to see changes
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to update projects');
        setIsError(true);
      }
    } catch (error) {
      console.error('Error updating projects:', error);
      setMessage('An error occurred while updating projects');
      setIsError(true);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Update Project Authors</h1>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            This will update your name and avatar on all your projects to match your current profile information.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Note: This action cannot be undone. All your projects will be updated with your current profile information.
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={updateProjectAuthors}
            disabled={isUpdating}
            className={`px-6 py-3 ${isUpdating ? 'opacity-70' : ''}`}
          >
            {isUpdating ? 'Updating...' : 'Update All My Projects'}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
