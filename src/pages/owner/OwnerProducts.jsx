import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ownerProductApi } from "../../services/ownerProduct.Api";
import ProductCard from "../../components/common/ProductCard";
import ConfirmModal from "../../components/owner/ConfirmModal";
import PromoteProductModal from "../../components/owner/PromoteProductModal";
import { FiPlus, FiEdit, FiEyeOff, FiEye, FiTrash2, FiTrendingUp } from "react-icons/fi";

// Product Action Buttons Component
const ProductActionButtons = ({
  product,
  onEdit,
  onHide,
  onUnhide,
  onDelete,
  onPromote,
}) => {
  const [showActions, setShowActions] = useState(false);
  const isHidden = product.status === "OWNER_HIDDEN";

  return (
    <div className="relative">
      <button
        onClick={() => setShowActions(!showActions)}
        className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition-all z-10"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {showActions && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowActions(false)}
          ></div>
          <div className="absolute top-12 left-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px] z-20">
            <button
              onClick={() => {
                onEdit(product._id);
                setShowActions(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
            >
              <FiEdit className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </button>

            <button
              onClick={() => {
                onPromote(product);
                setShowActions(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-blue-700"
            >
              <FiTrendingUp className="w-4 h-4" />
              <span>{product.isPromoted ? "Quảng cáo lại" : "Quảng cáo"}</span>
            </button>

            <div className="border-t border-gray-200 my-1"></div>

            {isHidden ? (
              <button
                onClick={() => {
                  onUnhide(product._id);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-green-700"
              >
                <FiEye className="w-4 h-4" />
                <span>Hiện lại</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onHide(product._id);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-orange-700"
              >
                <FiEyeOff className="w-4 h-4" />
                <span>Ẩn sản phẩm</span>
              </button>
            )}

            <div className="border-t border-gray-200 my-1"></div>

            <button
              onClick={() => {
                onDelete(product._id);
                setShowActions(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-700"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>Xóa sản phẩm</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default function OwnerProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: "",
    sort: "createdAt",
    order: "desc",
  });

  // Modal states
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'hide', 'unhide', 'delete', 'error'
    productId: null,
    loading: false,
    errorMessage: null,
  });

  // Promotion modal state
  const [promoteModalState, setPromoteModalState] = useState({
    isOpen: false,
    product: null,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await ownerProductApi.getOwnerProducts(filters);

      if (res.success) {
        setProducts(res.data?.products || []);
        setPagination(res.data?.pagination || {});
      } else {
        setProducts([]);
        setPagination({});
      }
    } catch (e) {
      console.error("Error loading owner products:", e);
      setError("Không tải được danh sách sản phẩm");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (productId) => {
    navigate(`/owner/products/edit/${productId}`);
  };

  const handleHide = (productId) => {
    setModalState({
      isOpen: true,
      type: "hide",
      productId,
      loading: false,
    });
  };

  const handleUnhide = (productId) => {
    setModalState({
      isOpen: true,
      type: "unhide",
      productId,
      loading: false,
    });
  };

  const handleDelete = (productId) => {
    setModalState({
      isOpen: true,
      type: "delete",
      productId,
      loading: false,
    });
  };

  const handlePromote = (product) => {
    setPromoteModalState({
      isOpen: true,
      product,
    });
  };

  const closePromoteModal = () => {
    setPromoteModalState({
      isOpen: false,
      product: null,
    });
  };

  const handlePromoteSuccess = () => {
    closePromoteModal();
    loadProducts(); // Reload products to show updated promotion status
  };

  const closeModal = () => {
    if (!modalState.loading) {
      setModalState({
        isOpen: false,
        type: null,
        productId: null,
        loading: false,
      });
    }
  };

  const confirmAction = async () => {
    setModalState((prev) => ({ ...prev, loading: true }));

    try {
      let res;

      switch (modalState.type) {
        case "hide":
          res = await ownerProductApi.hideProduct(modalState.productId);
          break;
        case "unhide":
          res = await ownerProductApi.unhideProduct(modalState.productId);
          break;
        case "delete":
          res = await ownerProductApi.softDeleteProduct(modalState.productId);
          break;
        default:
          return;
      }

      if (res.success) {
        closeModal();
        loadProducts();
      }
    } catch (err) {
      console.error(`Error performing ${modalState.type}:`, err);
      // Show error in modal instead of alert
      setModalState({
        isOpen: true,
        type: "error",
        productId: null,
        loading: false,
        errorMessage:
          err.message || `Không thể ${getActionName(modalState.type)} sản phẩm`,
      });
    }
  };

  const getActionName = (type) => {
    switch (type) {
      case "hide":
        return "ẩn";
      case "unhide":
        return "hiện";
      case "delete":
        return "xóa";
      default:
        return "xử lý";
    }
  };

  const getModalConfig = () => {
    switch (modalState.type) {
      case "hide":
        return {
          title: "Ẩn Sản Phẩm",
          message:
            "Bạn có chắc chắn muốn ẩn sản phẩm này không? Sản phẩm sẽ không còn hiển thị với người dùng khác, nhưng bạn có thể hiện lại bất kỳ lúc nào.",
          confirmText: "Ẩn Sản Phẩm",
          type: "hide",
        };
      case "unhide":
        return {
          title: "Hiện Lại Sản Phẩm",
          message:
            "Bạn có chắc chắn muốn hiện lại sản phẩm này không? Sản phẩm sẽ hiển thị trở lại cho người dùng khác.",
          confirmText: "Hiện Lại",
          type: "unhide",
        };
      case "delete":
        return {
          title: "Xóa Sản Phẩm",
          message:
            "Bạn có chắc chắn muốn xóa sản phẩm này không? Sau khi xóa, sản phẩm sẽ không còn hiển thị và hành động này không thể hoàn tác.",
          confirmText: "Xóa Sản Phẩm",
          type: "danger",
        };
      case "error":
        return {
          title: "Lỗi",
          message:
            modalState.errorMessage || "Có lỗi xảy ra. Vui lòng thử lại.",
          confirmText: "Đóng",
          type: "error",
        };
      default:
        return {
          title: "",
          message: "",
          confirmText: "Xác nhận",
          type: "warning",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Sản Phẩm Của Tôi
            </h1>
            <p className="text-gray-600 mt-2">
              Quản lý các sản phẩm cho thuê của bạn
            </p>
          </div>
          <Link
            to="/owner/products/create"
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            <FiPlus className="w-5 h-5" />
            <span className="font-medium">Thêm Sản Phẩm</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm của bạn..."
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
              <svg
                className="absolute left-4 top-5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <select
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={`${filters.sort}-${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split("-");
                updateFilters({ sort, order });
              }}
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>

            <div className="text-gray-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
              <span className="text-green-600 font-bold">
                {pagination.totalItems || 0}
              </span>{" "}
              sản phẩm
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
          </div>
        )}

        {/* Error State */}
        {error && <div className="text-center py-20 text-red-600">{error}</div>}

        {/* Empty State - No Products */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-12 max-w-2xl mx-auto"
            >
              <div className="text-6xl mb-6">📦</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Chưa có sản phẩm nào
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Bắt đầu cho thuê sản phẩm của bạn ngay hôm nay!
              </p>
              <button
                onClick={() => navigate("/owner/products/create")}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 text-lg font-semibold"
              >
                <FiPlus className="w-6 h-6" />
                Tạo Sản Phẩm Đầu Tiên
              </button>
            </motion.div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  y: product.isPromoted ? -8 : -5,
                  scale: product.isPromoted ? 1.03 : 1.02,
                }}
                className="relative"
              >
                <ProductActionButtons
                  product={product}
                  onEdit={handleEdit}
                  onHide={handleHide}
                  onUnhide={handleUnhide}
                  onDelete={handleDelete}
                  onPromote={handlePromote}
                />

                {/* Status Badge - Positioned to avoid conflict with promotion badge */}
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                  {/* Promotion badge space - if product is promoted, status badge moves down */}
                  {product.isPromoted && <div className="h-8"></div>}

                  {product.status === "ACTIVE" && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Đang hoạt động
                    </span>
                  )}
                  {product.status === "PENDING" && (
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      Chờ duyệt
                    </span>
                  )}
                  {product.status === "INACTIVE" && (
                    <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      Không hoạt động
                    </span>
                  )}
                  {product.status === "SUSPENDED" && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      Đã đình chỉ
                    </span>
                  )}
                  {product.status === "RENTED" && (
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      Đang cho thuê
                    </span>
                  )}
                  {product.status === "DRAFT" && (
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      Bản nháp
                    </span>
                  )}
                  {product.status === "OWNER_HIDDEN" && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                      <FiEyeOff className="w-3 h-3" />
                      Đã ẩn
                    </span>
                  )}
                </div>

                <ProductCard product={product} isOwnerView={true} />

                {/* Overlay for hidden products */}
                {product.status === "OWNER_HIDDEN" && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center pointer-events-none">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                      <span className="text-gray-800 font-semibold flex items-center gap-2">
                        <FiEyeOff className="w-5 h-5" />
                        Đã Ẩn
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* Previous button */}
              {pagination.currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Trước
                </button>
              )}

              {/* Page numbers */}
              {(() => {
                const currentPage = pagination.currentPage;
                const totalPages = pagination.totalPages;
                const pages = [];

                // Always show first page
                if (currentPage > 3) {
                  pages.push(1);
                  if (currentPage > 4) {
                    pages.push("...");
                  }
                }

                // Show pages around current page
                for (
                  let i = Math.max(1, currentPage - 2);
                  i <= Math.min(totalPages, currentPage + 2);
                  i++
                ) {
                  pages.push(i);
                }

                // Always show last page
                if (currentPage < totalPages - 2) {
                  if (currentPage < totalPages - 3) {
                    pages.push("...");
                  }
                  pages.push(totalPages);
                }

                return pages.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        page === currentPage
                          ? "bg-green-500 text-white border-green-500 shadow-lg"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                });
              })()}

              {/* Next button */}
              {pagination.currentPage < pagination.totalPages && (
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Sau
                </button>
              )}
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600">
              Trang {pagination.currentPage} / {pagination.totalPages}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.type === "error" ? closeModal : confirmAction}
        {...getModalConfig()}
        loading={modalState.loading}
        cancelText={modalState.type === "error" ? null : "Hủy"}
      />

      {/* Promote Product Modal */}
      {promoteModalState.isOpen && promoteModalState.product && (
        <PromoteProductModal
          product={promoteModalState.product}
          onClose={closePromoteModal}
          onSuccess={handlePromoteSuccess}
        />
      )}
    </div>
  );
}
