import { useEffect } from 'react';
import useDisputeSocket from '../../hooks/useDisputeSocket';
import { useAuth } from '../../hooks/useAuth';

/**
 * Component to initialize global dispute socket when user is logged in.
 * This ensures the socket is connected at app level and receives all dispute events.
 * Must be rendered inside AuthProvider.
 */
const DisputeSocketInitializer = () => {
  const { user } = useAuth();
  
  // This will create/reuse the singleton socket connection
  const { isConnected } = useDisputeSocket();

  useEffect(() => {
    if (user?._id) {
      console.log('🔌 DisputeSocketInitializer: User logged in, socket connected:', isConnected);
    }
  }, [user?._id, isConnected]);

  // This component doesn't render anything
  return null;
};

export default DisputeSocketInitializer;
