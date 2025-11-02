import api from "./api";

const withdrawalService = {
  // User endpoints
  requestWithdrawal: (data) => api.post("/withdrawals", data),
  getMyWithdrawals: (params) => api.get("/withdrawals", { params }),
  cancelWithdrawal: (id) => api.patch(`/withdrawals/${id}/cancel`),
  getDailyTotal: () => api.get("/withdrawals/daily-total"),

  // Admin endpoints (if needed later)
  getAllWithdrawals: (params) => api.get("/withdrawals/admin/all", { params }),
  updateStatus: (id, data) =>
    api.patch(`/withdrawals/admin/${id}/status`, data),
};

export default withdrawalService;
