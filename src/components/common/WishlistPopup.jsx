import React from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function WishlistPopup({ open, onClose }) {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-4">{t('wishlist.title')}</h2>
        {loading ? (
          <div>{t('wishlist.loading')}</div>
        ) : wishlist.length === 0 ? (
          <div>{t('wishlist.empty')}</div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* You may want to fetch product details by productId if needed, or store more info in context. For demo, show productId only. */}
            {wishlist.map((productId) => (
              <div key={productId} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3 shadow-sm transition hover:shadow-md">
                <img src={'/images/camera.png'} alt="Product" className="w-14 h-14 object-cover rounded-lg border" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{t('wishlist.productLabel')} {productId}</h3>
                  <div className="text-xs text-gray-500">Đà Nẵng</div>
                  <div className="font-semibold text-primary-700">— đ/ngày</div>
                </div>
                <Link to={`/product/${productId}`} className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm">{t('wishlist.view')}</Link>
                <button onClick={() => removeFromWishlist(productId)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">{t('wishlist.remove')}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
