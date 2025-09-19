import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import AppProviders from './providers/AppProviders';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navigation from './components/layout/Navigation';
import { ROUTES } from './utils/constants';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Chat from './pages/Chat';
import ChatContainer from './components/chat/ChatContainer';
import ChatDemo from './pages/ChatDemo';

// Component to handle scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

            {/* Routes with navigation */}
            <Route
              path="/*"
              element={
                <>
                  <Navigation />
                  <main>
                    <Routes>
                      <Route path={ROUTES.HOME} element={<Home />} />
                      <Route path={ROUTES.PRODUCTS} element={<ProductList />} />
                      <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetail />} />
                      <Route
                        path={ROUTES.DASHBOARD}
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={ROUTES.CHAT_DEMO}
                        element={
                          <ProtectedRoute>
                            <ChatDemo />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </main>
                </>
              }
            />

            {/* Chat routes (full screen, no navigation) */}
            <Route
              path={ROUTES.CHAT}
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            >
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
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AppProviders>
  );
}