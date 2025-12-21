import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { WalletProvider } from "../context/WalletContext";
import { CartProvider } from "../context/CartContext";
import { NotificationProvider } from "../context/NotificationContext";
import { DisputeProvider } from "../context/DisputeContext";
import DisputeSocketInitializer from "../components/common/DisputeSocketInitializer";

// Create a client with proper configuration for chat
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity, // CRITICAL: Prevent auto-refetch
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppProviders = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <CartProvider>
            <NotificationProvider>
              <DisputeProvider>
              {/* Initialize dispute socket at app level */}
              <DisputeSocketInitializer />
              {children}
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                  // Styling with close button
                  className: "",
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                    padding: "16px",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                    maxWidth: "500px",
                  },
                  // Custom styles for different types
                  success: {
                    duration: 3000,
                    style: {
                      background: "#10B981",
                    },
                    iconTheme: {
                      primary: "#fff",
                      secondary: "#10B981",
                    },
                  },
                  error: {
                    duration: 5000,
                    style: {
                      background: "#EF4444",
                    },
                    iconTheme: {
                      primary: "#fff",
                      secondary: "#EF4444",
                    },
                  },
                  loading: {
                    style: {
                      background: "#3B82F6",
                    },
                  },
                  // Enable close button for all toasts
                  dismissible: true,
                }}
              />
            
             </DisputeProvider>
            </NotificationProvider>
          </CartProvider>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;
