'use client';

import { useSession, signIn } from 'next-auth/react';

export function useSessionFix() {
  const { data: session, update } = useSession();

  const fixSessionRole = async () => {
    if (session?.user?.email === 'thakkarprerak5@gmail.com') {
      try {
        // Call the fix session API
        const response = await fetch('/api/auth/fix-session', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update the session immediately with correct role
          await update({
            ...session,
            user: {
              ...session?.user,
              role: 'student', // Force update to student
            }
          });

          // Show success message
          alert('Session fixed! Admin options will now disappear.');
          
          // Reload page to apply changes
          window.location.reload();
          
          return { success: true, message: data.message };
        }
      } catch (error) {
        console.error('Session fix error:', error);
        return { success: false, error: 'Failed to fix session' };
      }
    }
    return { success: false, error: 'Not the target user' };
  };

  return { fixSessionRole, session };
}
