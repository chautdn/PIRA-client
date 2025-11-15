import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "../hooks/useAuth";
import useChatSocket from "../hooks/useChatSocket";
import api from "../services/api";
import toast from "react-hot-toast";

const WalletContext = createContext();

const walletReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_BALANCE":
      return { ...state, balance: action.payload, error: null };
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.payload };
    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id ? { ...tx, ...action.payload } : tx
        ),
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const initialState = {
  balance: 0,
  transactions: [],
  loading: false,
  error: null,
};

export const WalletProvider = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const { user } = useAuth();
  const { socket, connected } = useChatSocket();

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!user) return;

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await api.get("/payment/wallet/balance");
      console.log("Wallet API Response:", response.data);

      // Try different possible response structures
      const balance =
        response.data?.metadata?.balance?.available || // New structure
        response.data?.metadata?.balance || // Simple number
        response.data?.data?.balance?.available || // Alternative structure
        response.data?.data?.balance ||
        0;

      console.log("Extracted balance:", balance);

      dispatch({
        type: "SET_BALANCE",
        payload: balance,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch wallet balance";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Wallet fetch error:", error);
      toast.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [user]);

  // Create payment session
  const createPayment = useCallback(async (amount) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await api.post("/payment/topup", { amount });

      // Create pending transaction for UI
      const pendingTransaction = {
        id: response.data?.data?.transaction?.id,
        amount,
        status: "pending",
        type: "deposit",
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_TRANSACTION", payload: pendingTransaction });
      return response.data?.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create payment";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // Fetch transaction history
  const fetchTransactions = useCallback(async (options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append("page", options.page);
      if (options.limit) params.append("limit", options.limit);
      if (options.type) params.append("type", options.type);
      if (options.status) params.append("status", options.status);

      const response = await api.get(
        `/payment/transactions?${params.toString()}`
      );
      dispatch({
        type: "SET_TRANSACTIONS",
        payload: response.data?.metadata?.transactions || [],
      });
      return response.data?.metadata;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch transactions";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Real-time balance updates via Socket.IO
  useEffect(() => {
    if (!user || !socket || !connected) return;

    const handleWalletUpdate = (data) => {
      if (data.type === "balance_updated") {
        dispatch({ type: "SET_BALANCE", payload: data.newBalance });
        // Silently update balance - toast is shown by TopUpSuccess page
      }

      if (data.type === "transaction_updated") {
        dispatch({ type: "UPDATE_TRANSACTION", payload: data.transaction });
      }
    };

    const handleTransactionUpdate = (data) => {
      if (data.transaction) {
        dispatch({ type: "UPDATE_TRANSACTION", payload: data.transaction });
      }
    };

    const handlePaymentStatus = (data) => {
      if (data.payment) {
        // Refresh balance after payment status update
        fetchBalance();
      }
    };

    const handleWalletMaintenance = (data) => {
      toast.error(`Wallet Maintenance: ${data.message}`, {
        duration: 8000,
      });
    };

    // Listen to socket events
    socket.on("wallet-updated", handleWalletUpdate);
    socket.on("wallet-transaction-updated", handleTransactionUpdate);
    socket.on("wallet-payment-status", handlePaymentStatus);
    socket.on("wallet-maintenance", handleWalletMaintenance);

    return () => {
      socket.off("wallet-updated", handleWalletUpdate);
      socket.off("wallet-transaction-updated", handleTransactionUpdate);
      socket.off("wallet-payment-status", handlePaymentStatus);
      socket.off("wallet-maintenance", handleWalletMaintenance);
    };
  }, [user, socket, connected, fetchBalance]);

  // Initialize wallet data when user logs in
  useEffect(() => {
    if (user) {
      fetchBalance();
    } else {
      dispatch({ type: "RESET" });
    }
  }, [user]);

  const value = {
    ...state,
    fetchBalance,
    createPayment,
    fetchTransactions,
    dispatch,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
