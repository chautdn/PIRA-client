import { useEffect, useCallback, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

// Import context directly to handle optional usage
import { DisputeContext } from '../context/DisputeContext';

// Get server URL from environment or default
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// ============== SINGLETON SOCKET MANAGER ==============
// Keeps one persistent socket connection for all dispute hooks

let globalSocket = null;
let globalUserId = null;
const eventListeners = new Map(); // Map<eventName, Set<callback>>

const getOrCreateSocket = (userId) => {
  // If socket exists and is for the same user, reuse it
  if (globalSocket && globalUserId === userId) {
    return globalSocket;
  }

  // If socket exists but for different user, disconnect
  if (globalSocket && globalUserId !== userId) {
    console.log('🔌 Dispute socket: User changed, reconnecting...');
    globalSocket.disconnect();
    globalSocket = null;
    globalUserId = null;
    eventListeners.clear();
  }

  // Create new socket
  if (userId) {
    globalSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    globalSocket.on('connect', () => {
      console.log('🔌 Dispute socket connected, registering user:', userId);
      globalSocket.emit('dispute:register', userId);
    });

    globalSocket.on('disconnect', (reason) => {
      console.log('🔌 Dispute socket disconnected:', reason);
    });

    globalSocket.on('connect_error', (error) => {
      console.error('🔌 Dispute socket connection error:', error.message);
    });

    // Setup event forwarding - these events will be forwarded to all registered listeners
    const events = [
      'dispute:new',
      'dispute:statusChanged',
      'dispute:responseReceived',
      'dispute:negotiationUpdate',
      'dispute:negotiationResult',
      'dispute:escalatedNotification',
      'dispute:newEvidence',
      'dispute:adminDecisionMade',
      'dispute:completed',
      'dispute:paymentNotification',
    ];

    events.forEach((eventName) => {
      globalSocket.on(eventName, (data) => {
        console.log(`🔌 Dispute socket received event: ${eventName}`, data);
        const listeners = eventListeners.get(eventName);
        if (listeners) {
          listeners.forEach((callback) => callback(data));
        }
      });
    });

    globalUserId = userId;
  }

  return globalSocket;
};

const addSocketListener = (eventName, callback) => {
  if (!eventListeners.has(eventName)) {
    eventListeners.set(eventName, new Set());
  }
  eventListeners.get(eventName).add(callback);
};

const removeSocketListener = (eventName, callback) => {
  const listeners = eventListeners.get(eventName);
  if (listeners) {
    listeners.delete(callback);
  }
};

/**
 * Custom hook for real-time dispute updates via WebSocket
 * Handles events between renters, owners, and admins
 * Uses singleton pattern to maintain single connection
 */
const useDisputeSocket = (callbacks = {}) => {
  const { user } = useAuth();
  
  // Use context optionally - may be null if not inside DisputeProvider
  const disputeContext = useContext(DisputeContext);
  const updateDisputeRealtime = disputeContext?.updateDisputeRealtime;
  const addNewDisputeRealtime = disputeContext?.addNewDisputeRealtime;
  const updateDisputeStatusRealtime = disputeContext?.updateDisputeStatusRealtime;
  const loadDisputeDetail = disputeContext?.loadDisputeDetail;
  const currentDispute = disputeContext?.currentDispute;
  
  const socketRef = useRef(null);
  const callbacksRef = useRef(callbacks);
  
  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Create stable callback handlers that read from ref
  const handleDisputeCreated = useCallback((data) => {
    // Add new dispute to the list
    if (addNewDisputeRealtime && data.disputeId) {
      addNewDisputeRealtime({
        _id: data.disputeId,
        disputeId: data.disputeNumber,
        status: data.status || 'OPEN',
        createdAt: data.timestamp || new Date()
      });
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onDisputeCreated) {
      callbacksRef.current.onDisputeCreated(data);
    }
  }, [addNewDisputeRealtime]);

  const handleDisputeStatusChanged = useCallback((data) => {
    console.log('🔌 [useDisputeSocket] handleDisputeStatusChanged called with:', data);
    
    // Update state realtime
    if (updateDisputeStatusRealtime && data.disputeId) {
      updateDisputeStatusRealtime(data.disputeId, data.status);
    }
    
    // Reload chi tiết nếu đang xem dispute này
    if (currentDispute && data.disputeId && 
        (currentDispute._id === data.disputeId || currentDispute.disputeId === data.disputeNumber)) {
      loadDisputeDetail(data.disputeId);
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onDisputeStatusChanged) {
      console.log('🔌 [useDisputeSocket] Calling custom onDisputeStatusChanged callback');
      callbacksRef.current.onDisputeStatusChanged(data);
    }
  }, [updateDisputeStatusRealtime, currentDispute, loadDisputeDetail]);

  const handleResponseReceived = useCallback((data) => {
    // Update state realtime
    if (updateDisputeRealtime && data.disputeId) {
      updateDisputeRealtime(data.disputeId, { 
        respondentResponse: { decision: data.response, respondedAt: new Date() },
        status: data.status 
      });
    }
    
    // Reload chi tiết nếu đang xem dispute này
    if (currentDispute && data.disputeId && 
        (currentDispute._id === data.disputeId || currentDispute.disputeId === data.disputeNumber)) {
      loadDisputeDetail(data.disputeId);
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onResponseReceived) {
      callbacksRef.current.onResponseReceived(data);
    }
  }, [updateDisputeRealtime, currentDispute, loadDisputeDetail]);

  const handleNegotiationUpdate = useCallback((data) => {
    // Reload chi tiết nếu đang xem dispute này
    if (currentDispute && data.disputeId && 
        (currentDispute._id === data.disputeId || currentDispute.disputeId === data.disputeNumber)) {
      loadDisputeDetail(data.disputeId);
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onNegotiationUpdate) {
      callbacksRef.current.onNegotiationUpdate(data);
    }
  }, [currentDispute, loadDisputeDetail]);

  const handleNegotiationResult = useCallback((data) => {
    // Update state realtime
    if (updateDisputeStatusRealtime && data.disputeId && data.newStatus) {
      updateDisputeStatusRealtime(data.disputeId, data.newStatus);
    }
    
    // Reload chi tiết nếu đang xem dispute này
    if (currentDispute && data.disputeId && 
        (currentDispute._id === data.disputeId || currentDispute.disputeId === data.disputeNumber)) {
      loadDisputeDetail(data.disputeId);
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onNegotiationResult) {
      callbacksRef.current.onNegotiationResult(data);
    }
  }, [updateDisputeStatusRealtime, currentDispute, loadDisputeDetail]);

  const handleDisputeEscalated = useCallback((data) => {
    // Update state realtime
    if (updateDisputeRealtime && data.disputeId) {
      updateDisputeRealtime(data.disputeId, { 
        status: data.escalatedTo === 'THIRD_PARTY' ? 'THIRD_PARTY_ESCALATED' : 'ADMIN_REVIEW' 
      });
    }
    
    // Reload chi tiết nếu đang xem dispute này
    if (currentDispute && data.disputeId && 
        (currentDispute._id === data.disputeId || currentDispute.disputeId === data.disputeNumber)) {
      loadDisputeDetail(data.disputeId);
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onDisputeEscalated) {
      callbacksRef.current.onDisputeEscalated(data);
    }
  }, [updateDisputeRealtime, currentDispute, loadDisputeDetail]);

  const handleNewEvidence = useCallback((data) => {
    // Reload chi tiết nếu đang xem dispute này
    if (currentDispute && data.disputeId && 
        (currentDispute._id === data.disputeId || currentDispute.disputeId === data.disputeNumber)) {
      loadDisputeDetail(data.disputeId);
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onNewEvidence) {
      callbacksRef.current.onNewEvidence(data);
    }
  }, [currentDispute, loadDisputeDetail]);

  const handleAdminDecision = useCallback((data) => {
    // Update state realtime
    if (updateDisputeStatusRealtime && data.disputeId) {
      updateDisputeStatusRealtime(data.disputeId, 'ADMIN_DECISION_MADE');
    }
    
    // Reload chi tiết nếu đang xem dispute này
    if (currentDispute && data.disputeId && 
        (currentDispute._id === data.disputeId || currentDispute.disputeId === data.disputeNumber)) {
      loadDisputeDetail(data.disputeId);
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onAdminDecision) {
      callbacksRef.current.onAdminDecision(data);
    }
  }, [updateDisputeStatusRealtime, currentDispute, loadDisputeDetail]);

  const handleDisputeCompleted = useCallback((data) => {
    console.log('🔌 [useDisputeSocket] handleDisputeCompleted called with:', data);
    
    // Update state realtime
    if (updateDisputeStatusRealtime && data.disputeId) {
      updateDisputeStatusRealtime(data.disputeId, 'RESOLVED');
    }
    
    // Reload chi tiết nếu đang xem dispute này
    if (currentDispute && data.disputeId && 
        (currentDispute._id === data.disputeId || currentDispute.disputeId === data.disputeNumber)) {
      loadDisputeDetail(data.disputeId);
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onDisputeCompleted) {
      console.log('🔌 [useDisputeSocket] Calling custom onDisputeCompleted callback');
      callbacksRef.current.onDisputeCompleted(data);
    }
  }, [updateDisputeStatusRealtime, currentDispute, loadDisputeDetail]);

  const handlePaymentNotification = useCallback((data) => {
    // Reload chi tiết nếu đang xem dispute này
    if (currentDispute && data.disputeId && 
        (currentDispute._id === data.disputeId || currentDispute.disputeId === data.disputeNumber)) {
      loadDisputeDetail(data.disputeId);
    }
    
    // Call custom callback if provided
    if (callbacksRef.current.onPaymentNotification) {
      callbacksRef.current.onPaymentNotification(data);
    }
  }, [currentDispute, loadDisputeDetail]);

  // Initialize socket and register listeners
  useEffect(() => {
    if (!user?._id) {
      return;
    }

    // Get or create the singleton socket
    const socket = getOrCreateSocket(user._id);
    socketRef.current = socket;

    // Register our event listeners
    addSocketListener('dispute:new', handleDisputeCreated);
    addSocketListener('dispute:statusChanged', handleDisputeStatusChanged);
    addSocketListener('dispute:responseReceived', handleResponseReceived);
    addSocketListener('dispute:negotiationUpdate', handleNegotiationUpdate);
    addSocketListener('dispute:negotiationResult', handleNegotiationResult);
    addSocketListener('dispute:escalatedNotification', handleDisputeEscalated);
    addSocketListener('dispute:newEvidence', handleNewEvidence);
    addSocketListener('dispute:adminDecisionMade', handleAdminDecision);
    addSocketListener('dispute:completed', handleDisputeCompleted);
    addSocketListener('dispute:paymentNotification', handlePaymentNotification);

    // Cleanup - remove only our listeners, don't disconnect socket
    return () => {
      removeSocketListener('dispute:new', handleDisputeCreated);
      removeSocketListener('dispute:statusChanged', handleDisputeStatusChanged);
      removeSocketListener('dispute:responseReceived', handleResponseReceived);
      removeSocketListener('dispute:negotiationUpdate', handleNegotiationUpdate);
      removeSocketListener('dispute:negotiationResult', handleNegotiationResult);
      removeSocketListener('dispute:escalatedNotification', handleDisputeEscalated);
      removeSocketListener('dispute:newEvidence', handleNewEvidence);
      removeSocketListener('dispute:adminDecisionMade', handleAdminDecision);
      removeSocketListener('dispute:completed', handleDisputeCompleted);
      removeSocketListener('dispute:paymentNotification', handlePaymentNotification);
    };
  }, [
    user?._id,
    handleDisputeCreated,
    handleDisputeStatusChanged,
    handleResponseReceived,
    handleNegotiationUpdate,
    handleNegotiationResult,
    handleDisputeEscalated,
    handleNewEvidence,
    handleAdminDecision,
    handleDisputeCompleted,
    handlePaymentNotification,
  ]);

  // ============== EMIT FUNCTIONS ==============

  // Emit when creating a new dispute
  const emitDisputeCreated = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:created', data);
    }
  }, []);

  // Emit when dispute status updates
  const emitDisputeStatusUpdate = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:statusUpdate', data);
    }
  }, []);

  // Emit when respondent submits response
  const emitDisputeResponse = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:responseSubmitted', data);
    }
  }, []);

  // Emit negotiation message
  const emitNegotiationMessage = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:negotiationMessage', data);
    }
  }, []);

  // Emit negotiation response
  const emitNegotiationResponse = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:negotiationResponse', data);
    }
  }, []);

  // Emit when dispute is escalated
  const emitDisputeEscalated = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:escalated', data);
    }
  }, []);

  // Emit when evidence is uploaded
  const emitEvidenceUploaded = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:evidenceUploaded', data);
    }
  }, []);

  // Emit admin decision
  const emitAdminDecision = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:adminDecision', data);
    }
  }, []);

  // Emit when dispute is resolved
  const emitDisputeResolved = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:resolved', data);
    }
  }, []);

  // Emit payment completed
  const emitPaymentCompleted = useCallback((data) => {
    if (globalSocket?.connected) {
      globalSocket.emit('dispute:paymentCompleted', data);
    }
  }, []);

  return {
    socket: globalSocket,
    isConnected: globalSocket?.connected || false,
    // Emit functions
    emitDisputeCreated,
    emitDisputeStatusUpdate,
    emitDisputeResponse,
    emitNegotiationMessage,
    emitNegotiationResponse,
    emitDisputeEscalated,
    emitEvidenceUploaded,
    emitAdminDecision,
    emitDisputeResolved,
    emitPaymentCompleted,
  };
};

export default useDisputeSocket;
