import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productService } from '../services/product';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await productService.list({ page: 1, limit: 12 });
        const list = res.data?.data || [];
        setProducts(list);
        setTotal(res.data?.pagination?.total || list.length);
      } catch (e) {
        console.error('Load products failed', e);
        setError('Không tải được danh sách sản phẩm');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
            <button className="inline-flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-md text-sm hover:bg-gray-50">
              <span>⚙️</span>
              Bộ lọc
            </button>
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Mới nhất</option>
              <option>Giá tăng dần</option>
              <option>Giá giảm dần</option>
              <option>Đánh giá cao nhất</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar filters */}
          <aside className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b text-sm font-semibold">Danh mục</div>
              <div className="p-2">
                {['Tất cả','Máy ảnh & Quay phim','Thiết bị cắm trại','Vali & Túi xách','Thiết bị thể thao','Đồ điện tử','Phụ kiện du lịch'].map((cat,i)=> (
                  <button key={i} className={`w-full text-left px-3 py-2 rounded-md text-sm ${i===0?'bg-primary-600 text-white':'hover:bg-gray-100'}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b text-sm font-semibold">Khoảng giá</div>
              <div className="p-4">
                <input type="range" min="0" max="1000000" className="w-full" />
                <div className="mt-2 flex justify-between text-xs text-gray-600">
                  <span>0đ/ngày</span>
                  <span>1.000.000đ/ngày</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b text-sm font-semibold">Địa điểm</div>
              <div className="p-4">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Đà Nẵng</option>
                  <option>Hà Nội</option>
                  <option>Hồ Chí Minh</option>
                </select>
              </div>
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
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 border border-gray-300 shadow flex items-center justify-center text-gray-600 hover:text-primary-600"
                      title="Yêu thích"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>📍 {p.location?.address?.city || '—'}</span>
                      <span>👁️ {p.metrics?.viewCount ?? 0}</span>
                    </div>
                    <h3 className="mt-1 font-semibold text-gray-900">{p.title}</h3>
                    <div className="mt-1 text-xs text-gray-500">Chủ sở hữu: {p.owner?.email || '—'}</div>
                    <div className="mt-2 flex items-center text-xs">
                      <span className="text-yellow-500">★ {p.metrics?.averageRating ?? 4.8}</span>
                      <span className="ml-1 text-gray-500">({p.metrics?.reviewCount ?? 0})</span>
                    </div>
                    <div className="mt-2 font-semibold text-primary-700">{(p.pricing?.dailyRate || 0).toLocaleString('vi-VN')}đ/ngày</div>
                    <Link to={`/product/${p._id || ''}`} className="mt-3 w-full inline-flex justify-center items-center bg-primary-600 hover:bg-primary-700 text-white text-sm px-4 py-2 rounded-md">Xem Chi Tiết</Link>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center gap-2">
              {['Trước', '1', '2', '3', 'Sau'].map((label, i) => (
                <button key={i} className={`px-3 py-1.5 rounded border text-sm ${label==='1' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'}`}>{label}</button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


