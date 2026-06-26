// Custom hook to unlock all slots when component unmounts
import { useEffect, useRef } from 'react';

/**
 * Custom hook to unlock all slots when component unmounts, user navigates away, or socket disconnects
 * @param {Object} defaultSocket - Socket.IO instance
 * @param {boolean} isAuthenticated - Authentication status
 * @param {Object} lockedSlotsByMeRef - Ref tracking slots locked by current user
 * @param {Object} slotTimeoutRef - Ref for timeout
 */
export const useUnlockOnUnmount = (defaultSocket, isAuthenticated, lockedSlotsByMeRef, slotTimeoutRef) => {
  const hasUnlockedRef = useRef(false);

  useEffect(() => {
    const unlockAllSlots = () => {
      if (hasUnlockedRef.current) return;
      
      // Check if there are any slots locked by current user
      const hasLockedSlots = lockedSlotsByMeRef.current?.size > 0;
      
      if (hasLockedSlots && defaultSocket && isAuthenticated) {
        // Try to unlock via socket if connected
        if (defaultSocket.connected) {
          hasUnlockedRef.current = true;
          defaultSocket.emit('booking:unlock:all');
        } else {
          // Socket already disconnected, backend will handle via disconnect event
          hasUnlockedRef.current = true;
        }
      }
    };

    const handleBeforeUnload = () => {
      unlockAllSlots();
    };

    const handleVisibilityChange = () => {
      // If page becomes hidden (user switched tab or minimized), don't unlock yet
      // Only unlock when actually leaving
      if (document.hidden) {
        // Could unlock here if needed, but let's wait for actual disconnect
      }
    };

    // Handle socket disconnect
    const handleDisconnect = () => {
      hasUnlockedRef.current = true; // Mark as unlocked to prevent duplicate attempts
    };

    // Handle page unload (closing tab, navigating away)
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for socket disconnect
    if (defaultSocket) {
      defaultSocket.on('disconnect', handleDisconnect);
    }

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (defaultSocket) {
        defaultSocket.off('disconnect', handleDisconnect);
      }
      
      // Clear timeout on unmount
      if (slotTimeoutRef?.current) {
        clearTimeout(slotTimeoutRef.current);
        slotTimeoutRef.current = null;
      }
      
      unlockAllSlots();
    };
  }, [defaultSocket, isAuthenticated, lockedSlotsByMeRef, slotTimeoutRef]);
};

