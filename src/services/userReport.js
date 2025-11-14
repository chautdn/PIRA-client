import { api } from './api';

// User Report Service
class UserReportService {
  // Get user's own reports
  async getUserReports(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/reports/my-reports?${queryParams.toString()}`);
      
      if (response.data) {
        return response.data;
      }
      
      return {
        success: true,
        data: {
          reports: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            total: 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw error;
    }
  }

  // Get a specific report by ID
  async getReportById(reportId) {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report detail:', error);
      throw error;
    }
  }

  // Create a new report
  async createReport(reportData) {
    try {
      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  // Delete own report (if allowed)
  async deleteReport(reportId) {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Get report statistics for user
  async getReportStats() {
    try {
      const response = await api.get('/reports/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching report stats:', error);
      throw error;
    }
  }
}

// Create and export service instance
export const userReportService = new UserReportService();

// Export individual methods for convenience
export const {
  getUserReports,
  getReportById,
  createReport,
  deleteReport,
  getReportStats
} = userReportService;

export default userReportService;
