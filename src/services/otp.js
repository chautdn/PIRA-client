import api from "./api";

/**
 * OTP Service for Contract Signing
 */
class OTPService {
  /**
   * Send OTP for contract signing
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} { success, message, data: { expiresAt, sentCount, remainingAttempts } }
   */
  async sendContractSigningOTP(contractId) {
    try {
      const response = await api.post("/otp/contract-signing/send", {
        contractId,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Không thể gửi mã OTP");
    }
  }

  /**
   * Verify OTP for contract signing
   * @param {string} contractId - Contract ID
   * @param {string} otp - OTP code (6 digits)
   * @returns {Promise<Object>} { success, message, data: { verified: true } }
   */
  async verifyContractSigningOTP(contractId, otp) {
    try {
      const response = await api.post("/otp/contract-signing/verify", {
        contractId,
        otp,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Mã OTP không chính xác"
      );
    }
  }

  /**
   * Get OTP status (for debugging)
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>}
   */
  async getOTPStatus(contractId) {
    try {
      const response = await api.get(
        `/otp/contract-signing/status/${contractId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy trạng thái OTP"
      );
    }
  }
}

export default new OTPService();
