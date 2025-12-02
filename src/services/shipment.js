import api from './api';

const ShipmentService = {
  // Get available shippers
  async getAvailableShippers(params = {}) {
    try {
      const response = await api.get('/shipments/shippers', { params });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể lấy danh sách shipper');
    }
  },

  // List shippers by ward/district/city
  async listShippers(params = {}) {
    try {
      const response = await api.get('/shipments/shippers', { params });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể lấy danh sách shipper');
    }
  },

  async listMyShipments(params = {}) {
    try {
      const response = await api.get('/shipments/my', { params });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể lấy danh sách shipments');
    }
  },

  async acceptShipment(shipmentId) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/accept`);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể chấp nhận shipment');
    }
  },

  async pickupShipment(shipmentId, data = {}) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/pickup`, data);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể cập nhật pickup');
    }
  },

  async deliverShipment(shipmentId, data = {}) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/deliver`, data);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể cập nhật deliver');
    }
  },

  async uploadProof(shipmentId, formData) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể upload proof');
    }
  },

  async getProof(shipmentId) {
    try {
      const response = await api.get(`/shipments/${shipmentId}/proof`);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể lấy proof');
    }
  },

  async renterConfirm(shipmentId) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/confirm`);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể xác nhận nhận hàng');
    }
  },

  // Create a shipment request
  async createShipment(payload) {
    try {
      const response = await api.post('/shipments', payload);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể tạo yêu cầu vận chuyển');
    }
  },

  // Create both DELIVERY and RETURN shipments for an order and assign to shipper
  async createDeliveryAndReturnShipments(masterOrderId, shipperId) {
    try {
      const response = await api.post(`/shipments/order/${masterOrderId}/create-shipments`, {
        shipperId
      });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể tạo shipment (delivery + return)');
    }
  },

  // Get shipments for a master order
  async getShipmentsByMasterOrder(masterOrderId) {
    try {
      const response = await api.get(`/shipments/order/${masterOrderId}`);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể lấy danh sách shipment');
    }
  },

  // Cancel shipment pickup (shipper cannot pickup from owner)
  async cancelShipmentPickup(shipmentId) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/cancel-pickup`);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể hủy vận chuyển');
    }
  },

  // Reject delivery - renter doesn't accept the delivered goods
  async rejectDelivery(shipmentId, data = {}) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/reject-delivery`, data);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể ghi nhận renter không nhận hàng');
    }
  },

  // Owner no-show - shipper confirms owner is not available for delivery
  async ownerNoShow(shipmentId, data = {}) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/owner-no-show`, data);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể ghi nhận chủ không có mặt');
    }
  },

  // Renter no-show - shipper cannot contact renter during delivery
  async renterNoShow(shipmentId, data = {}) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/renter-no-show`, data);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể ghi nhận không liên lạc được renter');
    }
  },

  // Return failed - shipper cannot contact renter during return
  async returnFailed(shipmentId, data = {}) {
    try {
      const response = await api.post(`/shipments/${shipmentId}/return-failed`, data);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể ghi nhận trả hàng thất bại');
    }
  }
};

export default ShipmentService;
