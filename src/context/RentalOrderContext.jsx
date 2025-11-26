import React, { createContext, useContext, useReducer, useEffect } from 'react';
import rentalOrderService from '../services/rentalOrder.js';
import { useAuth } from "../hooks/useAuth";

// Initial State
const initialState = {
  // Draft Order
  draftOrder: null,
  isCreatingDraft: false,
  
  // My Orders
  myOrders: [],
  ownerOrders: [],
  isLoadingOrders: false,
  
  // Current Order Detail
  currentOrder: null,
  isLoadingOrderDetail: false,
  
  // Contracts
  contracts: [],
  isLoadingContracts: false,
  
  // Shipping
  shippingCalculation: null,
  isCalculatingShipping: false,
  
  // Error handling
  error: null,
  
  // Pagination
  pagination: {
    myOrders: { page: 1, total: 0, pages: 0 },
    ownerOrders: { page: 1, total: 0, pages: 0 },
    contracts: { page: 1, total: 0, pages: 0 }
  }
};

// Action Types
const RENTAL_ORDER_ACTIONS = {
  // Draft Order
  CREATE_DRAFT_START: 'CREATE_DRAFT_START',
  CREATE_DRAFT_SUCCESS: 'CREATE_DRAFT_SUCCESS',
  CREATE_DRAFT_ERROR: 'CREATE_DRAFT_ERROR',
  
  // Confirm Order
  CONFIRM_ORDER_START: 'CONFIRM_ORDER_START',
  CONFIRM_ORDER_SUCCESS: 'CONFIRM_ORDER_SUCCESS',
  CONFIRM_ORDER_ERROR: 'CONFIRM_ORDER_ERROR',
  
  // Payment
  PROCESS_PAYMENT_START: 'PROCESS_PAYMENT_START',
  PROCESS_PAYMENT_SUCCESS: 'PROCESS_PAYMENT_SUCCESS',
  PROCESS_PAYMENT_ERROR: 'PROCESS_PAYMENT_ERROR',
  
  // Owner Confirmation
  OWNER_CONFIRM_START: 'OWNER_CONFIRM_START',
  OWNER_CONFIRM_SUCCESS: 'OWNER_CONFIRM_SUCCESS',
  OWNER_CONFIRM_ERROR: 'OWNER_CONFIRM_ERROR',
  
  // Contracts
  GENERATE_CONTRACTS_START: 'GENERATE_CONTRACTS_START',
  GENERATE_CONTRACTS_SUCCESS: 'GENERATE_CONTRACTS_SUCCESS',
  GENERATE_CONTRACTS_ERROR: 'GENERATE_CONTRACTS_ERROR',
  
  SIGN_CONTRACT_START: 'SIGN_CONTRACT_START',
  SIGN_CONTRACT_SUCCESS: 'SIGN_CONTRACT_SUCCESS',
  SIGN_CONTRACT_ERROR: 'SIGN_CONTRACT_ERROR',
  
  // Orders
  LOAD_ORDERS_START: 'LOAD_ORDERS_START',
  LOAD_ORDERS_SUCCESS: 'LOAD_ORDERS_SUCCESS',
  LOAD_ORDERS_ERROR: 'LOAD_ORDERS_ERROR',
  
  LOAD_ORDER_DETAIL_START: 'LOAD_ORDER_DETAIL_START',
  LOAD_ORDER_DETAIL_SUCCESS: 'LOAD_ORDER_DETAIL_SUCCESS',
  LOAD_ORDER_DETAIL_ERROR: 'LOAD_ORDER_DETAIL_ERROR',
  
  // Contracts List
  LOAD_CONTRACTS_START: 'LOAD_CONTRACTS_START',
  LOAD_CONTRACTS_SUCCESS: 'LOAD_CONTRACTS_SUCCESS',
  LOAD_CONTRACTS_ERROR: 'LOAD_CONTRACTS_ERROR',
  
  // Shipping
  CALCULATE_SHIPPING_START: 'CALCULATE_SHIPPING_START',
  CALCULATE_SHIPPING_SUCCESS: 'CALCULATE_SHIPPING_SUCCESS',
  CALCULATE_SHIPPING_ERROR: 'CALCULATE_SHIPPING_ERROR',
  
  // Cancel Order
  CANCEL_ORDER_START: 'CANCEL_ORDER_START',
  CANCEL_ORDER_SUCCESS: 'CANCEL_ORDER_SUCCESS',
  CANCEL_ORDER_ERROR: 'CANCEL_ORDER_ERROR',
  
  // Clear Error
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const rentalOrderReducer = (state, action) => {
  switch (action.type) {
    case RENTAL_ORDER_ACTIONS.CREATE_DRAFT_START:
      return { ...state, isCreatingDraft: true, error: null };
    case RENTAL_ORDER_ACTIONS.CREATE_DRAFT_SUCCESS:
      return { 
        ...state, 
        isCreatingDraft: false, 
        draftOrder: action.payload.masterOrder,
        error: null 
      };
    case RENTAL_ORDER_ACTIONS.CREATE_DRAFT_ERROR:
      return { ...state, isCreatingDraft: false, error: action.payload };

    case RENTAL_ORDER_ACTIONS.CONFIRM_ORDER_START:
      return { ...state, error: null };
    case RENTAL_ORDER_ACTIONS.CONFIRM_ORDER_SUCCESS:
      return { 
        ...state, 
        draftOrder: action.payload.masterOrder,
        error: null 
      };
    case RENTAL_ORDER_ACTIONS.CONFIRM_ORDER_ERROR:
      return { ...state, error: action.payload };

    case RENTAL_ORDER_ACTIONS.PROCESS_PAYMENT_START:
      return { ...state, error: null };
    case RENTAL_ORDER_ACTIONS.PROCESS_PAYMENT_SUCCESS:
      return { 
        ...state, 
        draftOrder: action.payload.masterOrder,
        error: null 
      };
    case RENTAL_ORDER_ACTIONS.PROCESS_PAYMENT_ERROR:
      return { ...state, error: action.payload };

    case RENTAL_ORDER_ACTIONS.LOAD_ORDERS_START:
      return { ...state, isLoadingOrders: true, error: null };
    case RENTAL_ORDER_ACTIONS.LOAD_ORDERS_SUCCESS:
      const { orders, pagination, orderType } = action.payload;
      return {
        ...state,
        isLoadingOrders: false,
        [orderType === 'my' ? 'myOrders' : 'ownerOrders']: orders,
        pagination: {
          ...state.pagination,
          [orderType === 'my' ? 'myOrders' : 'ownerOrders']: pagination
        },
        error: null
      };
    case RENTAL_ORDER_ACTIONS.LOAD_ORDERS_ERROR:
      return { ...state, isLoadingOrders: false, error: action.payload };

    case RENTAL_ORDER_ACTIONS.LOAD_ORDER_DETAIL_START:
      console.log('🔄 Reducer: LOAD_ORDER_DETAIL_START');
      return { ...state, isLoadingOrderDetail: true, error: null };
    case RENTAL_ORDER_ACTIONS.LOAD_ORDER_DETAIL_SUCCESS:
      console.log('✅ Reducer: LOAD_ORDER_DETAIL_SUCCESS', {
        payload: action.payload,
        masterOrder: action.payload.masterOrder
      });
      return { 
        ...state, 
        isLoadingOrderDetail: false, 
        currentOrder: action.payload.masterOrder,
        error: null 
      };
    case RENTAL_ORDER_ACTIONS.LOAD_ORDER_DETAIL_ERROR:
      console.error('❌ Reducer: LOAD_ORDER_DETAIL_ERROR', action.payload);
      return { ...state, isLoadingOrderDetail: false, error: action.payload };

    case RENTAL_ORDER_ACTIONS.LOAD_CONTRACTS_START:
      return { ...state, isLoadingContracts: true, error: null };
    case RENTAL_ORDER_ACTIONS.LOAD_CONTRACTS_SUCCESS:
      return {
        ...state,
        isLoadingContracts: false,
        contracts: action.payload.contracts,
        pagination: {
          ...state.pagination,
          contracts: action.payload.pagination
        },
        error: null
      };
    case RENTAL_ORDER_ACTIONS.LOAD_CONTRACTS_ERROR:
      return { ...state, isLoadingContracts: false, error: action.payload };

    case RENTAL_ORDER_ACTIONS.CALCULATE_SHIPPING_START:
      return { ...state, isCalculatingShipping: true, error: null };
    case RENTAL_ORDER_ACTIONS.CALCULATE_SHIPPING_SUCCESS:
      return { 
        ...state, 
        isCalculatingShipping: false, 
        shippingCalculation: action.payload.shipping,
        error: null 
      };
    case RENTAL_ORDER_ACTIONS.CALCULATE_SHIPPING_ERROR:
      return { ...state, isCalculatingShipping: false, error: action.payload };

    case RENTAL_ORDER_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

// Context
const RentalOrderContext = createContext();

// Provider Component
export const RentalOrderProvider = ({ children }) => {
  try {
    const [state, dispatch] = useReducer(rentalOrderReducer, initialState);
    const { user } = useAuth();
    
    // Debug effect - only runs once or when user changes
    useEffect(() => {
      console.log('RentalOrderProvider: Initializing with user:', user ? 'Yes' : 'No');
    }, [user]);

    // Debug effect - log state changes
    useEffect(() => {
      console.log('📊 RentalOrderContext State Updated:', {
        hasCurrentOrder: !!state.currentOrder,
        currentOrderId: state.currentOrder?._id,
        isLoadingOrderDetail: state.isLoadingOrderDetail,
        error: state.error
      });
    }, [state.currentOrder, state.isLoadingOrderDetail, state.error]);

  // Actions
  const createDraftOrder = async (orderData) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.CREATE_DRAFT_START });
    try {
      const response = await rentalOrderService.createDraftOrder(orderData);
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CREATE_DRAFT_SUCCESS, 
        payload: response.metadata 
      });
      return response.metadata.masterOrder;
    } catch (error) {
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CREATE_DRAFT_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  };

  // Create paid order (with payment processing)
  const createPaidOrder = async (orderData) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.CREATE_DRAFT_START }); // Reuse for now
    try {
      const response = await rentalOrderService.createPaidOrder(orderData);
      console.log('✅ RentalOrderContext received response:', response);
      
      // Handle different response structures safely
      let masterOrder = null;
      if (response && typeof response === 'object') {
        // Check nested structure: response.data.metadata.masterOrder
        if (response.data && response.data.metadata && response.data.metadata.masterOrder) {
          masterOrder = response.data.metadata.masterOrder;
        }
        // Check: response.metadata.masterOrder  
        else if (response.metadata && response.metadata.masterOrder) {
          masterOrder = response.metadata.masterOrder;
        }
        // Check: response.masterOrder
        else if (response.masterOrder) {
          masterOrder = response.masterOrder;
        }
        // Check: response.data.masterOrder
        else if (response.data && response.data.masterOrder) {
          masterOrder = response.data.masterOrder;
        }
        // Sometimes the response itself is the masterOrder
        else if (response._id) {
          masterOrder = response;
        }
      }
      
      if (!masterOrder || !masterOrder._id) {
        console.error('❌ No valid masterOrder found in response:', response);
        console.error('❌ Response type:', typeof response);
        console.error('❌ Response keys:', response ? Object.keys(response) : 'null');
        throw new Error('Không thể lấy thông tin đơn hàng từ server. Vui lòng thử lại.');
      }
      
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CREATE_DRAFT_SUCCESS, 
        payload: response.metadata || response 
      });
      return masterOrder;
    } catch (error) {
      console.error('❌ Error in createPaidOrder context:', error);
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CREATE_DRAFT_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  };

  const confirmOrder = async (masterOrderId) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.CONFIRM_ORDER_START });
    try {
      const response = await rentalOrderService.confirmOrder(masterOrderId);
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CONFIRM_ORDER_SUCCESS, 
        payload: response.metadata 
      });
      return response.metadata.masterOrder;
    } catch (error) {
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CONFIRM_ORDER_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  };

  const processPayment = async (masterOrderId, paymentData) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.PROCESS_PAYMENT_START });
    try {
      const response = await rentalOrderService.processPayment(masterOrderId, paymentData);
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.PROCESS_PAYMENT_SUCCESS, 
        payload: response.metadata 
      });
      return response.metadata.masterOrder;
    } catch (error) {
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.PROCESS_PAYMENT_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  };

  // Owner confirms a SubOrder
  const confirmOwnerOrder = async (subOrderId) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.OWNER_CONFIRM_START });
    try {
      const response = await rentalOrderService.ownerConfirmOrder(subOrderId, { status: 'CONFIRMED' });
      dispatch({ type: RENTAL_ORDER_ACTIONS.OWNER_CONFIRM_SUCCESS });
      return response;
    } catch (error) {
      dispatch({ type: RENTAL_ORDER_ACTIONS.OWNER_CONFIRM_ERROR, payload: error.message });
      throw error;
    }
  };

  // Owner rejects a SubOrder
  const rejectOwnerOrder = async (subOrderId, reason) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.OWNER_CONFIRM_START });
    try {
      const response = await rentalOrderService.ownerConfirmOrder(subOrderId, { status: 'REJECTED', rejectionReason: reason });
      dispatch({ type: RENTAL_ORDER_ACTIONS.OWNER_CONFIRM_SUCCESS });
      return response;
    } catch (error) {
      dispatch({ type: RENTAL_ORDER_ACTIONS.OWNER_CONFIRM_ERROR, payload: error.message });
      throw error;
    }
  };

  const loadMyOrders = async (params = {}) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.LOAD_ORDERS_START });
    try {
      const response = await rentalOrderService.getMyOrders(params);
      
      // Fix: API trả về nested metadata
      const ordersData = response.metadata.metadata?.orders || response.data?.orders || [];
      const paginationData = response.metadata.metadata?.pagination || response.data?.pagination || {};
      
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.LOAD_ORDERS_SUCCESS, 
        payload: {
          orders: ordersData,
          pagination: paginationData,
          orderType: 'my'
        }
      });
    } catch (error) {
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.LOAD_ORDERS_ERROR, 
        payload: error.message 
      });
    }
  };

  const loadOwnerOrders = async (params = {}) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.LOAD_ORDERS_START });
    try {
      const response = await rentalOrderService.getOwnerOrders(params);
      
      // Fix: API trả về nested metadata
      const ordersData = response.metadata.metadata?.orders || response.data?.orders || [];
      const paginationData = response.metadata.metadata?.pagination || response.data?.pagination || {};
      
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.LOAD_ORDERS_SUCCESS, 
        payload: {
          orders: ordersData,
          pagination: paginationData,
          orderType: 'owner'
        }
      });
    } catch (error) {
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.LOAD_ORDERS_ERROR, 
        payload: error.message 
      });
    }
  };

  const loadOrderDetail = async (masterOrderId) => {
    console.log('🔍 RentalOrderContext: Loading order detail for:', masterOrderId);
    dispatch({ type: RENTAL_ORDER_ACTIONS.LOAD_ORDER_DETAIL_START });
    try {
      const response = await rentalOrderService.getOrderDetail(masterOrderId);
      console.log('✅ RentalOrderContext: Order loaded successfully:', response);
      console.log('📦 Response structure:', {
        hasData: !!response.data,
        hasMetadata: !!response.metadata,
        hasMasterOrder: !!response.data?.masterOrder || !!response.metadata?.masterOrder,
        dataKeys: response.data ? Object.keys(response.data) : [],
        metadataKeys: response.metadata ? Object.keys(response.metadata) : []
      });
      
      // Use data instead of metadata (both should work but data is more consistent)
      const masterOrder = response.data?.masterOrder || response.metadata?.masterOrder;
      console.log('🔔 Dispatching LOAD_ORDER_DETAIL_SUCCESS with masterOrder:', !!masterOrder);
      
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.LOAD_ORDER_DETAIL_SUCCESS, 
        payload: { masterOrder } 
      });
    } catch (error) {
      console.error('❌ RentalOrderContext: Failed to load order:', error);
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.LOAD_ORDER_DETAIL_ERROR, 
        payload: error.message 
      });
    }
  };

  const loadContracts = async (params = {}) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.LOAD_CONTRACTS_START });
    try {
      const response = await rentalOrderService.getContracts(params);
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.LOAD_CONTRACTS_SUCCESS, 
        payload: response.metadata 
      });
    } catch (error) {
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.LOAD_CONTRACTS_ERROR, 
        payload: error.message 
      });
    }
  };

  const calculateShipping = async (shippingData) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.CALCULATE_SHIPPING_START });
    try {
      const response = await rentalOrderService.calculateShipping(shippingData);
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CALCULATE_SHIPPING_SUCCESS, 
        payload: response.metadata 
      });
      return response.metadata.shipping;
    } catch (error) {
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CALCULATE_SHIPPING_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  };

  const calculateProductShipping = async (shippingData) => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.CALCULATE_SHIPPING_START });
    try {
      const response = await rentalOrderService.calculateProductShipping(shippingData);
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CALCULATE_SHIPPING_SUCCESS, 
        payload: response.metadata 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RENTAL_ORDER_ACTIONS.CALCULATE_SHIPPING_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: RENTAL_ORDER_ACTIONS.CLEAR_ERROR });
  };

  // Load user orders on mount
  useEffect(() => {
    if (user) {
      loadMyOrders();
      loadOwnerOrders();
    }
  }, [user]);

  const value = {
    // State
    ...state,
    
    // Actions
    createDraftOrder,
    createPaidOrder,
    confirmOrder,
    processPayment,
    confirmOwnerOrder,
    rejectOwnerOrder,
    loadMyOrders,
    loadOwnerOrders,
    loadOrderDetail,
    loadContracts,
    calculateShipping,
    calculateProductShipping,
    clearError
  };

    return (
      <RentalOrderContext.Provider value={value}>
        {children}
      </RentalOrderContext.Provider>
    );
  } catch (error) {
    console.error('RentalOrderProvider Error:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="text-red-700 font-semibold">RentalOrder Context Error</h3>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }
};

// Hook to use context
export const useRentalOrder = () => {
  const context = useContext(RentalOrderContext);
  if (!context) {
    throw new Error('useRentalOrder must be used within a RentalOrderProvider');
  }
  return context;
};