import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import kycService from "../../services/kyc.Api";
import userService from "../../services/user.Api";

const KycModal = ({
  visible,
  onClose,
  onSuccess,
  title = "Xác thực danh tính (KYC)",
}) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Review Info, 3: Success, 4: Already Verified
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);

  // **LOAD THÔNG TIN KYC KHI MỞ MODAL**
  useEffect(() => {
    if (visible) {
      loadKycData();
    }
  }, [visible]);

  const loadKycData = async () => {
    try {
      setInitialLoading(true);

      // Lấy trạng thái KYC
      const statusResponse = await kycService.getKYCStatus();

      if (statusResponse.data?.status === "success") {
        const kycData = statusResponse.data.data;

        setKycStatus(kycData);

        // **KIỂM TRA ĐIỀU KIỆN XÁC THỰC**
        if (kycData && kycData.isVerified === true) {

          try {
            // Lấy thông tin CCCD đã lưu
            const cccdResponse = await kycService.getUserCCCD();

            if (
              cccdResponse.data?.status === "success" &&
              cccdResponse.data.data
            ) {
              const cccdData = cccdResponse.data.data;

              setOcrData(cccdData);
              setStep(4); // Hiển thị thông tin đã xác thực
            } else {
              resetToUpload();
            }
          } catch (cccdError) {
            resetToUpload();
          }
        } else {
          resetToUpload();
        }
      } else {
        resetToUpload();
      }
    } catch (error) {
      resetToUpload();
    } finally {
      setInitialLoading(false);
    }
  };

  const resetToUpload = () => {
    setStep(1);
    setFrontImage(null);
    setBackImage(null);
    setFrontPreview(null);
    setBackPreview(null);
    setOcrData(null);
  };

  const handleImageSelect = (type, file) => {
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File quá lớn (tối đa 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === "front") {
          setFrontImage(file);
          setFrontPreview(e.target.result);
        } else {
          setBackImage(file);
          setBackPreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!frontImage && !backImage) {
      toast.error("Vui lòng chọn ít nhất một ảnh CCCD");
      return;
    }

    try {
      setLoading(true);
      const response = await kycService.uploadCCCDImages(frontImage, backImage);

      const isSuccess = response.data?.status === "success";
      const responseData = response.data?.data;
      const extractedInfo = responseData?.cccd?.extractedInfo;

      if (isSuccess && extractedInfo && Object.keys(extractedInfo).length > 0) {
        setOcrData(extractedInfo);
        setStep(2); // Chuyển đến bước review
        toast.success("🎉 Xác thực CCCD thành công!");
      } else if (isSuccess) {
        toast.success("Upload CCCD thành công!");
        setStep(3);
      } else {
        toast.error(response.data?.message || "Upload thất bại");
      }
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi upload");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.updateProfileByKyc();

      if (response.data?.status === "success") {
        toast.success("Đã áp dụng thông tin KYC vào profile thành công!");
        setStep(3);
        if (onSuccess) {
          onSuccess(response.data.data);
        }
      } else {
        toast.error(response.data?.message || "Cập nhật profile thất bại");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi cập nhật profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkipApply = () => {
    toast.success("Xác thực KYC thành công!");
    setStep(3);
    if (onSuccess) {
      onSuccess({ skipped: true });
    }
  };

  const handleReVerify = () => {
    resetToUpload();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const formatGender = (gender) => {
    const genderMap = {
      MALE: "Nam",
      NAM: "Nam",
      FEMALE: "Nữ",
      NỮ: "Nữ",
      OTHER: "Khác",
    };
    return genderMap[gender?.toUpperCase()] || gender || "N/A";
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {step === 4 ? "Thông tin xác thực" : title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Progress Steps - chỉ hiển thị khi chưa xác thực */}
            {step !== 4 && (
              <div className="mt-4 flex items-center space-x-4">
                <div
                  className={`flex items-center ${
                    step >= 1 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                  >
                    1
                  </div>
                  <span className="ml-2 text-sm">Upload ảnh</span>
                </div>
                <div
                  className={`w-8 h-0.5 ${
                    step >= 2 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`flex items-center ${
                    step >= 2 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                  >
                    2
                  </div>
                  <span className="ml-2 text-sm">Xác nhận thông tin</span>
                </div>
                <div
                  className={`w-8 h-0.5 ${
                    step >= 3 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`flex items-center ${
                    step >= 3 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 3 ? "bg-green-600 text-white" : "bg-gray-200"
                    }`}
                  >
                    ✓
                  </div>
                  <span className="ml-2 text-sm">Hoàn thành</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Loading state */}
            {initialLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Đang tải thông tin KYC...</p>
              </div>
            )}

            {/* Step 4: Already Verified - Hiển thị thông tin đã xác thực */}
            {!initialLoading && step === 4 && ocrData && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ✅ Đã xác thực danh tính
                  </h3>
                  <p className="text-gray-600 text-sm">
                    CCCD của bạn đã được xác thực thành công. Dưới đây là thông
                    tin đã lưu.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-green-700">
                        Số CCCD:
                      </label>
                      <p className="text-green-900 font-medium">
                        {ocrData.cccdNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700">
                        Họ và tên:
                      </label>
                      <p className="text-green-900 font-medium">
                        {ocrData.fullName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700">
                        Ngày sinh:
                      </label>
                      <p className="text-green-900">
                        {formatDate(ocrData.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700">
                        Giới tính:
                      </label>
                      <p className="text-green-900">
                        {formatGender(ocrData.gender)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">
                      Địa chỉ:
                    </label>
                    <p className="text-green-900">{ocrData.address || "N/A"}</p>
                  </div>
                  {kycStatus?.verifiedAt && (
                    <div>
                      <label className="text-sm font-medium text-green-700">
                        Thời gian xác thực:
                      </label>
                      <p className="text-green-900">
                        {formatDate(kycStatus.verifiedAt)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    🔄 Cập nhật Profile
                  </h4>
                  <p className="text-blue-700 text-sm mb-3">
                    Bạn có muốn áp dụng thông tin CCCD này vào profile để cập
                    nhật thông tin cá nhân không?
                  </p>
                  <button
                    onClick={handleApplyToProfile}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {loading ? "Đang cập nhật..." : "Áp dụng vào Profile"}
                  </button>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handleReVerify}
                    className="px-4 py-2 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 text-sm"
                  >
                    📷 Xác thực lại
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Upload Images */}
            {!initialLoading && step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload ảnh CCCD/CMND
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Vui lòng chụp rõ ràng cả mặt trước và mặt sau của CCCD
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front Image */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mặt trước CCCD
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      {frontPreview ? (
                        <div className="relative">
                          <img
                            src={frontPreview}
                            alt="Preview"
                            className="w-full h-40 object-cover rounded"
                          />
                          <button
                            onClick={() => {
                              setFrontImage(null);
                              setFrontPreview(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageSelect("front", e.target.files[0])
                            }
                            className="hidden"
                          />
                          <div className="text-gray-400">
                            <div className="text-2xl mb-2">📄</div>
                            <div className="text-sm">Chọn ảnh mặt trước</div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Back Image */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mặt sau CCCD
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      {backPreview ? (
                        <div className="relative">
                          <img
                            src={backPreview}
                            alt="Preview"
                            className="w-full h-40 object-cover rounded"
                          />
                          <button
                            onClick={() => {
                              setBackImage(null);
                              setBackPreview(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageSelect("back", e.target.files[0])
                            }
                            className="hidden"
                          />
                          <div className="text-gray-400">
                            <div className="text-2xl mb-2">📄</div>
                            <div className="text-sm">Chọn ảnh mặt sau</div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={(!frontImage && !backImage) || loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Đang xử lý..." : "Upload & Xác thực"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review OCR Data */}
            {!initialLoading && step === 2 && ocrData && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Xác nhận thông tin đã đọc được
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Hệ thống đã đọc được thông tin sau từ CCCD của bạn. Bạn có
                    muốn áp dụng thông tin này vào profile không?
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Số CCCD:
                      </label>
                      <p className="text-gray-900">
                        {ocrData.cccdNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Họ và tên:
                      </label>
                      <p className="text-gray-900">
                        {ocrData.fullName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Ngày sinh:
                      </label>
                      <p className="text-gray-900">
                        {formatDate(ocrData.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Giới tính:
                      </label>
                      <p className="text-gray-900">
                        {formatGender(ocrData.gender)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Địa chỉ:
                    </label>
                    <p className="text-gray-900">{ocrData.address || "N/A"}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Áp dụng vào profile
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Nếu bạn đồng ý, thông tin trên sẽ được cập nhật vào profile
                    của bạn để hoàn thiện hồ sơ.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleSkipApply}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={handleApplyToProfile}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Đang cập nhật..." : "Áp dụng vào Profile"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {!initialLoading && step === 3 && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Xác thực thành công!
                  </h3>
                  <p className="text-gray-600">
                    CCCD của bạn đã được xác thực thành công. Bạn có thể đóng
                    cửa sổ này.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Hoàn thành
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KycModal;
