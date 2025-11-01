import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES } from "../utils/constants";
import { 
  BiHome, 
  BiSearchAlt,
  BiArrowBack 
} from "react-icons/bi";
import { 
  MdExplore,
  MdTravelExplore 
} from "react-icons/md";
import { 
  FaCompass,
  FaMapMarkedAlt 
} from "react-icons/fa";

export default function NotFound() {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, 0, -5, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const numberVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  const iconFloat = (delay = 0) => ({
    animate: {
      y: [0, -15, 0],
      x: [0, 5, 0],
      rotate: [0, 10, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex items-center justify-center px-4 py-12 overflow-hidden relative">
      {/* Animated Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23008B52' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Floating Icons */}
      <motion.div
        className="absolute top-20 left-[8%] text-primary-300 opacity-40"
        variants={iconFloat(0)}
        animate="animate"
      >
        <FaCompass className="text-6xl" />
      </motion.div>
      <motion.div
        className="absolute top-32 right-[10%] text-primary-400 opacity-40"
        variants={iconFloat(1)}
        animate="animate"
      >
        <MdTravelExplore className="text-7xl" />
      </motion.div>
      <motion.div
        className="absolute bottom-24 left-[12%] text-primary-300 opacity-40"
        variants={iconFloat(2)}
        animate="animate"
      >
        <FaMapMarkedAlt className="text-5xl" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 right-[15%] text-primary-400 opacity-40"
        variants={iconFloat(0.5)}
        animate="animate"
      >
        <MdExplore className="text-6xl" />
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto text-center"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* 404 Number with Icons */}
        <motion.div 
          className="flex items-center justify-center gap-4 sm:gap-8 mb-8"
          variants={itemVariants}
        >
          <motion.div
            className="text-7xl sm:text-9xl font-extrabold text-primary-600"
            variants={numberVariants}
            style={{
              textShadow: "0 4px 20px rgba(0, 139, 82, 0.2)",
            }}
          >
            4
          </motion.div>
          
          <motion.div
            className="relative"
            variants={floatingVariants}
            animate="animate"
          >
            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-2xl">
              <span className="text-4xl sm:text-6xl">🧭</span>
            </div>
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary-400"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </motion.div>
          
          <motion.div
            className="text-7xl sm:text-9xl font-extrabold text-primary-600"
            variants={numberVariants}
            style={{
              textShadow: "0 4px 20px rgba(0, 139, 82, 0.2)",
            }}
          >
            4
          </motion.div>
        </motion.div>

        {/* Title and Description */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
            Ối! Bạn Đi Lạc Rồi
          </h1>
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className="text-lg sm:text-xl text-gray-600 mb-3 max-w-2xl mx-auto leading-relaxed">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đi nơi khác.
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-8"
        >
          <span className="text-lg">🗺️</span>
          <span>Đừng lo! Chúng tôi sẽ giúp bạn tìm đường.</span>
        </motion.div>

        {/* Quick Links Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10"
          variants={itemVariants}
        >
          {[
            {
              icon: BiHome,
              title: "Trang Chủ",
              desc: "Quay về trang chủ PIRA",
              path: ROUTES.HOME,
              gradient: "from-blue-500 to-blue-600",
            },
            {
              icon: BiSearchAlt,
              title: "Tìm Thiết Bị",
              desc: "Khám phá thiết bị du lịch",
              path: ROUTES.PRODUCTS,
              gradient: "from-green-500 to-green-600",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ 
                y: -8, 
                boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.2)" 
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to={item.path}
                className="block bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <item.icon className="text-3xl text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.desc}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          variants={itemVariants}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl transition-all"
            >
              <BiArrowBack className="text-xl" />
              Quay Lại Trang Trước
            </button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-2 border-2 border-primary-600 text-primary-700 hover:bg-primary-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              <BiHome className="text-xl" />
              Về Trang Chủ
            </Link>
          </motion.div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          className="mt-12 flex items-center justify-center gap-3 text-4xl"
          variants={itemVariants}
        >
          {["🏔️", "🎒", "📷", "⛺", "🧳"].map((emoji, idx) => (
            <motion.span
              key={idx}
              className="inline-block opacity-60"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: idx * 0.2,
                ease: "easeInOut",
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>

        {/* Help Text */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 text-sm text-gray-500"
        >
          <p>
            Cần hỗ trợ? Liên hệ với chúng tôi qua{" "}
            <a 
              href="mailto:support@pira.com" 
              className="text-primary-600 hover:text-primary-700 font-semibold underline"
            >
              support@pira.com
            </a>
          </p>
        </motion.div>
      </motion.div>

      {/* Gradient Overlay Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary-50 to-transparent pointer-events-none" />
    </div>
  );
}
