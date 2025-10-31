import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import CreateForm from "../../components/owner/products/CreateForm";
import icons from "../../utils/icons";
import { toast } from "react-hot-toast";

const OwnerCreateProduct = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState({
    cccdVerified: false,
    bankAccountAdded: false,
  });

  useEffect(() => {
    document.title = "Tạo Sản Phẩm Mới - PIRA";
    window.scrollTo(0, 0);
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setIsChecking(true);

      // Refresh user data to get latest verification status
      const updatedUser = await refreshUser();

      const cccdVerified = updatedUser?.cccd?.isVerified || false;
      const bankAccountAdded = !!(
        updatedUser?.bankAccount?.accountNumber &&
        updatedUser?.bankAccount?.bankCode
      );

      setVerificationStatus({
        cccdVerified,
        bankAccountAdded,
      });

      // If both requirements are not met, show error immediately
      if (!cccdVerified || !bankAccountAdded) {
        if (!cccdVerified) {
          toast.error("❌ Cần xác thực CCCD trước khi đăng sản phẩm!", {
            duration: 5000,
          });
        } else if (!bankAccountAdded) {
          toast.error(
            "❌ Cần thêm tài khoản ngân hàng trước khi đăng sản phẩm!",
            {
              duration: 5000,
            }
          );
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      toast.error("Không thể kiểm tra trạng thái xác thực. Vui lòng thử lại.");
    } finally {
      setIsChecking(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Phong cách giống homepage */}
      <section className="relative isolate overflow-hidden">
        {/* Background gradient giống homepage */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#CFE9DA] via-[#C6E2D3] to-[#B7D6C5]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_600px_at_-10%_-10%,rgba(0,108,54,0.22),transparent_60%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_600px_at_110%_110%,rgba(0,108,54,0.22),transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            className="mx-auto text-center max-w-4xl"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Breadcrumb */}
            <motion.nav
              className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-6"
              variants={fadeInUp}
            >
              <a
                href="/owner/dashboard"
                className="hover:text-primary-600 transition-colors flex items-center"
              >
                <icons.BiMap className="w-4 h-4 mr-1" />
                Bảng điều khiển
              </a>
              <icons.BsChevronRight className="w-3 h-3" />
              <a
                href="/owner/products"
                className="hover:text-primary-600 transition-colors flex items-center"
              >
                <icons.BiCategory className="w-4 h-4 mr-1" />
                Sản phẩm
              </a>
              <icons.BsChevronRight className="w-3 h-3" />
              <span className="text-primary-600 font-medium flex items-center">
                <icons.AiOutlinePlusCircle className="w-4 h-4 mr-1" />
                Tạo sản phẩm
              </span>
            </motion.nav>

            {/* Badge */}
            <motion.div
              className="inline-flex items-center rounded-full bg-white shadow px-4 py-2 text-sm text-gray-600 mb-6"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="inline-block h-2 w-2 rounded-full bg-primary-500 mr-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Được tin tưởng bởi 10,000+ chủ sản phẩm
            </motion.div>

            {/* Main Title */}
            <motion.h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-6"
              variants={fadeInUp}
            >
              Đăng Sản Phẩm.
              <br />
              <motion.span
                className="text-primary-700"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  background:
                    "linear-gradient(90deg, #006C36, #008B52, #006C36)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Kiếm Tiền Ngay Hôm Nay!
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-xl text-gray-600 leading-7 mb-8"
              variants={fadeInUp}
            >
              Biến tài sản của bạn thành nguồn thu nhập thụ động với hệ thống AI
              thông minh
            </motion.p>

            {/* Features */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
              variants={fadeInUp}
            >
              <motion.div
                className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center mr-3">
                  <icons.FiCheck className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Xác thực AI tự động
                </span>
              </motion.div>

              <motion.div
                className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                  <icons.HiSparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Đăng trong 5 phút
                </span>
              </motion.div>

              <motion.div
                className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                  <icons.HiCash className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Thu nhập ổn định
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isChecking ? (
            // Loading state
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Đang kiểm tra trạng thái xác thực...
                </p>
              </div>
            </div>
          ) : !verificationStatus.cccdVerified ||
            !verificationStatus.bankAccountAdded ? (
            // Verification Required Screen
            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-red-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 text-white text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <h2 className="text-2xl font-bold mb-2">Yêu Cầu Xác Thực</h2>
                  <p className="text-red-100">
                    Hoàn thành các bước xác thực để đăng sản phẩm
                  </p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                  {/* CCCD Verification */}
                  <div
                    className={`flex items-start gap-4 p-6 rounded-xl border-2 transition-all ${
                      verificationStatus.cccdVerified
                        ? "bg-green-50 border-green-300"
                        : "bg-red-50 border-red-300"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        verificationStatus.cccdVerified
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {verificationStatus.cccdVerified ? (
                        <icons.FiCheck className="w-6 h-6 text-white" />
                      ) : (
                        <icons.BiInfoCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        Xác Thực CCCD
                        {verificationStatus.cccdVerified && (
                          <span className="text-sm bg-green-500 text-white px-3 py-1 rounded-full">
                            Đã xác thực
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {verificationStatus.cccdVerified
                          ? "Căn cước công dân của bạn đã được xác thực thành công."
                          : "Xác thực danh tính để đảm bảo an toàn cho cộng đồng và tăng độ tin cậy của bạn."}
                      </p>
                      {!verificationStatus.cccdVerified && (
                        <button
                          onClick={() => navigate("/profile")}
                          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                        >
                          <icons.FiCheck className="w-5 h-5" />
                          Xác Thực Ngay
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bank Account */}
                  <div
                    className={`flex items-start gap-4 p-6 rounded-xl border-2 transition-all ${
                      verificationStatus.bankAccountAdded
                        ? "bg-green-50 border-green-300"
                        : "bg-red-50 border-red-300"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        verificationStatus.bankAccountAdded
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {verificationStatus.bankAccountAdded ? (
                        <icons.FiCheck className="w-6 h-6 text-white" />
                      ) : (
                        <icons.BiInfoCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        Tài Khoản Ngân Hàng
                        {verificationStatus.bankAccountAdded && (
                          <span className="text-sm bg-green-500 text-white px-3 py-1 rounded-full">
                            Đã thêm
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {verificationStatus.bankAccountAdded
                          ? "Tài khoản ngân hàng của bạn đã được liên kết thành công."
                          : "Thêm tài khoản ngân hàng để nhận thanh toán từ việc cho thuê sản phẩm."}
                      </p>
                      {!verificationStatus.bankAccountAdded && (
                        <button
                          onClick={() => navigate("/wallet")}
                          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                        >
                          <icons.HiCash className="w-5 h-5" />
                          Thêm Tài Khoản
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <icons.HiLightBulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-blue-900 mb-2">
                          Tại sao cần xác thực?
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-2">
                          <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>
                              Bảo vệ cộng đồng khỏi gian lận và lừa đảo
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>Tăng độ tin cậy và uy tín của bạn</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>
                              Đảm bảo thanh toán nhanh chóng và an toàn
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>Tuân thủ quy định pháp luật Việt Nam</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate("/owner/products")}
                      className="flex items-center gap-2 px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                    >
                      <icons.GrLinkPrevious className="w-4 h-4" />
                      Quay Lại
                    </button>
                    <button
                      onClick={checkVerificationStatus}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      <icons.BiRefresh className="w-5 h-5" />
                      Kiểm Tra Lại
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // Show Create Form if all requirements are met
            <CreateForm />
          )}
        </div>
      </section>

      {/* Help Section - Phong cách giống homepage */}
      <section className="py-12 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center mb-4">
              <icons.BiSupport className="w-8 h-8 text-primary-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">Cần Hỗ Trợ?</h2>
            </div>
            <p className="text-lg text-gray-600">
              Hướng dẫn chi tiết để tạo sản phẩm thành công
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              variants={fadeInUp}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <icons.BiCheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Xác Thực AI
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Hệ thống AI của chúng tôi tự động kiểm tra hình ảnh để đảm bảo
                nội dung phù hợp và khớp với danh mục đã chọn.
              </p>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              variants={fadeInUp}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                <icons.HiCash className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Mẹo Định Giá
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Tìm hiểu giá của các sản phẩm tương tự trong khu vực. Đặt giá
                thuê hàng ngày cạnh tranh và tiền đặt cọc hợp lý.
              </p>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              variants={fadeInUp}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <icons.HiPhotograph className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Hướng Dẫn Chụp Ảnh
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Sử dụng ảnh chất lượng cao, ánh sáng tốt. Chụp nhiều góc độ và
                bao gồm cận cảnh các chi tiết quan trọng.
              </p>
            </motion.div>
          </motion.div>

          {/* Tips */}
          <motion.div
            className="mt-12 bg-white rounded-2xl p-8 shadow-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center mb-6">
              <icons.HiLightBulb className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">
                Mẹo Thành Công
              </h3>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-full">
                <icons.HiLightBulb className="w-4 h-4 mr-2" />
                Mô tả chi tiết giúp tăng lượt thuê
              </div>
              <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-full">
                <icons.HiSparkles className="w-4 h-4 mr-2" />
                Phản hồi nhanh tăng độ tin cậy
              </div>
              <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-full">
                <icons.BiCategory className="w-4 h-4 mr-2" />
                Danh mục chính xác giúp tìm kiếm dễ hơn
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="bg-primary-700 rounded-2xl px-6 sm:px-10 py-10 text-center text-white relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold flex items-center justify-center mb-4">
                <icons.HiSparkles className="w-6 h-6 mr-3" />
                Bắt Đầu Kiếm Tiền Ngay Hôm Nay!
              </h3>
              <p className="text-primary-100">
                Hơn 10,000 chủ sản phẩm đã tin tưởng PIRA
              </p>
            </motion.div>

            <motion.div
              className="mt-6 flex items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <motion.button
                className="inline-flex items-center bg-white text-primary-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <icons.MdPhone className="w-4 h-4 mr-2" />
                Hỗ Trợ Trực Tiếp
              </motion.button>
              <motion.button
                className="inline-flex items-center bg-yellow-400 text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-yellow-300 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <icons.HiPhotograph className="w-4 h-4 mr-2" />
                Xem Video Hướng Dẫn
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default OwnerCreateProduct;
