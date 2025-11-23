import api from './api.js';

class ExtensionService {
  // Renter tạo yêu cầu gia hạn
  async requestExtension(subOrderId, data) {
    try {
      const response = await api.post('/extensions/request', {
        subOrderId,
        ...data
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Không thể tạo yêu cầu gia hạn'
      );
    }
  }

  // Renter xem danh sách yêu cầu gia hạn của mình
  async getRenterExtensionRequests(filters = {}) {
    try {
      const response = await api.get('/extensions/renter-requests', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Không thể lấy danh sách yêu cầu'
      );
    }
  }

  // Renter hủy yêu cầu gia hạn
  async cancelExtension(requestId) {
    try {
      const response = await api.put(`/extensions/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Không thể hủy yêu cầu'
      );
    }
  }

  // Owner xem danh sách yêu cầu gia hạn
  async getOwnerExtensionRequests(filters = {}) {
    try {
      console.log('🔄 API Call: GET /extensions/owner-requests', { filters });
      const token = localStorage.getItem('accessToken');
      console.log('� Token exists:', !!token);
      
      const response = await api.get('/extensions/owner-requests', {
        params: filters
      });
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Error:', error.response?.status, error.response?.data);
      throw new Error(
        error.response?.data?.message || 'Không thể lấy danh sách yêu cầu'
      );
    }
  }

  // Owner xem chi tiết yêu cầu gia hạn
  async getExtensionRequestDetail(requestId) {
    try {
      const response = await api.get(`/extensions/${requestId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Không thể lấy chi tiết yêu cầu'
      );
    }
  }

  // Owner chấp nhận yêu cầu gia hạn
  async approveExtension(requestId) {
    try {
      const response = await api.put(`/extensions/${requestId}/approve`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Không thể chấp nhận yêu cầu'
      );
    }
  }

  // Owner từ chối yêu cầu gia hạn
  async rejectExtension(requestId, data) {
    try {
      const response = await api.put(`/extensions/${requestId}/reject`, data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Không thể từ chối yêu cầu'
      );
    }
  }
}

export default new ExtensionService();
