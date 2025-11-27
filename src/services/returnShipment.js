/**
 * Return Shipment Service - Client Side
 * API calls for return shipment workflow
 */

import api from './api';

const ENDPOINT = '/return-shipments';

export const returnShipmentService = {
  /**
   * Admin/Owner: Initiate return when rental ends
   * POST /return-shipments/initiate/:subOrderId
   */
  initiateReturn: async (subOrderId, returnType = 'NORMAL', notes = '') => {
    try {
      const response = await api.post(`${ENDPOINT}/initiate/${subOrderId}`, {
        returnType,
        notes
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },

  /**
   * Shipper: List available returns
   * GET /return-shipments?status=PENDING|SHIPPER_CONFIRMED|IN_TRANSIT
   */
  listReturnShipments: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get(ENDPOINT, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },

  /**
   * Get return shipment detail
   * GET /return-shipments/:shipmentId
   */
  getReturnShipmentDetail: async (shipmentId) => {
    try {
      const response = await api.get(`${ENDPOINT}/${shipmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },

  /**
   * Shipper: Confirm return task (accept)
   * POST /return-shipments/:shipmentId/confirm
   */
  confirmReturn: async (shipmentId) => {
    try {
      const response = await api.post(`${ENDPOINT}/${shipmentId}/confirm`, {});
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },

  /**
   * Shipper: Pickup from renter with photos
   * POST /return-shipments/:shipmentId/pickup
   * Body: { photos: [...], condition: "GOOD|DAMAGED", notes: "..." }
   */
  pickupReturn: async (shipmentId, pickupData) => {
    try {
      const response = await api.post(`${ENDPOINT}/${shipmentId}/pickup`, pickupData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },

  /**
   * Shipper: Complete return delivery to owner with photos
   * POST /return-shipments/:shipmentId/complete
   * Body: { photos: [...], condition: "GOOD|DAMAGED", notes: "..." }
   */
  completeReturn: async (shipmentId, completeData) => {
    try {
      const response = await api.post(`${ENDPOINT}/${shipmentId}/complete`, completeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  }
};

export default returnShipmentService;
