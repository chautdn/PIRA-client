import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES } from "../utils/constants";
import { productService } from "../services/product";
import Loading from "../components/common/Loading";
import { useWallet } from "../context/WalletContext";
import {
  BiCamera,
  BiCheckCircle,
  BiShield,
  BiSupport,
  BiAward,
  BiInfoCircle,
} from "react-icons/bi";
import {
  HiLocationMarker,
  HiStar,
  HiShieldCheck,
  HiClock,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import { FiMapPin, FiSearch } from "react-icons/fi";
import {
  MdBackpack,
  MdCameraAlt,
  MdLocationOn,
  MdLuggage,
  MdAirplanemodeActive,
  MdGpsFixed,
  MdFlightTakeoff,
} from "react-icons/md";
import {
  FaCampground,
  FaShieldAlt,
  FaUsers,
  FaSearch,
  FaUserShield,
  FaQuoteLeft,
} from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();
  const { fetchBalance } = useWallet();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Scroll to top on component mount (page reload/refresh)
  useEffect(() => {
    window.scrollTo(0, 0);
    // Force refresh wallet balance when returning to home
    fetchBalance();
  }, [fetchBalance]);

  // Fetch top 10 promoted products (highest tier first)
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        // Fetch more products to ensure we get promoted ones
        const response = await productService.list({
          limit: 50,
          sort: "createdAt",
          order: "desc",
        });

        console.log("[Home] Raw response:", response);

        // Get all products from different possible response structures
        let allProducts = [];
        if (response.data?.data?.products) {
          allProducts = response.data.data.products;
        } else if (response.data?.products) {
          allProducts = response.data.products;
        } else if (response.data?.data) {
          allProducts = Array.isArray(response.data.data)
            ? response.data.data
            : [];
        } else if (Array.isArray(response.data)) {
          allProducts = response.data;
        } else if (response.products) {
          allProducts = response.products;
        }

        console.log("[Home] All products count:", allProducts.length);
        console.log("[Home] Sample product:", allProducts[0]);
        console.log(
          "[Home] Promoted products:",
          allProducts.filter((p) => p.isPromoted)
        );

        const promotedProducts = allProducts
          .filter((p) => p.isPromoted && p.promotionTier)
          .sort((a, b) => a.promotionTier - b.promotionTier); // Lower tier number = higher priority

        console.log(
          "[Home] Filtered promoted products count:",
          promotedProducts.length
        );
        console.log("[Home] Promoted products data:", promotedProducts);

        // If no promoted products, fall back to showing all products
        const productsToShow =
          promotedProducts.length > 0
            ? promotedProducts.slice(0, 10)
            : allProducts.slice(0, 10);

        setFeaturedProducts(productsToShow);
      } catch (err) {
        console.error("[Home] Error fetching featured products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Check scroll position to enable/disable navigation buttons
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const checkScrollability = () => {
      const { scrollLeft, scrollWidth, clientWidth } = carousel;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    checkScrollability();
    carousel.addEventListener("scroll", checkScrollability);
    return () => carousel.removeEventListener("scroll", checkScrollability);
  }, [featuredProducts]);

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
      <section className="relative isolate overflow-hidden min-h-[750px] flex items-center">
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0A5C36] via-[#0D7A47] to-[#10956B]" />

        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 -z-10 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(5, 150, 105, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Decorative pattern */}
        <div
          className="absolute inset-0 -z-10 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating equipment icons */}
        <motion.div
          className="absolute top-20 left-[10%] text-6xl opacity-20"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          📷
        </motion.div>
        <motion.div
          className="absolute top-32 right-[15%] text-5xl opacity-20"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          🎒
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-[15%] text-5xl opacity-20"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          ⛺
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-[12%] text-6xl opacity-20"
          animate={{
            y: [0, 18, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 6.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          🧳
        </motion.div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 pb-32 sm:pb-40 w-full z-10">
          <motion.div
            className="mx-auto text-center max-w-4xl"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-sm shadow-lg px-4 py-2 text-sm font-medium text-primary-700 mb-8"
              variants={fadeInUpStagger}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                className="inline-block h-2.5 w-2.5 rounded-full bg-primary-500 mr-2.5"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Được tin tưởng bởi 10,000+ du khách
            </motion.div>

            {/* Main heading */}
            <motion.h1
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight pb-4"
              variants={fadeInUp}
            >
              Cuộc Phiêu Lưu Đang Chờ.
              <br />
              <motion.span
                className="inline-block mt-2 pb-2"
                animate={{
                  textShadow: [
                    "0 0 20px rgba(255,255,255,0.5)",
                    "0 0 40px rgba(255,255,255,0.3)",
                    "0 0 20px rgba(255,255,255,0.5)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  background:
                    "linear-gradient(90deg, #FFFFFF, #D1FAE5, #FFFFFF)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: "1.3",
                }}
              >
                Thuê Thiết Bị Du Lịch Ngay!
              </motion.span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="mt-8 text-lg sm:text-xl text-primary-50 leading-8 max-w-3xl mx-auto"
              variants={fadeInUpStagger}
            >
              🏔️ Khám phá. 📸 Ghi lại. 🌍 Chia sẻ. <br className="sm:hidden" />
              Truy cập thiết bị du lịch cao cấp từ những người địa phương đáng
              tin cậy.
            </motion.p>

            {/* Equipment categories quick preview */}
            <motion.div
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
              variants={fadeInUpStagger}
            >
              {[
                { Icon: MdCameraAlt, label: "Camera" },
                { Icon: MdBackpack, label: "Balo" },
                { Icon: FaCampground, label: "Lều Trại" },
                { Icon: MdLuggage, label: "Vali" },
                { Icon: MdFlightTakeoff, label: "Flycam" },
                { Icon: MdGpsFixed, label: "GPS" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white text-sm font-medium shadow-lg"
                  whileHover={{
                    scale: 1.1,
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    borderColor: "rgba(255, 255, 255, 0.5)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <item.Icon className="text-xl" />
                  <span>{item.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUpStagger}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={ROUTES.PRODUCTS}
                  className="inline-flex items-center bg-white text-primary-700 hover:bg-primary-50 px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl transition-all"
                >
                  <FaSearch className="mr-2 text-xl" />
                  Tìm Thiết Bị Ngay
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center border-2 border-white/80 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg backdrop-blur-sm transition-all"
                >
                  <MdAirplanemodeActive className="mr-2 text-xl" />
                  Cho Thuê Đồ
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="mt-12 mb-8 flex flex-wrap items-center justify-center gap-8 text-sm text-white/90"
              variants={fadeInUpStagger}
            >
              <motion.div
                className="flex items-center gap-2 py-2"
                whileHover={{ scale: 1.1, color: "#ffffff" }}
                transition={{ duration: 0.2 }}
              >
                <HiStar className="text-2xl text-yellow-300" />
                <span className="font-semibold">4.9/5 đánh giá</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 py-2"
                whileHover={{ scale: 1.1, color: "#ffffff" }}
                transition={{ duration: 0.2 }}
              >
                <HiShieldCheck className="text-2xl text-green-300" />
                <span className="font-semibold">Thanh toán an toàn</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 py-2"
                whileHover={{ scale: 1.1, color: "#ffffff" }}
                transition={{ duration: 0.2 }}
              >
                <HiClock className="text-2xl text-blue-300" />
                <span className="font-semibold">Hỗ trợ 24/7</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#F9FAFB"
            />
          </svg>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Khám Phá Theo Danh Mục
            </h2>
            <p className="text-gray-600 text-lg">
              Tìm thiết bị phù hợp cho chuyến phiêu lưu của bạn
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: MdCameraAlt,
                name: "Camera",
                color: "from-blue-500 to-blue-600",
              },
              {
                icon: MdBackpack,
                name: "Balo",
                color: "from-green-500 to-green-600",
              },
              {
                icon: FaCampground,
                name: "Lều",
                color: "from-orange-500 to-orange-600",
              },
              {
                icon: MdLuggage,
                name: "Vali",
                color: "from-purple-500 to-purple-600",
              },
              {
                icon: MdFlightTakeoff,
                name: "Flycam",
                color: "from-red-500 to-red-600",
              },
              {
                icon: MdGpsFixed,
                name: "GPS",
                color: "from-teal-500 to-teal-600",
              },
            ].map((category, idx) => (
              <motion.div
                key={idx}
                className="group cursor-pointer"
                variants={fadeInUpStagger}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                onClick={() =>
                  navigate(`${ROUTES.PRODUCTS}?category=${category.name}`)
                }
              >
                <div
                  className={`relative bg-gradient-to-br ${category.color} rounded-2xl p-6 aspect-square flex flex-col items-center justify-center overflow-hidden shadow-xl hover:shadow-2xl transition-all`}
                >
                  {/* Background pattern */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />

                  {/* White circle background for icon */}
                  <motion.div
                    className="relative z-10 mb-3 bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-lg"
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <category.icon className="text-5xl text-white drop-shadow-lg" />
                  </motion.div>

                  <div className="text-white font-bold text-lg relative z-10 drop-shadow-md">
                    {category.name}
                  </div>

                  {/* Shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Grid */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <span className="text-lg">⭐</span>
              <span>
                {featuredProducts.some((p) => p.isPromoted)
                  ? "TOP PROMOTED"
                  : "SẢN PHẨM MỚI"}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Thiết Bị Nổi Bật
            </h2>
            <p className="text-gray-600 text-lg">
              {featuredProducts.some((p) => p.isPromoted)
                ? "Top 10 thiết bị được quảng bá cao nhất - Chất lượng đã được xác nhận"
                : "Khám phá các thiết bị du lịch mới nhất"}
            </p>
          </motion.div>

          {loading ? (
            <div className="mt-8 flex flex-col items-center justify-center py-12">
              <Loading />
              <p className="mt-4 text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : error ? (
            <div className="mt-8 text-center py-12">
              <div className="text-red-500 font-semibold mb-2">
                Không thể tải sản phẩm nổi bật
              </div>
              <div className="text-gray-500 text-sm mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all"
              >
                Thử lại
              </button>
            </div>
          ) : !loading && featuredProducts.length === 0 ? (
            <div className="mt-8 text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <div className="text-gray-900 font-semibold text-xl mb-2">
                Chưa có sản phẩm
              </div>
              <p className="text-gray-600 mb-6">
                Hiện tại chưa có sản phẩm nào. Hãy quay lại sau nhé!
              </p>
              <Link
                to={ROUTES.PRODUCTS}
                className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Xem Tất Cả Sản Phẩm
              </Link>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="relative">
              {/* Navigation Buttons - Always visible if there are products */}
              <button
                onClick={() => {
                  console.log("[Carousel] Left button clicked");
                  if (carouselRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } =
                      carouselRef.current;
                    console.log("[Carousel] Current scroll:", {
                      scrollLeft,
                      scrollWidth,
                      clientWidth,
                    });
                    const cardWidth = 320 + 24; // width + gap
                    carouselRef.current.scrollBy({
                      left: -cardWidth,
                      behavior: "smooth",
                    });
                  }
                }}
                disabled={!canScrollLeft}
                className={`absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl rounded-full p-3 transition-all ${
                  canScrollLeft
                    ? "opacity-100"
                    : "opacity-30 cursor-not-allowed"
                }`}
                style={{ transform: "translateY(-50%)" }}
              >
                <HiChevronLeft className="text-2xl text-gray-700" />
              </button>

              <button
                onClick={() => {
                  console.log("[Carousel] Right button clicked");
                  if (carouselRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } =
                      carouselRef.current;
                    console.log("[Carousel] Current scroll:", {
                      scrollLeft,
                      scrollWidth,
                      clientWidth,
                    });
                    const cardWidth = 320 + 24; // width + gap
                    carouselRef.current.scrollBy({
                      left: cardWidth,
                      behavior: "smooth",
                    });
                  }
                }}
                disabled={!canScrollRight}
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl rounded-full p-3 transition-all ${
                  canScrollRight
                    ? "opacity-100"
                    : "opacity-30 cursor-not-allowed"
                }`}
                style={{ transform: "translateY(-50%)" }}
              >
                <HiChevronRight className="text-2xl text-gray-700" />
              </button>

              {/* Carousel Container */}
              <div className="overflow-hidden px-12">
                <div
                  ref={carouselRef}
                  className="overflow-x-scroll scrollbar-hide"
                  style={{
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    scrollBehavior: "smooth",
                  }}
                >
                  <motion.div
                    className="flex gap-6 pb-4"
                    style={{ minWidth: "max-content" }}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                  >
                    {featuredProducts.map((product, idx) => (
                      <motion.div
                        key={product._id}
                        className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden group cursor-pointer snap-center"
                        variants={fadeInUpStagger}
                        whileHover={{
                          y: -12,
                          scale: 1.03,
                          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                        }}
                        transition={{ duration: 0.3 }}
                        onClick={() =>
                          navigate(
                            ROUTES.PRODUCT_DETAIL.replace(":id", product._id)
                          )
                        }
                      >
                        <motion.div
                          className="h-56 relative overflow-hidden bg-gray-100"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        >
                          <img
                            src={
                              product.images?.[0]?.url ||
                              "/images/placeholder.jpg"
                            }
                            alt={product.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 group-hover:from-black/30 transition-all"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                          />

                          {/* Promotion Badge with Tier */}
                          <motion.div
                            className={`absolute top-3 left-3 ${getPromotionTierColor(
                              product.promotionTier
                            )} px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm`}
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            transition={{
                              delay: idx * 0.05 + 0.2,
                              type: "spring",
                            }}
                          >
                            ⭐ {getPromotionTierName(product.promotionTier)}
                          </motion.div>

                          {/* Position indicator */}
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            #{idx + 1}
                          </div>
                        </motion.div>

                        <div className="p-5">
                          <motion.div
                            className="flex items-center gap-1 text-sm text-gray-500 mb-2"
                            whileHover={{ x: 3 }}
                            transition={{ duration: 0.2 }}
                          >
                            <HiLocationMarker className="text-primary-500 text-base" />
                            <span className="font-medium">
                              {product.location?.address?.city || "N/A"}
                            </span>
                          </motion.div>

                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-2 mb-3 h-14">
                            {product.title}
                          </h3>

                          <div className="flex items-baseline justify-between mb-2">
                            <motion.div
                              className="text-2xl font-bold text-primary-600"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              {formatPrice(product.pricing?.dailyRate)}
                              <span className="text-sm font-normal text-gray-500">
                                /ngày
                              </span>
                            </motion.div>

                            <motion.div
                              className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <HiStar className="text-yellow-500 text-base" />
                              <span className="text-sm font-semibold text-gray-900">
                                {product.metrics?.averageRating?.toFixed(1) ||
                                  "5.0"}
                              </span>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Scroll gradient overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 via-white to-transparent pointer-events-none z-20" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 via-white to-transparent pointer-events-none z-20" />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Tại Sao Chọn PIRA?
            </h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Tham gia cùng hàng nghìn du khách tin tưởng PIRA cho nhu cầu thuê
              thiết bị
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                Icon: FiSearch,
                title: "Lựa Chọn Đa Dạng",
                desc: "Từ máy ảnh, đồ cắm trại đến thiết bị chuyên dụng, tất cả đều sẵn trong khu vực của bạn.",
                color: "from-blue-500 to-blue-600",
              },
              {
                Icon: FaShieldAlt,
                title: "Giao Dịch An Toàn",
                desc: "Thanh toán bảo mật, xác minh và bảo hiểm toàn diện đảm bảo sự yên tâm.",
                color: "from-green-500 to-green-600",
              },
              {
                Icon: FaUsers,
                title: "Cộng Đồng Tin Cậy",
                desc: "Đánh giá đã xác minh, xếp hạng người dùng và cộng đồng hỗ trợ.",
                color: "from-purple-500 to-purple-600",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-200 overflow-hidden group cursor-pointer"
                variants={fadeInUpStagger}
                whileHover={{
                  y: -8,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Gradient accent on top */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`}
                />

                {/* Icon with gradient background */}
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} mb-5 shadow-lg`}
                  whileHover={{ scale: 1.15, rotate: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <item.Icon className="text-3xl text-white" />
                </motion.div>

                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">
                  {item.title}
                </h4>

                <p className="text-gray-600 leading-relaxed">{item.desc}</p>

                {/* Decorative element */}
                <motion.div
                  className={`absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br ${item.color} rounded-full opacity-5 group-hover:opacity-10 transition-opacity`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: idx * 0.3,
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <span className="text-lg">💬</span>
              <span>REVIEWS</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Được Tin Tưởng Bởi Du Khách Toàn Cầu
            </h3>
            <p className="text-gray-600 text-lg">
              Xem cộng đồng của chúng tôi nói gì về trải nghiệm PIRA
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
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
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200 group cursor-pointer overflow-hidden"
                variants={fadeInUpStagger}
                whileHover={{
                  y: -8,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Quote icon */}
                <div className="absolute top-4 right-4 opacity-20">
                  <FaQuoteLeft className="text-6xl text-primary-500" />
                </div>

                {/* Stars */}
                <motion.div
                  className="text-yellow-400 flex gap-1 mb-4"
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
                      <HiStar />
                    </motion.span>
                  ))}
                </motion.div>

                {/* Testimonial text */}
                <p className="text-gray-700 leading-relaxed mb-6 relative z-10">
                  "{testimonial.text}"
                </p>

                {/* User info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
                    <FaUserShield className="text-white text-2xl" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <MdLocationOn className="text-primary-500" />
                      {testimonial.location}
                    </div>
                  </div>
                </div>

                {/* Decorative gradient */}
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full opacity-20 blur-2xl" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-3xl px-8 sm:px-12 py-16 text-center text-white overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Animated background pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            {/* Floating background elements */}
            <motion.div
              className="absolute top-8 left-12 text-5xl opacity-20"
              animate={floating}
              transition={{ duration: 3, repeat: Infinity, delay: 0 }}
            >
              ✈️
            </motion.div>
            <motion.div
              className="absolute top-12 right-16 text-4xl opacity-20"
              animate={floating}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            >
              🎒
            </motion.div>
            <motion.div
              className="absolute bottom-10 left-16 text-4xl opacity-20"
              animate={floating}
              transition={{ duration: 3.5, repeat: Infinity, delay: 2 }}
            >
              📷
            </motion.div>
            <motion.div
              className="absolute bottom-8 right-12 text-5xl opacity-20"
              animate={floating}
              transition={{ duration: 4.5, repeat: Infinity, delay: 0.5 }}
            >
              🏔️
            </motion.div>

            {/* Content */}
            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-lg">🚀</span>
                <span>BẮT ĐẦU NGAY HÔM NAY</span>
              </motion.div>

              <h3 className="text-3xl sm:text-5xl font-extrabold mb-4">
                Sẵn Sàng Bắt Đầu Cuộc Phiêu Lưu?
              </h3>
              <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
                Tham gia PIRA ngay hôm nay và khám phá thế giới khả năng du lịch
                với hàng ngàn thiết bị chất lượng cao.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={ROUTES.PRODUCTS}
                  className="inline-flex items-center bg-white text-primary-700 hover:bg-primary-50 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all"
                >
                  <FaSearch className="mr-2 text-xl" />
                  Tìm Thiết Bị Ngay
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center border-2 border-white/80 hover:bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl font-bold text-lg transition-all"
                >
                  <MdAirplanemodeActive className="mr-2 text-xl" />
                  Cho Thuê Đồ
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="mt-12 grid grid-cols-3 gap-8 max-w-3xl mx-auto relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              {[
                { number: "10,000+", label: "Du Khách" },
                { number: "5,000+", label: "Thiết Bị" },
                { number: "4.9★", label: "Đánh Giá" },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-primary-100">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
