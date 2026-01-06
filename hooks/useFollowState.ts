import { useState, useEffect } from 'react';

interface FollowState {
  [userId: string]: boolean;
}

const FOLLOW_STATE_KEY = 'followState';

// Global state to persist across component re-renders
let globalFollowState: FollowState = {};

export function useFollowState() {
  // Initialize state from localStorage or global state
  const getInitialState = (): FollowState => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(FOLLOW_STATE_KEY);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          globalFollowState = parsed;
          return parsed;
        }
      } catch (error) {
        console.error('Error loading initial follow state:', error);
      }
    }
    return globalFollowState;
  };

  const [followed, setFollowed] = useState<FollowState>(getInitialState);

  // Save follow state to localStorage whenever it changes (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FOLLOW_STATE_KEY, JSON.stringify(followed));
        globalFollowState = followed;
      } catch (error) {
        console.error('Error saving follow state:', error);
      }
    }
  }, [followed]);

  // Sync with global state on mount
  useEffect(() => {
    if (Object.keys(globalFollowState).length > 0 && Object.keys(followed).length === 0) {
      setFollowed(globalFollowState);
    }
  }, []);

  const toggleFollow = (userId: string) => {
    const newState = {
      ...followed,
      [userId]: !followed[userId]
    };
    globalFollowState = newState;
    setFollowed(newState);
  };

  const isFollowing = (userId: string) => {
    return followed[userId] || globalFollowState[userId] || false;
  };

  return {
    followed,
    toggleFollow,
    isFollowing
  };
}
