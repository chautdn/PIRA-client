import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Global error handler for React internal errors
window.addEventListener("error", (event) => {
  if (
    event.error &&
    event.error.message &&
    event.error.message.includes("inst")
  ) {
    console.error("React internal error caught:", event.error);
    event.preventDefault(); // Prevent crash
  }
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

const root = ReactDOM.createRoot(document.getElementById("root"));

// Temporarily disable StrictMode to avoid React 19 concurrent rendering issues
// Re-enable once all components are fully compatible with React 19
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Signal to the debug overlay that the app has mounted successfully
try {
  window.__PI_RA_CLIENT_MOUNTED__ = true;
} catch (e) {
  // ignore
}
