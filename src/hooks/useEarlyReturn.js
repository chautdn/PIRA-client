import { useState, useCallback } from "react";
import earlyReturnApi from "../services/earlyReturn.Api";
import { toast } from "../components/common/Toast";

/**
 * Custom hook for managing early return operations
 * Provides CRUD operations for early return requests
 */
export const useEarlyReturn = () => {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Create early return request
   */
  const createRequest = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await earlyReturnApi.create(data);
      toast.success("✅ Tạo yêu cầu trả sớm thành công!");
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể tạo yêu cầu";
      toast.error(`❌ ${message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update early return request
   */
  const updateRequest = useCallback(async (id, data) => {
    setUpdating(true);
    try {
      const response = await earlyReturnApi.update(id, data);
      toast.success("✅ Cập nhật yêu cầu thành công!");
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể cập nhật yêu cầu";
      toast.error(`❌ ${message}`);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Delete early return request (restore original return date)
   */
  const deleteRequest = useCallback(async (id) => {
    setDeleting(true);
    try {
      const response = await earlyReturnApi.delete(id);
      // Don't show toast here - let caller handle it based on refund result
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể xóa yêu cầu";
      toast.error(`❌ ${message}`);
      throw error;
    } finally {
      setDeleting(false);
    }
  }, []);

  /**
   * Get renter's early return requests
   */
  const getRenterRequests = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await earlyReturnApi.getRenterRequests(params);
      return response;
    } catch (error) {
      console.error("Failed to load early return requests:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get early return request details
   */
  const getRequestDetails = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await earlyReturnApi.getDetails(id);
      return response;
    } catch (error) {
      console.error("Failed to load request details:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancel early return request
   */
  const cancelRequest = useCallback(async (id, reason) => {
    setLoading(true);
    try {
      const response = await earlyReturnApi.cancel(id, reason);
      toast.success("✅ Đã hủy yêu cầu trả sớm!");
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể hủy yêu cầu";
      toast.error(`❌ ${message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    updating,
    deleting,
    createRequest,
    updateRequest,
    deleteRequest,
    getRenterRequests,
    getRequestDetails,
    cancelRequest,
  };
};
