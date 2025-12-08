import { useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { useRentalOrder } from '../context/RentalOrderContext';
import { toast } from '../components/common/Toast';
import icons from '../utils/icons';

/**
 * Custom hook for real-time order and contract updates via WebSocket
 * Handles events between renters and owners
 */
const useOrderSocket = (callbacks = {}) => {
  const { user } = useAuth();
  const { updateOrderRealtime, addNewOrderRealtime, updateOrderStatusRealtime } = useRentalOrder();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Get server URL from environment or default
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://api.pira.asia/api';

  // Default callbacks with realtime state updates
  const defaultCallbacks = {
    onOrderCreated: useCallback((data) => {
      // Update state: Add new order to owner's list
      if (data.masterOrderId && addNewOrderRealtime) {
        addNewOrderRealtime({
          _id: data.masterOrderId,
          masterOrderNumber: data.masterOrderNumber,
          status: 'PENDING_CONFIRMATION',
          totalAmount: data.totalAmount,
          createdAt: data.createdAt,
          renter: { _id: data.renterId, ...data.renterInfo },
          subOrders: []
        }, 'owner');
      }
      
      toast.success(
        <div className="flex items-start gap-2">
          <icons.FiGift className="text-green-500 mt-1" />
          <div>
            <strong>Đơn thuê mới!</strong><br />
            Bạn có đơn thuê mới từ {data.renterInfo?.name || 'khách hàng'}
          </div>
        </div>,
        { duration: 8000 }
      );
    }, [addNewOrderRealtime]),

    onOrderStatusChanged: useCallback((data) => {
      // Update state: Update order status
      if (data.orderId && data.status && updateOrderStatusRealtime) {
        updateOrderStatusRealtime(data.orderId, data.status, data.subOrderUpdates);
      }
      
      const statusMessages = {
        CONFIRMED: 'Đơn hàng đã được xác nhận',
        DELIVERING: 'Đơn hàng đang giao',
        DELIVERED: 'Đơn hàng đã giao',
        COMPLETED: 'Đơn hàng hoàn thành',
        CANCELLED: 'Đơn hàng đã hủy',
        OWNER_CONFIRMED: 'Chủ đồ đã xác nhận',
        CONTRACT_SIGNED: 'Đã ký hợp đồng',
      };
      
      const message = statusMessages[data.status] || 'Trạng thái đơn hàng đã thay đổi';
      
      toast.info(
        <div className="flex items-start gap-2">
          <icons.FaBox className="text-blue-500 mt-1" />
          <div>
            <strong>Cập nhật đơn hàng</strong><br />
            {message}
          </div>
        </div>,
        { duration: 5000 }
      );
    }, [updateOrderStatusRealtime]),

    onContractSigned: useCallback((data) => {
      // Update state: Update contract status in order
      if (data.subOrderId) {
        updateOrderRealtime(data.subOrderId, {
          status: data.signedBy === 'owner' ? 'PENDING_RENTER' : 'CONTRACT_SIGNED'
        }, 'my');
      }
      
      toast.success(
        <div className="flex items-start gap-2">
          <icons.FaCheckCircle className="text-green-500 mt-1" />
          <div>
            <strong>Hợp đồng đã được ký!</strong><br />
            Đối tác đã ký hợp đồng cho đơn hàng
          </div>
        </div>,
        { duration: 6000 }
      );
    }, [updateOrderRealtime]),

    onContractCompleted: useCallback((data) => {
      // Update state: Both parties signed, update to CONTRACT_SIGNED
      if (data.subOrderId) {
        updateOrderStatusRealtime(data.subOrderId, 'CONTRACT_SIGNED');
      }
      
      toast.success(
        <div className="flex items-start gap-2">
          <icons.FaCheckCircle className="text-green-500 mt-1" />
          <div>
            <strong>Hợp đồng hoàn tất!</strong><br />
            Cả hai bên đã ký hợp đồng thành công
          </div>
        </div>,
        { duration: 6000 }
      );
    }, [updateOrderStatusRealtime]),

    onPaymentReceived: useCallback((data) => {
      // Update state: Update payment status
      if (data.orderId) {
        updateOrderRealtime(data.orderId, {
          paymentStatus: 'PAID',
          paymentInfo: { amount: data.amount }
        }, 'owner');
      }
      
      toast.success(
        <div className="flex items-start gap-2">
          <icons.BiMoney className="text-green-500 mt-1" />
          <div>
            <strong>Thanh toán thành công!</strong><br />
            Đã nhận {data.amount?.toLocaleString('vi-VN')}đ
          </div>
        </div>,
        { duration: 5000 }
      );
    }, [updateOrderRealtime]),

    onShipmentUpdate: useCallback((data) => {
      // Update state: Update shipment status
      if (data.orderId) {
        updateOrderRealtime(data.orderId, {
          shipmentStatus: data.status
        }, 'my');
      }
      
      const statusMessages = {
        PENDING: 'Đang chờ vận chuyển',
        PICKED_UP: 'Đã lấy hàng',
        IN_TRANSIT: 'Đang vận chuyển',
        DELIVERED: 'Đã giao hàng',
      };
      
      const message = statusMessages[data.status] || 'Cập nhật vận chuyển';
      
      toast.info(
        <div className="flex items-start gap-2">
          <icons.FiTruck className="text-blue-500 mt-1" />
          <div>
            <strong>Cập nhật vận chuyển</strong><br />
            {message}
          </div>
        </div>,
        { duration: 5000 }
      );
    }, [updateOrderRealtime]),

    onEarlyReturnRequest: useCallback((data) => {
      // Update state: Mark order has early return request
      if (data.orderId) {
        updateOrderRealtime(data.orderId, {
          hasEarlyReturnRequest: true
        }, 'owner');
      }
      
      toast.info(
        <div className="flex items-start gap-2">
          <icons.FaExclamationTriangle className="text-orange-500 mt-1" />
          <div>
            <strong>Yêu cầu trả hàng sớm!</strong><br />
            Khách hàng muốn trả hàng sớm
          </div>
        </div>,
        { duration: 6000 }
      );
    }, [updateOrderRealtime]),

    onExtensionRequest: useCallback((data) => {
      // Update state: Mark order has extension request
      if (data.orderId) {
        updateOrderRealtime(data.orderId, {
          hasExtensionRequest: true
        }, 'owner');
      }
      
      toast.info(
        <div className="flex items-start gap-2">
          <icons.FaClock className="text-blue-500 mt-1" />
          <div>
            <strong>Yêu cầu gia hạn!</strong><br />
            Khách hàng muốn gia hạn thời gian thuê
          </div>
        </div>,
        { duration: 6000 }
      );
    }, [updateOrderRealtime]),
  };

  // Merge custom callbacks with defaults
  const finalCallbacks = { ...defaultCallbacks, ...callbacks };

  // Initialize socket connection
  const initSocket = useCallback(() => {
    if (!user?._id) {
      return null;
    }

    if (socketRef.current?.connected) {
      return socketRef.current;
    }
    
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('order:register', user._id);
    });

    socket.on('disconnect', () => {});

    socket.on('connect_error', (error) => {});

    // Register event listeners
    socket.on('order:new', finalCallbacks.onOrderCreated);
    socket.on('order:statusChanged', finalCallbacks.onOrderStatusChanged);
    socket.on('contract:signatureReceived', finalCallbacks.onContractSigned);
    socket.on('contract:fullyExecuted', finalCallbacks.onContractCompleted);
    socket.on('payment:notification', finalCallbacks.onPaymentReceived);
    socket.on('shipment:statusChanged', finalCallbacks.onShipmentUpdate);
    socket.on('earlyReturn:newRequest', finalCallbacks.onEarlyReturnRequest);
    socket.on('extension:newRequest', finalCallbacks.onExtensionRequest);

    socketRef.current = socket;
    return socket;
  }, [user?._id, SOCKET_URL, finalCallbacks]);

  // Connect on mount
  useEffect(() => {
    const socket = initSocket();

    return () => {
      if (socket) {
        socket.off('order:new');
        socket.off('order:statusChanged');
        socket.off('contract:signatureReceived');
        socket.off('contract:fullyExecuted');
        socket.off('payment:notification');
        socket.off('shipment:statusChanged');
        socket.off('earlyReturn:newRequest');
        socket.off('extension:newRequest');
        socket.disconnect();
        socketRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initSocket]);

  // Emit helpers
  const emitOrderCreated = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('order:created', data);
    }
  }, []);

  const emitOrderStatusUpdate = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('order:statusUpdate', data);
    }
  }, []);

  const emitContractSigned = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('contract:signed', data);
    }
  }, []);

  const emitContractCompleted = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('contract:completed', data);
    }
  }, []);

  const emitPaymentReceived = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('payment:received', data);
    }
  }, []);

  const emitShipmentUpdate = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('shipment:statusUpdate', data);
    }
  }, []);

  const emitEarlyReturnRequest = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('earlyReturn:requested', data);
    }
  }, []);

  const emitExtensionRequest = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('extension:requested', data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    // Emit functions
    emitOrderCreated,
    emitOrderStatusUpdate,
    emitContractSigned,
    emitContractCompleted,
    emitPaymentReceived,
    emitShipmentUpdate,
    emitEarlyReturnRequest,
    emitExtensionRequest,
  };
};

export default useOrderSocket;
