/**
 * HƯỚNG DẪN DỊCH CÁC PAGE CHÍNH
 * 
 * Đây là danh sách tất cả các keys cần dịch theo từng trang.
 * Hãy thêm chúng vào locales/en.json và locales/vi.json
 */

// HOME PAGE KEYS
const HOME_KEYS = {
  // Hero Section
  "pages.home.hero.title": "Your Travel Equipment Adventure Awaits",
  "pages.home.hero.description": "Premium travel gear, trusted locals",
  "pages.home.hero.cta": "Start Renting Now",
  
  // Featured Section
  "pages.home.featured.title": "Featured Equipment",
  "pages.home.featured.see_more": "See All Products",
  
  // Testimonials
  "pages.home.testimonials.title": "Trusted by Travelers Worldwide",
  "pages.home.testimonials.subtitle": "See what our community says about PIRA",
  
  // Benefits
  "pages.home.benefits.affordable": "Affordable Rentals",
  "pages.home.benefits.verified": "Verified Owners",
  "pages.home.benefits.insured": "Equipment Insured",
  "pages.home.benefits.support": "24/7 Support",
};

// PRODUCT LIST KEYS
const PRODUCT_LIST_KEYS = {
  "pages.productList.title": "Discover Travel Equipment",
  "pages.productList.subtitle": "Find the perfect gear for your adventure",
  "pages.productList.filters.category": "Category",
  "pages.productList.filters.price": "Price Range",
  "pages.productList.filters.condition": "Condition",
  "pages.productList.filters.apply": "Apply Filters",
  "pages.productList.filters.clear": "Clear All",
  "pages.productList.sorting.newest": "Newest",
  "pages.productList.sorting.popular": "Most Popular",
  "pages.productList.sorting.cheapest": "Cheapest",
  "pages.productList.sorting.rating": "Highest Rated",
  "pages.productList.no_results": "No products found",
};

// PRODUCT DETAIL KEYS
const PRODUCT_DETAIL_KEYS = {
  "pages.productDetail.share": "Share",
  "pages.productDetail.save": "Save",
  "pages.productDetail.owner": "Owner",
  "pages.productDetail.rating": "Rating",
  "pages.productDetail.reviews": "Reviews",
  "pages.productDetail.condition": "Condition",
  "pages.productDetail.rental.startDate": "Start Date",
  "pages.productDetail.rental.endDate": "End Date",
  "pages.productDetail.rental.duration": "Rental Duration",
  "pages.productDetail.rental.dailyRate": "Daily Rate",
  "pages.productDetail.rental.weeklyRate": "Weekly Rate",
  "pages.productDetail.rental.monthlyRate": "Monthly Rate",
  "pages.productDetail.rental.deposit": "Deposit",
  "pages.productDetail.rental.confirm": "Confirm Rental",
  "pages.productDetail.rental.days": "days",
};

// CART KEYS
const CART_KEYS = {
  "pages.cart.title": "Shopping Cart",
  "pages.cart.empty": "Your cart is empty",
  "pages.cart.continue_shopping": "Continue Shopping",
  "pages.cart.subtotal": "Subtotal",
  "pages.cart.shipping": "Shipping",
  "pages.cart.tax": "Tax",
  "pages.cart.total": "Total",
  "pages.cart.checkout": "Proceed to Checkout",
  "pages.cart.quantity": "Quantity",
  "pages.cart.remove": "Remove",
};

// AUTH KEYS
const AUTH_KEYS = {
  "pages.auth.login.title": "Sign In",
  "pages.auth.login.subtitle": "Welcome back to PIRA",
  "pages.auth.login.email": "Email",
  "pages.auth.login.password": "Password",
  "pages.auth.login.forgotPassword": "Forgot Password?",
  "pages.auth.login.submit": "Sign In",
  "pages.auth.login.noAccount": "Don't have an account?",
  "pages.auth.login.register": "Register",
  
  "pages.auth.register.title": "Create Account",
  "pages.auth.register.subtitle": "Join PIRA today",
  "pages.auth.register.email": "Email",
  "pages.auth.register.password": "Password",
  "pages.auth.register.confirmPassword": "Confirm Password",
  "pages.auth.register.terms": "I agree to the Terms of Service",
  "pages.auth.register.submit": "Register",
  "pages.auth.register.haveAccount": "Already have an account?",
  "pages.auth.register.login": "Sign In",
};

// PROFILE KEYS
const PROFILE_KEYS = {
  "pages.profile.myProfile": "My Profile",
  "pages.profile.myRentals": "My Rentals",
  "pages.profile.myProducts": "My Products",
  "pages.profile.earnings": "My Earnings",
  "pages.profile.statistics": "Statistics",
  "pages.profile.wallet": "Wallet",
  "pages.profile.settings": "Settings",
  "pages.profile.help": "Help & Support",
  "pages.profile.logout": "Logout",
};

// DASHBOARD KEYS
const DASHBOARD_KEYS = {
  "pages.dashboard.overview": "Overview",
  "pages.dashboard.statistics": "Statistics",
  "pages.dashboard.recentOrders": "Recent Orders",
  "pages.dashboard.recentRentals": "Recent Rentals",
  "pages.dashboard.revenue": "Revenue",
  "pages.dashboard.activeListings": "Active Listings",
};

// CHAT KEYS
const CHAT_KEYS = {
  "pages.chat.title": "Messages",
  "pages.chat.conversations": "Conversations",
  "pages.chat.noConversations": "No conversations yet",
  "pages.chat.type_message": "Type a message...",
  "pages.chat.send": "Send",
  "pages.chat.online": "Online",
  "pages.chat.offline": "Offline",
};

// NOTIFICATIONS KEYS
const NOTIFICATIONS_KEYS = {
  "pages.notifications.title": "Notifications",
  "pages.notifications.empty": "No notifications",
  "pages.notifications.markAsRead": "Mark as Read",
  "pages.notifications.markAllAsRead": "Mark All as Read",
  "pages.notifications.clear": "Clear All",
};

// ERROR MESSAGES
const ERROR_KEYS = {
  "errors.networkError": "Network error. Please try again.",
  "errors.serverError": "Server error. Please try again later.",
  "errors.unauthorized": "Unauthorized access",
  "errors.forbidden": "You don't have permission to access this",
  "errors.notFound": "Page not found",
  "errors.validationError": "Please check your input",
  "errors.loginFailed": "Login failed. Please check your credentials.",
  "errors.registrationFailed": "Registration failed. Please try again.",
};

// SUCCESS MESSAGES
const SUCCESS_KEYS = {
  "messages.success.login": "Logged in successfully",
  "messages.success.register": "Registration successful",
  "messages.success.saved": "Saved successfully",
  "messages.success.deleted": "Deleted successfully",
  "messages.success.updated": "Updated successfully",
  "messages.success.addToCart": "Added to cart",
  "messages.success.removeFromCart": "Removed from cart",
};

console.log("Translation keys defined. Add these to locales/en.json and locales/vi.json");
