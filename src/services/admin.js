import { api } from './api';

// Base admin API service
class AdminService {
  // Dashboard APIs
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard');
      console.log('AdminService getDashboardStats - Full response:', response);
      console.log('AdminService getDashboardStats - Response data:', response.data);
      
      // Handle different response structures
      if (response.data && response.data.success && response.data.data) {
        console.log('Found dashboard data in response.data.data');
        return response.data.data;
      } else if (response.data && response.data.metadata) {
        console.log('Found dashboard data in response.data.metadata');
        return response.data.metadata;
      } else if (response.data) {
        console.log('Using response.data directly');
        return response.data;
      }
      
      console.warn('No valid dashboard data structure found');
      return null;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // If authentication error, return null to trigger fallback
      if (error.response?.status === 401) {
        console.warn('Not authorized to access admin dashboard');
        return null;
      }
      
      // For other errors, still return null to trigger fallback
      return null;
    }
  }

  // Helper method for mock dashboard data
  getMockDashboardStats() {
    return {
      totalUsers: 156,
      totalProducts: 89,
      totalOrders: 234,
      totalRevenue: 45600000,
      pendingProducts: 12,
      activeUsers: 145,
      todayOrders: 8,
      monthlyRevenue: 12400000
    };
  }

  // User Management APIs
  async getUsers(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/users?${query}`);
      
      // Handle different response structures
      if (response.data && response.data.metadata) {
        return response.data.metadata;
      } else if (response.data) {
        return response.data;
      } else {
        return { users: [], total: 0, totalPages: 1 };
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Return mock data if server is not available
      if (error.code === 'NETWORK_ERROR' || error.response?.status === 500) {
        return {
          users: [],
          total: 0,
          totalPages: 1
        };
      }
      
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      console.log('AdminService getUserById - Full response:', response);
      console.log('AdminService getUserById - response.data:', response.data);
      console.log('AdminService getUserById - response.data.metadata:', response.data?.metadata);
      
      // Handle different response structures
      let userData = null;
      
      // Check for responseUtils.success format: { success, message, data }
      if (response.data && response.data.data) {
        userData = response.data.data;
        console.log('Found user data in response.data.data');
      } else if (response.data && response.data.metadata) {
        userData = response.data.metadata;
        console.log('Found user data in response.data.metadata');
      } else if (response.data) {
        userData = response.data;
        console.log('Using response.data directly');
      }
      
      console.log('AdminService getUserById - Final userData:', userData);
      console.log('AdminService getUserById - userData.email:', userData?.email);
      
      return userData || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error - Unable to fetch user details');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized - Please login as admin');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error - Please check your connection');
      }
      
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data.metadata;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserStatus(userId, status) {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, { status });
      return response.data.metadata;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async updateUserRole(userId, role) {
    try {
      const response = await api.patch(`/admin/users/${userId}/role`, { role });
      return response.data.metadata;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Product Management APIs
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/products?${query}`);
      
      // Handle different response structures
      if (response.data && response.data.metadata) {
        return response.data.metadata;
      } else if (response.data) {
        return response.data;
      } else {
        return { products: [], total: 0, totalPages: 1 };
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      
      // Return mock data if server is not available
      if (error.code === 'NETWORK_ERROR' || error.response?.status === 500) {
        return {
          products: [],
          total: 0,
          totalPages: 1
        };
      }
      
      throw error;
    }
  }

  async getProductById(productId) {
    try {
      const response = await api.get(`/admin/products/${productId}`);
      console.log('AdminService getProductById - Full response:', response);
      console.log('AdminService getProductById - response.data:', response.data);
      console.log('AdminService getProductById - response.data.metadata:', response.data?.metadata);
      
      // Handle different response structures
      let productData = null;
      
      // Check for responseUtils.success format: { success, message, data }
      if (response.data && response.data.data) {
        productData = response.data.data;
        console.log('Found product data in response.data.data');
      } else if (response.data && response.data.metadata) {
        productData = response.data.metadata;
        console.log('Found product data in response.data.metadata');
      } else if (response.data) {
        productData = response.data;
        console.log('Using response.data directly');
      }
      
      console.log('AdminService getProductById - Final productData:', productData);
      console.log('AdminService getProductById - productData.title:', productData?.title);
      
      return productData || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Product not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error - Unable to fetch product details');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized - Please login as admin');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error - Please check your connection');
      }
      
      throw error;
    }
  }

  async approveProduct(productId, approvalData = {}) {
    try {
      const response = await api.patch(`/admin/products/${productId}/approve`, approvalData);
      return response.data.metadata;
    } catch (error) {
      console.error('Error approving product:', error);
      throw error;
    }
  }

  async rejectProduct(productId, rejectionData) {
    try {
      const response = await api.patch(`/admin/products/${productId}/reject`, rejectionData);
      return response.data.metadata;
    } catch (error) {
      console.error('Error rejecting product:', error);
      throw error;
    }
  }

  async updateProduct(productId, productData) {
    try {
      const response = await api.put(`/admin/products/${productId}`, productData);
      return response.data.metadata;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async updateProductStatus(productId, status) {
    try {
      const response = await api.patch(`/admin/products/${productId}/status`, { status });
      console.log('AdminService updateProductStatus - Full response:', response);
      
      // Handle different response structures
      let productData = null;
      
      if (response.data && response.data.data) {
        productData = response.data.data;
      } else if (response.data && response.data.metadata) {
        productData = response.data.metadata;
      } else if (response.data) {
        productData = response.data;
      }
      
      return productData || { status };
    } catch (error) {
      console.error('Error updating product status:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Product not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error - Unable to update product status');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized - Please login as admin');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error - Please check your connection');
      }
      
      throw error;
    }
  }

  // Category Management APIs
  async getCategories(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/categories?${query}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getCategoryById(categoryId) {
    try {
      const response = await api.get(`/admin/categories/${categoryId}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  async createCategory(categoryData) {
    try {
      const response = await api.post('/admin/categories', categoryData);
      return response.data.metadata;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(categoryId, categoryData) {
    try {
      const response = await api.put(`/admin/categories/${categoryId}`, categoryData);
      return response.data.metadata;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId) {
    try {
      const response = await api.delete(`/admin/categories/${categoryId}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Order Management APIs
  async getOrders(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      console.log('🔄 AdminService.getOrders - Calling API with params:', params);
      console.log('🔗 API URL:', `/admin/orders?${query}`);
      
      const response = await api.get(`/admin/orders?${query}`);
      console.log('📦 AdminService.getOrders - Raw response:', response);
      console.log('📦 AdminService.getOrders - Response data:', response.data);
      
      // Handle different response structures from backend
      if (response.data) {
        // Check for success wrapper format
        if (response.data.success && response.data.data) {
          console.log('✅ Found data in success wrapper');
          return response.data.data;
        }
        // Check for metadata format
        else if (response.data.metadata) {
          console.log('✅ Found data in metadata');
          return response.data.metadata;
        }
        // Direct data format
        else {
          console.log('✅ Using direct response data');
          return response.data;
        }
      }
      
      console.log('⚠️ No valid data structure found');
      return { orders: [], total: 0, totalPages: 1, currentPage: 1 };
    } catch (error) {
      console.error('❌ AdminService.getOrders - Error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      // Re-throw with more context
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please login as admin');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: Admin access required');
      } else if (error.response?.status === 500) {
        throw new Error('Server error: Please try again later');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error: Please check your connection');
      }
      
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      console.log('AdminService getOrderById - Full response:', response);
      console.log('AdminService getOrderById - response.data:', response.data);
      console.log('AdminService getOrderById - response.data.metadata:', response.data?.metadata);
      
      // Handle different response structures
      let orderData = null;
      
      // Check for responseUtils.success format: { success, message, data }
      if (response.data && response.data.data) {
        orderData = response.data.data;
        console.log('Found order data in response.data.data');
      } else if (response.data && response.data.metadata) {
        orderData = response.data.metadata;
        console.log('Found order data in response.data.metadata');
      } else if (response.data) {
        orderData = response.data;
        console.log('Using response.data directly');
      }
      
      console.log('AdminService getOrderById - Final orderData:', orderData);
      
      return orderData || null;
    } catch (error) {
      console.error('Error fetching order:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Order not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error - Unable to fetch order details');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized - Please login as admin');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error - Please check your connection');
      }
      
      throw error;
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Reports Management APIs
  async getReports(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/reports?${query}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  async handleReport(reportId, action, data = {}) {
    try {
      const response = await api.patch(`/admin/reports/${reportId}/${action}`, data);
      return response.data.metadata;
    } catch (error) {
      console.error('Error handling report:', error);
      throw error;
    }
  }

  // System Settings APIs
  async getSystemSettings() {
    try {
      const response = await api.get('/admin/settings');
      return response.data.metadata;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  }

  async updateSystemSettings(settings) {
    try {
      const response = await api.put('/admin/settings', settings);
      return response.data.metadata;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  // Analytics and Statistics APIs
  async getAnalytics(period = '30d') {
    try {
      const response = await api.get(`/admin/analytics?period=${period}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  async getRevenueStats(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/revenue-stats?${query}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    }
  }

  // Bulk Operations
  async bulkUpdateUsers(userIds, updateData) {
    try {
      const response = await api.patch('/admin/users/bulk-update', {
        userIds,
        updateData
      });
      return response.data.metadata;
    } catch (error) {
      console.error('Error bulk updating users:', error);
      throw error;
    }
  }

  async bulkUpdateProducts(productIds, updateData) {
    try {
      const response = await api.patch('/admin/products/bulk-update', {
        productIds,
        updateData
      });
      return response.data.metadata;
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw error;
    }
  }

  // Notifications
  async sendNotification(notificationData) {
    try {
      const response = await api.post('/admin/notifications', notificationData);
      return response.data.metadata;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async broadcastNotification(notificationData) {
    try {
      const response = await api.post('/admin/notifications/broadcast', notificationData);
      return response.data.metadata;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  // ========== REPORT MANAGEMENT ==========
  async getReports(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/admin/reports?${queryParams.toString()}`);
      
      if (response.data.success) {
        return response.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  async getReportById(reportId) {
    try {
      const response = await api.get(`/admin/reports/${reportId}`);
      
      if (response.data.success) {
        return response.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error fetching report detail:', error);
      throw error;
    }
  }

  async updateReportStatus(reportId, status, adminNotes) {
    try {
      const response = await api.patch(`/admin/reports/${reportId}/status`, {
        status,
        adminNotes
      });
      
      if (response.data.success) {
        return response.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  async deleteReportedProduct(reportId, productId) {
    try {
      const response = await api.delete(`/admin/reports/${reportId}/product`, {
        data: { productId }
      });
      
      if (response.data.success) {
        return response.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error deleting reported product:', error);
      throw error;
    }
  }

  // ========== BANK ACCOUNT VERIFICATION ==========
  async getAllBankAccounts(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/admin/bank-accounts?${queryParams.toString()}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      throw error;
    }
  }

  async getBankAccountById(userId) {
    try {
      const response = await api.get(`/admin/bank-accounts/${userId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error fetching bank account detail:', error);
      throw error;
    }
  }

  async verifyBankAccount(userId, adminNote) {
    try {
      const response = await api.patch(`/admin/bank-accounts/${userId}/verify`, {
        adminNote
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error verifying bank account:', error);
      throw error;
    }
  }

  async rejectBankAccount(userId, rejectionReason) {
    try {
      const response = await api.patch(`/admin/bank-accounts/${userId}/reject`, {
        rejectionReason
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error rejecting bank account:', error);
      throw error;
    }
  }

  async updateBankAccountStatus(userId, status, note) {
    try {
      const response = await api.patch(`/admin/bank-accounts/${userId}/status`, {
        status,
        note
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error updating bank account status:', error);
      throw error;
    }
  }
}

// Create and export admin service instance
export const adminService = new AdminService();

// Export individual methods for convenience
export const {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  updateUserRole,
  getProducts,
  getProductById,
  approveProduct,
  rejectProduct,
  updateProduct,
  updateProductStatus,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getReports,
  handleReport,
  getSystemSettings,
  updateSystemSettings,
  getAnalytics,
  getRevenueStats,
  bulkUpdateUsers,
  bulkUpdateProducts,
  sendNotification,
  broadcastNotification
} = adminService;