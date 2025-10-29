import React, { useEffect, useState } from 'react';
import { wishlistService } from '../services/wishlist';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user?._id) return;
    wishlistService.list(user._id)
      .then(res => {
        setWishlist(res.data?.wishlist || []);
      })
      .catch(() => setWishlist([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (productId) => {
    if (!user?._id) return;
    try {
      await wishlistService.remove(user._id, productId);
      setWishlist(wishlist.filter(p => p.product?._id !== productId));
    } catch (e) {
      alert('Có lỗi khi xóa sản phẩm khỏi wishlist!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6">Danh sách yêu thích</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : wishlist.length === 0 ? (
        <div>Bạn chưa thêm sản phẩm nào vào wishlist.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {wishlist.map((item) => (
            <div key={item.product?._id} className="bg-white rounded-lg shadow p-4 flex flex-col">
              <img src={item.product?.images?.[0]?.url || '/images/camera.png'} alt={item.product?.title} className="w-full h-40 object-cover rounded" />
              <h3 className="mt-2 font-semibold text-lg">{item.product?.title}</h3>
              <div className="text-sm text-gray-500">{item.product?.location?.address?.city || '—'}</div>
              <div className="mt-2 font-semibold text-primary-700">{(item.product?.pricing?.dailyRate || 0).toLocaleString('vi-VN')}đ/ngày</div>
              <div className="flex-1" />
              <div className="mt-4 flex gap-2">
                <Link to={`/product/${item.product?._id}`} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Xem chi tiết</Link>
                <button onClick={() => handleRemove(item.product?._id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
