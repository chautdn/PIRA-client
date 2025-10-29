import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { WalletProvider } from "../context/WalletContext";

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
        <WalletProvider>{children}</WalletProvider>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // Styling
            className: "",
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            // Custom styles for different types
            success: {
              duration: 3000,
              style: {
                background: "#10B981",
              },
            },
            error: {
              duration: 5000,
              style: {
                background: "#EF4444",
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;
