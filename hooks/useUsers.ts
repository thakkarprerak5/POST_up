import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  _id: string;
  fullName: string;
  email: string;
  photo?: string;
  type: string;
  profile: {
    type: string;
    joinedDate: Date;
  };
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
}

export const useUsers = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
      // Filter out current user and format for chat selection
      const formattedUsers: ChatUser[] = data
        .filter((user: User) => user._id !== session.user.id)
        .map((user: User) => ({
          id: user._id,
          name: user.fullName,
          avatar: user.photo || '/placeholder-user.jpg',
        }));
      
      setUsers(formattedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUsers();
    } else {
      setUsers([]);
      setLoading(false);
    }
  }, [session?.user?.id]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
};
