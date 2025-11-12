import { api } from './api';

class UserReportService {
  async createReport(reportData) {
    try {
      console.log('Creating report:', reportData);
      const response = await api.post('/users/reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Create report error:', error);
      throw error;
    }
  }

  async getUserReports(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);

      const response = await api.get(`/users/reports?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Get user reports error:', error);
      throw error;
    }
  }

  async getReportById(reportId) {
    try {
      const response = await api.get(`/users/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Get report by ID error:', error);
      throw error;
    }
  }
}

export const userReportService = new UserReportService();