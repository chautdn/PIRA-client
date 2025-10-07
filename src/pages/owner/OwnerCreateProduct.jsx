import React from 'react';
import { motion } from 'framer-motion';
import CreateForm from '../../components/owner/products/CreateForm';
import icons from '../../utils/icons';

const OwnerCreateProduct = () => {
  React.useEffect(() => {
    document.title = 'Tạo Sản Phẩm Mới - PIRA';
    window.scrollTo(0, 0);
  }, []);

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
              <a href="/owner/dashboard" className="hover:text-primary-600 transition-colors flex items-center">
                <icons.BiMap className="w-4 h-4 mr-1" />
                Bảng điều khiển
              </a>
              <icons.BsChevronRight className="w-3 h-3" />
              <a href="/owner/products" className="hover:text-primary-600 transition-colors flex items-center">
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
                  background: "linear-gradient(90deg, #006C36, #008B52, #006C36)",
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
              Biến tài sản của bạn thành nguồn thu nhập thụ động với hệ thống AI thông minh
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
                <span className="text-sm font-medium text-gray-700">Xác thực AI tự động</span>
              </motion.div>
              
              <motion.div
                className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                  <icons.HiSparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Đăng trong 5 phút</span>
              </motion.div>
              
              <motion.div
                className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                  <icons.HiCash className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Thu nhập ổn định</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <CreateForm />
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Xác Thực AI</h3>
              <p className="text-gray-600 leading-relaxed">
                Hệ thống AI của chúng tôi tự động kiểm tra hình ảnh để đảm bảo nội dung phù hợp và khớp với danh mục đã chọn.
              </p>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              variants={fadeInUp}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                <icons.HiCash className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mẹo Định Giá</h3>
              <p className="text-gray-600 leading-relaxed">
                Tìm hiểu giá của các sản phẩm tương tự trong khu vực. Đặt giá thuê hàng ngày cạnh tranh và tiền đặt cọc hợp lý.
              </p>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              variants={fadeInUp}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <icons.HiPhotograph className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Hướng Dẫn Chụp Ảnh</h3>
              <p className="text-gray-600 leading-relaxed">
                Sử dụng ảnh chất lượng cao, ánh sáng tốt. Chụp nhiều góc độ và bao gồm cận cảnh các chi tiết quan trọng.
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
              <h3 className="text-xl font-bold text-gray-900">Mẹo Thành Công</h3>
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