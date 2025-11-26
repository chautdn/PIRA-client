import api from './api';

const ShipmentService = {
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
  }

  // Create a shipment request
  async createShipment(payload) {
    try {
      const response = await api.post('/shipments', payload);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Không thể tạo yêu cầu vận chuyển');
    }
  }
};

export default ShipmentService;
