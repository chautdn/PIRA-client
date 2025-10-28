
import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productService } from '../services/product';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../hooks/useAuth';

export default function ProductList() {
  // Lưu page trước đó để xác định hướng chuyển trang
  const prevPageRef = useRef();
  const { user } = useAuth();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  // Lấy search param từ URL
  const searchParams = new URLSearchParams(location.search);
  const search = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(search);
  const [filter, setFilter] = useState({
    name: '',
    category: '',
    district: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    status: '',
    inStock: false,
  });


  // Scroll lên đầu khi reload lần đầu
  useEffect(() => {
    window.scrollTo(0, 0);
    loadCategories();
    loadProducts();
    
    // Set default categories immediately while API loads
    setCategories([
      { _id: 'cameras', name: 'Máy ảnh & Quay phim' },
      { _id: 'camping', name: 'Thiết bị cắm trại' },
      { _id: 'luggage', name: 'Vali & Túi xách' },
      { _id: 'sports', name: 'Thiết bị thể thao' },
      { _id: 'accessories', name: 'Phụ kiện du lịch' }
    ]);
  }, []);

  // Realtime search: cập nhật URL khi nhập
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      if (searchInput) {
        params.set('search', searchInput);
      } else {
        params.delete('search');
      }
      window.history.replaceState(null, '', `/products?${params}`);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchInput, location.search]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Lấy page hiện tại từ URL
        const searchParams = new URLSearchParams(location.search);
        const page = Number(searchParams.get('page')) || 1;
        let params = { page, limit: 12 };
        if (search) params.search = search;
  if (filter.name) params.name = filter.name;
  if (filter.category) params.category = filter.category;
  if (filter.district) params.district = filter.district;
  if (filter.minPrice) params.minPrice = filter.minPrice;
  if (filter.maxPrice) params.maxPrice = filter.maxPrice;
  if (filter.condition) params.condition = filter.condition;
  if (filter.status) params.status = filter.status;
  if (filter.inStock) params.inStock = true;
        const res = await productService.list(params);
        const list = res.data?.data || [];
        setProducts(list);
        setTotal(res.data?.pagination?.total || list.length);

        // Scroll lên đầu nếu chuyển trang tiến hoặc reload, không scroll khi back
        const prevPage = prevPageRef.current;
        if (prevPage !== undefined) {
          if (page > prevPage) {
            window.scrollTo(0, 0);
          }
        }
        prevPageRef.current = page;
      } catch (e) {
        console.error('Load products failed', e);
        setError('Không tải được danh sách sản phẩm');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [search, filter, location.search]);

  // Wishlist logic now uses context
  const handleToggleWishlist = async (productId) => {
    if (!user?._id) return alert('Bạn cần đăng nhập để sử dụng wishlist!');
    const isWished = wishlist.includes(productId);
    try {
      if (isWished) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (e) {
      alert('Có lỗi khi cập nhật wishlist!');
    }
  };

  const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Tìm thấy {total} sản phẩm</h1>
          </div>
          <div className="flex items-center gap-2">
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Mới nhất</option>
              <option>Giá tăng dần</option>
              <option>Giá giảm dần</option>
              <option>Đánh giá cao nhất</option>
            </select>
            
            {/* Results count */}
            <div className="text-gray-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
              Tìm thấy <span className="text-green-600 font-bold">{pagination.total || 0}</span> sản phẩm
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar filters hiện đại */}
          <aside className="md:col-span-1 space-y-6">
            {/* Danh mục */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b text-sm font-semibold">Danh mục</div>
              <div className="p-2 space-y-2">
                {['', 'Máy ảnh & Quay phim', 'Thiết bị cắm trại', 'Vali & Túi xách', 'Thiết bị thể thao', 'Đồ điện tử', 'Phụ kiện du lịch'].map((cat, i) => (
                  <button
                    key={cat || 'all'}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${filter.category === cat ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}
                    onClick={() => setFilter(f => ({ ...f, category: cat }))}
                  >{cat || 'Tất cả'}</button>
                ))}
              </div>
            </div>

            {/* Quận Đà Nẵng */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b text-sm font-semibold">Quận Đà Nẵng</div>
              <div className="p-4">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={filter.district} onChange={e => setFilter(f => ({ ...f, district: e.target.value }))}>
                  <option value="">Tất cả</option>
                  <option value="Hải Châu">Hải Châu</option>
                  <option value="Thanh Khê">Thanh Khê</option>
                  <option value="Sơn Trà">Sơn Trà</option>
                  <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
                  <option value="Liên Chiểu">Liên Chiểu</option>
                  <option value="Cẩm Lệ">Cẩm Lệ</option>
                </select>
              </div>
            </div>

            {/* Khoảng giá/ngày */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b text-sm font-semibold">Khoảng giá/ngày</div>
              <div className="p-4 flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <input type="number" min="0" max="1000000" className="w-1/2 border rounded px-2 py-1" placeholder="Từ" value={filter.minPrice} onChange={e => setFilter(f => ({ ...f, minPrice: e.target.value }))} />
                  <span>-</span>
                  <input type="number" min="0" max="1000000" className="w-1/2 border rounded px-2 py-1" placeholder="Đến" value={filter.maxPrice} onChange={e => setFilter(f => ({ ...f, maxPrice: e.target.value }))} />
                </div>
                <div className="text-xs text-gray-500">(đơn vị: đ/ngày)</div>
              </div>
            </div>

            {/* Tình trạng sản phẩm */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b text-sm font-semibold">Tình trạng sản phẩm</div>
              <div className="p-4">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={filter.condition} onChange={e => setFilter(f => ({ ...f, condition: e.target.value }))}>
                  <option value="">Tất cả</option>
                  <option value="NEW">Mới</option>
                  <option value="LIKE_NEW">Như mới</option>
                  <option value="GOOD">Tốt</option>
                  <option value="FAIR">Trung bình</option>
                  <option value="POOR">Kém</option>
                </select>
              </div>
            </div>

            {/* Trạng thái sản phẩm */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b text-sm font-semibold">Trạng thái sản phẩm</div>
              <div className="p-4">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
                  <option value="">Tất cả</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="RENTED">Đã thuê</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                  <option value="DRAFT">Nháp</option>
                  <option value="SUSPENDED">Bị khóa</option>
                </select>
              </div>
            </div>

            {/* Chỉ hiện sản phẩm còn hàng */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b text-sm font-semibold">Khác</div>
              <div className="p-4 flex items-center gap-2">
                <input type="checkbox" id="inStock" checked={filter.inStock} onChange={e => setFilter(f => ({ ...f, inStock: e.target.checked }))} />
                <label htmlFor="inStock" className="text-sm">Chỉ hiện sản phẩm còn hàng</label>
              </div>
            </div>

            {/* Nút xóa lọc */}
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm" onClick={() => setFilter({ name: '', category: '', district: '', minPrice: '', maxPrice: '', condition: '', status: '', inStock: false })}>Xóa lọc</button>
            </div>
          </aside>

          {/* Product grid */}
          <section className="md:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && (
                <div className="col-span-full text-center text-sm text-gray-500">Đang tải sản phẩm...</div>
              )}
              {error && (
                <div className="col-span-full text-center text-sm text-red-600">{error}</div>
              )}
              {!loading && !error && products.map((p, idx) => (
                <motion.div key={p._id || idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.4, delay: idx * 0.05 }} variants={fadeIn}>
                  <div className="relative h-44 overflow-hidden">
                    <img src={(p.images && p.images[0]?.url) || '/images/camera.png'} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                    <button
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 border border-gray-300 shadow flex items-center justify-center ${wishlist.includes(p._id) ? 'text-red-500' : 'text-gray-600'} hover:text-red-500`}
                      title={wishlist.includes(p._id) ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                      onClick={() => handleToggleWishlist(p._id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={wishlist.includes(p._id) ? '#ef4444' : 'none'} stroke="#ef4444" strokeWidth="1.8" className="w-4 h-4">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>📍 {p.location?.address?.city || '—'}</span>
                      <span>👁️ {p.metrics?.viewCount ?? 0}</span>
                    </div>

                    {/* Product Info */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Location & Views */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>📍 {product.location?.address?.city || 'Đà Nẵng'}</span>
                        <span>👁️ {product.metrics?.viewCount || 0}</span>
                      </div>

                      {/* Title - Fixed height */}
                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-600 transition-colors line-clamp-2 h-14">
                        {product.title}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {product.metrics?.averageRating || 4.8} ({product.metrics?.reviewCount || 0} đánh giá)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(product.pricing?.dailyRate || 0)}đ
                          <span className="text-sm text-gray-500 font-normal">/ngày</span>
                        </div>
                      </div>

                      {/* Spacer to push buttons to bottom */}
                      <div className="flex-1"></div>

                      {/* Action Button - Always at bottom */}
                      <div className="mt-auto">
                        {/* Rent Now Button - Navigate to detail to select dates */}
                        <Link 
                          to={`/product/${product._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          📅 Thuê Ngay
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {/* Pagination động */}
            {total > 12 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {(() => {
                  const limit = 12;
                  const pageCount = Math.ceil(total / limit);
                  const searchParams = new URLSearchParams(location.search);
                  const currentPage = Number(searchParams.get('page')) || 1;
                  const pageArr = [];
                  for (let i = 1; i <= pageCount; i++) pageArr.push(i);
                  return [
                    <button key="prev" disabled={currentPage === 1} onClick={() => {
                      searchParams.set('page', Math.max(1, currentPage - 1));
                      window.history.replaceState(null, '', `/products?${searchParams}`);
                      // Không scroll khi back
                      window.dispatchEvent(new Event('popstate'));
                    }} className="px-3 py-1.5 rounded border text-sm border-gray-300 hover:bg-gray-50 disabled:opacity-50">Trước</button>,
                    ...pageArr.map(i => (
                      <button key={i} onClick={() => {
                        searchParams.set('page', i);
                        window.history.replaceState(null, '', `/products?${searchParams}`);
                        // Scroll lên đầu nếu chọn số lớn hơn
                        window.dispatchEvent(new Event('popstate'));
                      }} className={`px-3 py-1.5 rounded border text-sm ${i===currentPage ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'}`}>{i}</button>
                    )),
                    <button key="next" disabled={currentPage === pageCount} onClick={() => {
                      searchParams.set('page', Math.min(pageCount, currentPage + 1));
                      window.history.replaceState(null, '', `/products?${searchParams}`);
                      // Scroll lên đầu khi next
                      window.dispatchEvent(new Event('popstate'));
                    }} className="px-3 py-1.5 rounded border text-sm border-gray-300 hover:bg-gray-50 disabled:opacity-50">Sau</button>
                  ];
                })()}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}





