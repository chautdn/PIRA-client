import { AiOutlinePlusCircle } from "react-icons/ai";

import {
  BiCategory,
  BiText,
  BiMoney,
  BiMap,
  BiCamera,
  BiCheckCircle,
  BiInfoCircle,
  BiAward,
  BiShield,
  BiSupport,
  BiRefresh,
  BiCrown,
  BiCalendar,
  BiCalculator,
  BiErrorCircle,
  BiCreditCard,
  BiImage,
  BiMapPin,
  BiLoaderAlt,
  BiClipboard,
  BiTrendingUp,
} from "react-icons/bi";

import {
  BsBuildings,
  BsChevronRight,
  BsBookmarkStarFill,
  BsCurrencyDollar,
  BsShieldCheck,
  BsCart4,
} from "react-icons/bs";

import {
  FaRegMoneyBillAlt,
  FaSearchLocation,
  FaChartArea,
  FaHourglassHalf,
  FaQuestion,
  FaBell,
  FaClipboardList,
  FaTicketAlt,
  FaUserFriends,
  FaStar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaLock,
  FaMapMarkerAlt,
  FaLightbulb,
  FaRedo,
  FaExclamationTriangle,
  FaBalanceScale,
  FaMale,
  FaFemale,
  FaRegBell,
  FaBolt,
  FaBox,
} from "react-icons/fa";

import { FaSearchengin, FaDeleteLeft } from "react-icons/fa6";

import {
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiUpload,
  FiImage,
  FiMapPin,
  FiStar,
  FiCheck,
  FiInfo,
  FiAward,
  FiShield,
  FiArrowRight,
  FiArrowLeft,
  FiMail,
  FiClock,
  FiPlus,
  FiZap,
  FiUser,
  FiGift,
  FiPackage,
  FiAlertTriangle,
  FiDollarSign,
  FiSettings,
  FiTruck,
  FiLogOut,
  FiBell,
  FiFilter,
  FiCalendar,
  FiEye,
  FiLock,
  FiUnlock,
  FiX,
  FiPause,
  FiCreditCard,
  FiRefreshCcw,
  FiFile,
  FiHome,
  FiCamera,
  FiZoomIn,
  FiPhone,
  FiDatabase,
  FiGlobe,
  FiSun,
  FiMoon,
  FiMonitor,
  FiKey,
  FiSave,
  FiClipboard,
} from "react-icons/fi";

import { GiTakeMyMoney } from "react-icons/gi";

import { GrNext, GrChapterNext, GrLinkPrevious } from "react-icons/gr";

import {
  HiOutlineLocationMarker,
  HiOutlineHome,
  HiOutlinePhotograph,
  HiSparkles,
  HiLightBulb,
  HiPhotograph,
  HiCash,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiCreditCard,
} from "react-icons/hi";

import { IoIosHeart, IoIosHeartEmpty, IoMdClose } from "react-icons/io";
import {
  IoChatboxEllipsesOutline,
  IoBarChart,
  IoCalendarSharp,
} from "react-icons/io5";

import { LuBoxes, LuPackagePlus, LuPackageSearch } from "react-icons/lu";

import {
  MdOutlineAddLocationAlt,
  MdOutlineStarPurple500,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
  MdMessage,
  MdPhone,
  MdOutlineHouseSiding,
  MdLocationCity,
  MdOutlinePercent,
  MdOutlineRefresh,
  MdLocalShipping,
} from "react-icons/md";

import { RiCrop2Line } from "react-icons/ri";

import { TbReportMoney, TbWorld } from "react-icons/tb";

// ===================================================================
// Unified & Cleaned Icons Object
// ===================================================================

const icons = {
  // Common actions
  AiOutlinePlusCircle,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiUpload,
  FiRefreshCcw,
  FiSave,
  FiCheck,
  FiX,
  IoMdClose,
  FaDeleteLeft,
  FiClipboard,
  FaBolt,

  // Navigation & Arrows
  GrNext,
  GrChapterNext,
  GrLinkPrevious,
  BsChevronRight,
  FiArrowRight,
  FiArrowLeft,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,

  // Search & Location
  FiSearch,
  FaSearchengin,
  FaSearchLocation,
  HiOutlineLocationMarker,
  FiMapPin,
  BiMapPin,
  MdOutlineAddLocationAlt,
  FaMapMarkerAlt,

  // Home & Property
  HiOutlineHome,
  FiHome,
  MdOutlineHouseSiding,
  MdLocationCity,
  BsBuildings,
  FaBox,

  // Money & Finance
  FaRegMoneyBillAlt,
  TbReportMoney,
  GiTakeMyMoney,
  BsCurrencyDollar,
  HiCash,
  FiDollarSign,
  BiMoney,
  MdOutlinePercent,

  // Media & Images
  FiImage,
  BiImage,
  FiCamera,
  BiCamera,
  HiOutlinePhotograph,
  HiPhotograph,
  FiZoomIn,
  BiMap,

  // Ratings & Awards
  FiStar,
  MdOutlineStarPurple500,
  BsBookmarkStarFill,
  IoIosHeart,
  IoIosHeartEmpty,
  FiAward,
  BiAward,
  BiCrown,
  FaStar,

  // Status & Indicators
  FiInfo,
  BiInfoCircle,
  HiInformationCircle,
  FiShield,
  BiShield,
  BsShieldCheck,
  HiCheckCircle,
  BiCheckCircle,
  FaCheckCircle,
  FaTimesCircle,
  HiExclamationCircle,
  FaExclamationTriangle,
  BiErrorCircle,
  FiAlertTriangle,
  BiLoaderAlt,

  // User & Profile
  FiUser,
  FiMail,
  FiPhone,
  MdPhone,
  MdMessage,
  FiLock,
  FiUnlock,
  FiKey,
  FaLock,
  FaMale,
  FaFemale,
  FaUserFriends,

  // Notifications & Time
  FiBell,
  FaRegBell,
  FaBell,
  FiClock,
  FaClock,
  FaHourglassHalf,
  BiCalendar,
  FiCalendar,

  // Categories & Packages
  BiCategory,
  BiText,
  LuBoxes,
  FiPackage,
  LuPackagePlus,
  LuPackageSearch,
  FiGift,
  FaTicketAlt,

  // Support & Misc
  BiSupport,
  FiSettings,
  FiLogOut,
  FaQuestion,
  FaLightbulb,
  HiLightBulb,
  HiSparkles,
  FiZap,
  FaRedo,
  MdOutlineRefresh,
  BiRefresh,

  // Charts & Data
  FaChartArea,
  IoBarChart,
  FiDatabase,
  FiFile,
  BiClipboard,
  FaClipboardList,
  FiFilter,
  FiEye,

  // Payment & Credit
  FiCreditCard,
  BiCreditCard,
  HiCreditCard,
  BsCart4,

  // Extra
  FiTruck,
  TbWorld,
  FiGlobe,
  FiSun,
  FiMoon,
  FiMonitor,
  RiCrop2Line,
  IoChatboxEllipsesOutline,
  LuPackageSearch,
  FaBalanceScale,
  BiCalculator,
  BiTrendingUp,

  // Alias phổ biến
  IoCalendarSharp,
  MdLocalShipping,
};

// Aliases for missing icons - using available alternatives
icons.BiRocket = FaBolt;
icons.BiStar = FiStar;
icons.BiShow = FiEye;
icons.BiBot = HiSparkles;
icons.BiX = FiX;
icons.BiUser = FiUser;
icons.BiPhone = FiPhone;
icons.BiEnvelope = FiMail;
icons.BiBookmark = BsBookmarkStarFill;
icons.BiShieldCheck = BsShieldCheck;
icons.BiError = BiErrorCircle;
icons.BiPackage = FiPackage;

export default icons;
