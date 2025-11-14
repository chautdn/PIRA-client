import { api } from './api';

// Base admin API service
class AdminService {
  // Dashboard APIs
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      if (error.response?.status === 401) {
        console.warn('Not authorized to access admin dashboard');
        return null;
      }
      
      return null;
    }
  }

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
      
      if (response.data && response.data.metadata) {
        return response.data.metadata;
      } else if (response.data) {
        return response.data;
      } else {
        return { users: [], total: 0, totalPages: 1 };
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      
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
      
      let userData = null;
      
      if (response.data && response.data.data) {
        userData = response.data.data;
      } else if (response.data && response.data.metadata) {
        userData = response.data.metadata;
      } else if (response.data) {
        userData = response.data;
      }
      
      return userData || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      
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

  async deleteUser(userId) {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Product Management APIs
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/products?${query}`);
      
      if (response.data && response.data.metadata) {
        return response.data.metadata;
      } else if (response.data) {
        return response.data;
      } else {
        return { products: [], total: 0, totalPages: 1 };
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      
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
      return response.data.metadata;
    } catch (error) {
      console.error('Error fetching product:', error);
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

  async deleteProduct(productId) {
    try {
      const response = await api.delete(`/admin/products/${productId}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error deleting product:', error);
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
      const response = await api.get(`/admin/orders?${query}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/status`, { status });
      return response.data.metadata;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Reports Management APIs
  async getReports(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
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

  async deleteReport(reportId) {
    try {
      const response = await api.delete(`/admin/reports/${reportId}`);
      
      if (response.data.success) {
        return response.data;
      }
      return response.data.metadata || response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
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
  deleteUser,
  getProducts,
  getProductById,
  approveProduct,
  rejectProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getReports,
  getReportById,
  updateReportStatus,
  deleteReport,
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