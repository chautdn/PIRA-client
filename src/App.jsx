import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppProviders from "./providers/AppProviders";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import CartDrawer from "./components/cart/CartDrawer";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ROUTES } from "./utils/constants";
import { WishlistProvider } from "./context/WishlistContext";
// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Dashboard from "./pages/Dashboard";
import Profile from "./components/auth/Profile";
import Chat from "./pages/Chat";
import OwnerCreateProduct from "./pages/owner/OwnerCreateProduct";
import OwnerProducts from "./pages/owner/OwnerProducts";
import OwnerProductEdit from "./pages/owner/OwnerProductEdit";
import PromotionSuccess from "./pages/owner/PromotionSuccess";
import OwnerRentalRequests from "./pages/owner/OwnerRentalRequests";
import ActiveRentals from "./pages/owner/ActiveRentals";

// Wallet pages
import TopUpSuccess from "./pages/wallet/TopUpSuccess";
import TopUpCancel from "./pages/wallet/TopUpCancel";
import Withdrawals from "./pages/Withdrawals";

// Payment result pages
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentCancelled from "./pages/payment/PaymentCancelled";
import PaymentPending from "./pages/payment/PaymentPending";
import PaymentError from "./pages/payment/PaymentError";
import RentalPaymentReturn from "./pages/rental/RentalPaymentReturn";

// Chat components
import ChatContainer from "./components/chat/ChatContainer";
import ProductChatContainer from "./components/chat/ProductChatContainer";

// Admin components
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import UserDetail from "./pages/admin/UserDetail";
import ProductManagement from "./pages/admin/ProductManagement";
import SystemPromotionManagement from "./pages/admin/SystemPromotionManagement";
import PromotionBanner from "./components/common/PromotionBanner";
import AdminProductDetail from "./pages/admin/AdminProductDetail";
import OrderManagement from "./pages/admin/OrderManagement";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import ReportManagement from "./pages/admin/ReportManagement";
import AdminReportDetail from "./pages/admin/AdminReportDetail";
import BankManagement from "./pages/admin/BankManagement";
import AdminBankDetail from "./pages/admin/AdminBankDetail";
import WithdrawalManagement from "./pages/admin/WithdrawalManagement";
import MyReports from "./pages/auth/MyReports";

// Rental system pages
import RentalOrdersPage from "./pages/RentalOrders";
import RentalOrderDetailPage from "./pages/RentalOrderDetail";
import RentalOrderForm from "./components/rental/RentalOrderForm";
import OrderConfirmation from "./components/rental/OrderConfirmation";
import TransactionHistory from "./pages/TransactionHistory";
import ContractSigning from "./components/rental/ContractSigning";
import RenterConfirmationSummary from "./pages/RenterConfirmationSummary";
import { RentalOrderProvider } from "./context/RentalOrderContext";
import VoucherRedeem from "./pages/voucher/VoucherRedeem";

// Component to handle scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Component to conditionally render Promotion Banner
function ConditionalPromotionBanner() {
  const location = useLocation();

  // Don't show banner on admin routes
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return <PromotionBanner />;
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
  ];

  // Don't show navigation on auth routes or admin routes
  if (
    authRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/admin")
  ) {
    return null;
  }

  return <Navigation />;
}

// Component to conditionally render Footer
function ConditionalFooter() {
  const location = useLocation();

  const authRoutes = [
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.VERIFY_EMAIL,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
  ];

  // Don't show footer on auth routes, admin routes, or chat
  if (
    authRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith(ROUTES.CHAT)
  ) {
    return null;
  }

  return <Footer />;
}

export default function App() {
  return (
    <AppProviders>
      <WishlistProvider>
        <RentalOrderProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <ConditionalPromotionBanner />
              <ConditionalNavigation />
              <CartDrawer />
              <main className="flex-1">
                <Routes>
                  {/* Public routes */}
                  <Route path={ROUTES.LOGIN} element={<Login />} />
                  <Route path={ROUTES.REGISTER} element={<Register />} />
                  <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
                  <Route
                    path={ROUTES.FORGOT_PASSWORD}
                    element={<ForgotPassword />}
                  />
                  <Route
                    path={ROUTES.RESET_PASSWORD}
                    element={<ResetPassword />}
                  />
                  <Route path={ROUTES.HOME} element={<Home />} />
                  <Route path={ROUTES.PRODUCTS} element={<ProductList />} />
                  <Route
                    path={ROUTES.PRODUCT_DETAIL}
                    element={<ProductDetail />}
                  />
                  <Route path={ROUTES.CART} element={<Cart />} />
                  <Route path={ROUTES.PROFILE} element={<Profile />} />

                  {/* Owner routes - accessible through navigation menu */}
                  <Route
                    path={ROUTES.OWNER_PRODUCTS}
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <OwnerProducts />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.OWNER_CREATE_PRODUCT}
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <OwnerCreateProduct />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/owner/products/edit/:productId"
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <OwnerProductEdit />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/owner/promotion-success"
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <PromotionSuccess />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/owner/rental-requests"
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <OwnerRentalRequests />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.OWNER_ACTIVE_RENTALS}
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <ActiveRentals />
                      </RoleProtectedRoute>
                    }
                  />

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

                  {/* My Reports */}
                  <Route
                    path={ROUTES.MY_REPORTS}
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <MyReports />
                      </RoleProtectedRoute>
                    }
                  />

                  {/* Wallet routes */}
                  <Route
                    path="/wallet/topup-success"
                    element={<TopUpSuccess />}
                  />
                  <Route
                    path="/wallet/topup-cancel"
                    element={<TopUpCancel />}
                  />
                  <Route path="/withdrawals" element={<Withdrawals />} />

                  {/* Transaction History */}
                  <Route
                    path="/transactions"
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <TransactionHistory />
                      </RoleProtectedRoute>
                    }
                  />

                  {/* Payment result routes */}
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route
                    path="/payment/cancelled"
                    element={<PaymentCancelled />}
                  />
                  <Route path="/payment/pending" element={<PaymentPending />} />
                  <Route path="/payment/error" element={<PaymentError />} />

                  {/* Rental Order routes */}
                  <Route
                    path="/rental-orders"
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <RentalOrdersPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/rental-orders/:id"
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <RentalOrderDetailPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/rental-orders/:masterOrderId/confirmation-summary"
                    element={
                      <RoleProtectedRoute allowedRoles={["RENTER", "OWNER"]}>
                        <RenterConfirmationSummary />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/rental-orders/create"
                    element={
                      <RoleProtectedRoute allowedRoles={["RENTER"]}>
                        <ErrorBoundary>
                          <RentalOrderForm />
                        </ErrorBoundary>
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/rental-orders/confirmation/:id"
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <OrderConfirmation />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="/rental-orders/contracts"
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <ContractSigning />
                      </RoleProtectedRoute>
                    }
                  />

                  {/* Voucher routes */}
                  <Route
                    path="/vouchers"
                    element={
                      <RoleProtectedRoute allowedRoles={["OWNER", "RENTER"]}>
                        <VoucherRedeem />
                      </RoleProtectedRoute>
                    }
                  />

                  {/* Admin routes - chỉ ADMIN được vào */}
                  <Route
                    path="/admin"
                    element={
                      <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                        <AdminLayout />
                      </RoleProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="users/:userId" element={<UserDetail />} />
                    <Route path="products" element={<ProductManagement />} />
                    <Route
                      path="products/:productId"
                      element={<AdminProductDetail />}
                    />
                    <Route
                      path="promotions"
                      element={<SystemPromotionManagement />}
                    />
                    <Route path="orders" element={<OrderManagement />} />
                    <Route
                      path="orders/:orderId"
                      element={<AdminOrderDetail />}
                    />
                    <Route path="reports" element={<ReportManagement />} />
                    <Route
                      path="reports/:reportId"
                      element={<AdminReportDetail />}
                    />
                    <Route path="bank-accounts" element={<BankManagement />} />
                    <Route
                      path="bank-accounts/:userId"
                      element={<AdminBankDetail />}
                    />
                    <Route path="withdrawals" element={<WithdrawalManagement />} />
                    <Route
                      path="settings"
                      element={<div>System Settings - Coming Soon</div>}
                    />
                    <Route path="profile" element={<Profile />} />
                  </Route>
                </Routes>
              </main>
              <ConditionalFooter />
            </div>
          </BrowserRouter>
        </RentalOrderProvider>
      </WishlistProvider>
    </AppProviders>
  );
}
