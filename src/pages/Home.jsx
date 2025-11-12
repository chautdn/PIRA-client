import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES } from "../utils/constants";
import { productService } from "../services/product";
import Loading from "../components/common/Loading";
import { useAuth } from "../hooks/useAuth";
import ReportModal from "../components/ReportModal";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Scroll to top on component mount (page reload/refresh)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch featured products
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getFeatured(6);
        setFeaturedProducts(response.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Helper functions
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getPromotionTierName = (tier) => {
    const tierNames = {
      1: "Premium",
      2: "Gold",
      3: "Silver",
      4: "Bronze",
      5: "Basic",
    };
    return tierNames[tier] || "Featured";
  };

  const getPromotionTierColor = (tier) => {
    const colors = {
      1: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white",
      2: "bg-gradient-to-r from-yellow-500 to-yellow-700 text-white",
      3: "bg-gradient-to-r from-gray-400 to-gray-600 text-white",
      4: "bg-gradient-to-r from-orange-500 to-orange-700 text-white",
      5: "bg-gradient-to-r from-blue-500 to-blue-700 text-white",
    };
    return colors[tier] || "bg-primary-500 text-white";
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

  // Report handlers
  const handleReportProduct = (product) => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }
    setSelectedProduct(product);
    setShowReportModal(true);
  };

  const handleReportSuccess = () => {
    console.log('Report submitted successfully');
    setShowReportModal(false);
    setSelectedProduct(null);
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const fadeInUpStagger = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  };

  const floating = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const scaleOnHover = {
    whileHover: { scale: 1.05 },
    transition: { duration: 0.2 },
  };

  const rotateOnHover = {
    whileHover: { rotate: 5 },
    transition: { duration: 0.2 },
  };

  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        {/* 1) Nền xanh cơ sở (đậm vừa) */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#CFE9DA] via-[#C6E2D3] to-[#B7D6C5]" />

        {/* 2) Vignette xanh ở 2 góc để tạo phần "đậm" */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_600px_at_-10%_-10%,rgba(0,108,54,0.22),transparent_60%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_600px_at_110%_110%,rgba(0,108,54,0.22),transparent_60%)]" />

        {/* 3) Dải trắng mảnh ở góc trên-trái + dải xanh đậm kề sau */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,transparent_18%,rgba(255,255,255,0.70)_22%,transparent_26%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,transparent_26%,rgba(0,108,54,0.10)_30%,transparent_34%)]" />

        {/* 4) Dải trắng rộng ở giữa + dải xanh đậm kề sau */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,transparent_43%,rgba(255,255,255,0.92)_50%,transparent_57%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,transparent_57%,rgba(0,108,54,0.12)_61%,transparent_67%)]" />

        {/* 5) Dải trắng mảnh ở góc dưới-phải + dải xanh đậm kề sau */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,transparent_74%,rgba(255,255,255,0.65)_78%,transparent_82%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,transparent_82%,rgba(0,108,54,0.10)_86%,transparent_90%)]" />

        {/* Nội dung hero với animation */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            className="mx-auto text-center max-w-3xl"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div
              className="inline-flex items-center rounded-full bg-white shadow px-3 py-1 text-xs text-gray-600 mb-6"
              variants={fadeInUpStagger}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                className="inline-block h-2 w-2 rounded-full bg-primary-500 mr-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Được tin tưởng bởi 10,000+ du khách
            </motion.div>

            <motion.h1
              className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900"
              variants={fadeInUp}
            >
              Cuộc Phiêu Lưu Đang Chờ.
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
                Thuê Thiết Bị Ngay Hôm Nay!
              </motion.span>
            </motion.h1>

            <motion.p
              className="mt-6 text-gray-600 leading-7"
              variants={fadeInUpStagger}
            >
              Khám phá. Ghi lại. Chia sẻ. Truy cập thiết bị du lịch cao cấp từ
              những người địa phương đáng tin cậy.
            </motion.p>

            <motion.div
              className="mt-8 flex items-center justify-center gap-3"
              variants={fadeInUpStagger}
            >
              <motion.div {...scaleOnHover}>
                <Link
                  to={ROUTES.PRODUCTS}
                  className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-md transition-colors"
                >
                  <motion.span
                    className="mr-2"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔎
                  </motion.span>
                  Tìm Thiết Bị
                </Link>
              </motion.div>
              <motion.div {...scaleOnHover}>
                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center border border-gray-300 hover:bg-gray-100 text-gray-800 px-5 py-2.5 rounded-md transition-colors"
                >
                  Cho Thuê Đồ
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600"
              variants={fadeInUpStagger}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                ⭐ 4.9/5 đánh giá
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                🔒 Thanh toán an toàn
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                🕑 Hỗ trợ 24/7
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Grid */}
      <section className="py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900">
              Thiết Bị Nổi Bật
            </h2>
            <p className="text-center text-gray-600 mt-2">
              Khám phá những món đồ được yêu thích nhất từ cộng đồng PIRA
            </p>
          </motion.div>

          {loading ? (
            <div className="mt-8 flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : error ? (
            <div className="mt-8 text-center py-12">
              <div className="text-gray-500">
                Không thể tải sản phẩm nổi bật
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <motion.div
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {featuredProducts.map((product, idx) => (
                <motion.div
                  key={product._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer"
                  variants={fadeInUpStagger}
                  whileHover={{
                    y: -8,
                    boxShadow:
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() =>
                    navigate(ROUTES.PRODUCT_DETAIL.replace(":id", product._id))
                  }
                >
                  <motion.div
                    className="h-40 relative overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={
                        product.images?.[0]?.url || "/images/placeholder.jpg"
                      }
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <motion.div
                      className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    />
                    <motion.div
                      className={`absolute top-2 right-2 ${getPromotionTierColor(
                        product.featuredTier
                      )} px-2 py-1 rounded-full text-xs font-medium`}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: idx * 0.1 + 0.5 }}
                    >
                      {getPromotionTierName(product.featuredTier)}
                    </motion.div>
                  </motion.div>
                  <div className="p-4">
                    <motion.div
                      className="text-sm text-gray-500"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      📍 {product.location?.address?.city || "N/A"}
                    </motion.div>
                    <h3 className="mt-1 font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {product.title}
                    </h3>
                    <motion.div
                      className="mt-2 text-primary-700 font-semibold"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {formatPrice(product.pricing?.dailyRate)}/ngày
                    </motion.div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        ⭐ {product.metrics?.averageRating?.toFixed(1) || "5.0"}
                      </motion.div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ x: 5 }}
                          transition={{ duration: 0.2 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            to={`${ROUTES.PRODUCT_DETAIL.replace(
                              ":id",
                              product._id
                            )}`}
                            className="inline-flex items-center text-gray-700 hover:text-primary-700"
                          >
                            <motion.span
                              className="mr-1"
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: idx * 0.3,
                              }}
                            >
                              👁️
                            </motion.span>
                            Xem Chi Tiết
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="rounded-2xl border border-primary-200 bg-primary-50 p-6 sm:p-10"
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
              <h3 className="text-center text-2xl font-bold text-gray-900">
                Tại Sao Chọn PIRA?
              </h3>
              <p className="text-center text-gray-700 mt-2">
                Tham gia cùng hàng nghìn du khách tin tưởng PIRA cho nhu cầu
                thuê thiết bị
              </p>
            </motion.div>

            <motion.div
              className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: "🔎",
                  title: "Lựa Chọn Đa Dạng",
                  desc: "Từ máy ảnh, đồ cắm trại đến thiết bị chuyên dụng, tất cả đều sẵn trong khu vực của bạn.",
                },
                {
                  icon: "🛡️",
                  title: "Giao Dịch An Toàn",
                  desc: "Thanh toán bảo mật, xác minh và bảo hiểm toàn diện đảm bảo sự yên tâm.",
                },
                {
                  icon: "👥",
                  title: "Cộng Đồng Tin Cậy",
                  desc: "Đánh giá đã xác minh, xếp hạng người dùng và cộng đồng hỗ trợ.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="bg-white rounded-xl p-6 shadow-sm group cursor-pointer"
                  variants={fadeInUpStagger}
                  whileHover={{
                    y: -5,
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="text-2xl"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.icon}
                  </motion.div>
                  <motion.h4
                    className="mt-3 font-semibold group-hover:text-primary-700 transition-colors"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.title}
                  </motion.h4>
                  <motion.p
                    className="mt-2 text-gray-600 text-sm"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.desc}
                  </motion.p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-center text-2xl font-bold text-gray-900">
              Được Tin Tưởng Bởi Du Khách Toàn Cầu
            </h3>
            <p className="text-center text-gray-600 mt-2">
              Xem cộng đồng của chúng tôi nói gì về trải nghiệm PIRA
            </p>
          </motion.div>

          <motion.div
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                name: "Mai Hoàng",
                location: "Hồ Chí Minh",
                text: "PIRA đã làm cho chuyến du lịch của tôi trở nên tuyệt vời! Thuê dễ, chủ sở hữu hỗ trợ.",
              },
              {
                name: "Nguyễn Văn A",
                location: "Hà Nội",
                text: "Dịch vụ tuyệt vời, thiết bị chất lượng cao. Sẽ quay lại sử dụng PIRA.",
              },
              {
                name: "Trần Thị B",
                location: "Đà Nẵng",
                text: "Giao diện dễ sử dụng, thanh toán an toàn. Rất hài lòng với trải nghiệm.",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 group cursor-pointer"
                variants={fadeInUpStagger}
                whileHover={{
                  y: -5,
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-yellow-500 flex"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.2 + 0.5 }}
                >
                  {[...Array(5)].map((_, starIdx) => (
                    <motion.span
                      key={starIdx}
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: i * 0.2 + starIdx * 0.1 + 0.5,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      ★
                    </motion.span>
                  ))}
                </motion.div>
                <motion.p
                  className="mt-3 text-gray-700 text-sm group-hover:text-gray-900 transition-colors"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  "{testimonial.text}"
                </motion.p>
                <motion.div
                  className="mt-4 text-sm text-gray-600"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  • {testimonial.name} — {testimonial.location}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="bg-primary-700 rounded-2xl px-6 sm:px-10 py-10 text-center text-white relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Floating background elements */}
            <motion.div
              className="absolute top-4 left-4 text-4xl opacity-20"
              animate={floating}
              transition={{ duration: 3, repeat: Infinity, delay: 0 }}
            >
              ✈️
            </motion.div>
            <motion.div
              className="absolute top-8 right-8 text-3xl opacity-20"
              animate={floating}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            >
              🎒
            </motion.div>
            <motion.div
              className="absolute bottom-6 left-8 text-3xl opacity-20"
              animate={floating}
              transition={{ duration: 3.5, repeat: Infinity, delay: 2 }}
            >
              📷
            </motion.div>
            <motion.div
              className="absolute bottom-4 right-6 text-4xl opacity-20"
              animate={floating}
              transition={{ duration: 4.5, repeat: Infinity, delay: 0.5 }}
            >
              🏔️
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold">
                Sẵn Sàng Bắt Đầu Cuộc Phiêu Lưu?
              </h3>
              <p className="mt-2 text-primary-100">
                Tham gia PIRA ngay hôm nay và khám phá thế giới khả năng du
                lịch.
              </p>
            </motion.div>

            <motion.div
              className="mt-6 flex items-center justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <motion.div {...scaleOnHover}>
                <Link
                  to={ROUTES.HOME}
                  className="inline-flex items-center bg-white text-primary-700 hover:bg-primary-50 px-5 py-2.5 rounded-md transition-colors"
                >
                  <motion.span
                    className="mr-2"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔎
                  </motion.span>
                  Tìm Thiết Bị
                </Link>
              </motion.div>
              <motion.div {...scaleOnHover}>
                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center border border-white hover:bg-white/10 px-5 py-2.5 rounded-md transition-colors"
                >
                  Cho Thuê Đồ
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onReportSuccess={handleReportSuccess}
      />
    </div>
  );
}
