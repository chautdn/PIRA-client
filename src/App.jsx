import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppProviders from "./providers/AppProviders";
import Navigation from "./components/layout/Navigation";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";
import { ROUTES } from "./utils/constants";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Dashboard from "./pages/Dashboard";
import Profile from "./components/auth/Profile";
import Chat from "./pages/Chat";
import OwnerCreateProduct from "./pages/owner/OwnerCreateProduct";

// Chat components
import ChatContainer from "./components/chat/ChatContainer";
import ProductChatContainer from "./components/chat/ProductChatContainer";

// Component to handle scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Component to conditionally render Navigation
function ConditionalNavigation() {
  const location = useLocation();

  const authRoutes = [
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.VERIFY_EMAIL,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
    ROUTES.PROFILE,
  ];

  if (authRoutes.includes(location.pathname)) {
    return null;
  }

  return <Navigation />;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50">
          <ConditionalNavigation />
          <main>
            <Routes>
              {/* Public routes */}
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.REGISTER} element={<Register />} />
              <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
              <Route path={ROUTES.HOME} element={<Home />} />
              <Route path={ROUTES.PRODUCTS} element={<ProductList />} />
              <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetail />} />
              <Route path={ROUTES.PROFILE} element={<Profile />} />

              {/* Dashboard - chỉ OWNER được vào */}
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <RoleProtectedRoute allowedRoles={["OWNER"]}>
                    <Dashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route path={ROUTES.OWNER_PRODUCTS} element={
                <RoleProtectedRoute allowedRoles={["OWNER"]}>
                  <ProductList isOwnerView={true} />
                </RoleProtectedRoute>
              } />
              <Route path={ROUTES.OWNER_CREATE_PRODUCT} element={
                <RoleProtectedRoute allowedRoles={["OWNER","RENTER"]}>
                  <OwnerCreateProduct />
                </RoleProtectedRoute>
              } />
              

              {/* Chat routes */}
              <Route path={ROUTES.CHAT} element={<Chat />}>
                {/* Default chat route */}
                <Route
                  index
                  element={
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="text-gray-500 text-lg">
                          Select a conversation to start chatting
                        </div>
                      </div>
                    </div>
                  }
                />
                {/* Specific conversation */}
                <Route path=":conversationId" element={<ChatContainer />} />
                {/* Product-specific conversation */}
                <Route
                  path="product/:productId/:ownerId"
                  element={<ProductChatContainer />}
                />
              </Route>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProviders>
  );
}
