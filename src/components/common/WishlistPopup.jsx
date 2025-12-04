import React from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

export default function WishlistPopup({ open, onClose }) {
  const { wishlist, loading, removeFromWishlist } = useWishlist();

  if (!open) return null;

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Get main image
  const getMainImage = (product) => {
    if (!product || !product.images || product.images.length === 0) {
      return '/images/placeholder-product.jpg';
    }
    if (typeof product.images[0] === 'string') {
      return product.images[0];
    }
    return product.images[0]?.url || '/images/placeholder-product.jpg';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light z-10" 
          onClick={onClose}
        >
          ×
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-gray-800 pr-6">Danh sách yêu thích</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">❤️</div>
            <p className="text-lg">Bạn chưa thêm sản phẩm nào vào yêu thích.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlist.map((item) => {
              const product = item.product || item;
              const productId = product._id || product.id;

              return (
                <div 
                  key={productId} 
                  className="flex items-start gap-4 bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all group"
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img 
                      src={getMainImage(product)} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      onError={(e) => {
                        e.target.src = '/images/placeholder-product.jpg';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm">
                      {product.title || 'Sản phẩm không có tên'}
                    </h3>
                    
                    {/* Location */}
                    {product.location?.address?.city && (
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <span>📍</span>
                        <span>{product.location.address.city}</span>
                      </div>
                    )}

                    {/* Condition & Rating */}
                    <div className="flex items-center gap-2 mb-2">
                      {product.condition && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          product.condition === 'NEW'
                            ? 'bg-green-100 text-green-700'
                            : product.condition === 'LIKE_NEW'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.condition === 'NEW' ? 'Mới' : product.condition === 'LIKE_NEW' ? 'Như mới' : product.condition}
                        </span>
                      )}
                      
                      {product.metrics?.averageRating > 0 && (
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{product.metrics.averageRating.toFixed(1)} ({product.metrics.reviewCount})</span>
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    {product.pricing?.dailyRate && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(product.pricing.dailyRate)}
                        </span>
                        <span className="text-xs text-gray-500">/ngày</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex gap-2">
                    <Link 
                      to={`/product/${productId}`} 
                      onClick={onClose}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Xem
                    </Link>
                    <button 
                      onClick={() => removeFromWishlist(productId)}
                      className="px-3 py-2 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      title="Xóa khỏi yêu thích"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
