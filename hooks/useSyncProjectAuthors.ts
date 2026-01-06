import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useSyncProjectAuthors() {
  const { data: session } = useSession();

  useEffect(() => {
    const syncAuthors = async () => {
      try {
        if (!session?.user?.id) return;
        
        // Only run once per session
        const hasSynced = sessionStorage.getItem('hasSyncedAuthors');
        if (hasSynced) return;

        const response = await fetch('/api/projects/sync-authors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.success) {
          console.log('Successfully synced project authors:', data);
          sessionStorage.setItem('hasSyncedAuthors', 'true');
          
          // Force refresh to show updated data
          if (data.updatedCount > 0) {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error syncing project authors:', error);
      }
    };

    syncAuthors();
  }, [session?.user?.id]);

  return null;
}
