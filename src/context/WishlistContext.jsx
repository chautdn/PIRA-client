import React, { createContext, useContext, useEffect, useState } from 'react';
import { wishlistService } from '../services/wishlist';
import { useAuth } from '../hooks/useAuth';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]); // Array of product objects, not just IDs
  const [wishlistIds, setWishlistIds] = useState([]); // For quick lookup
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      setLoading(true);
      wishlistService.list(user._id)
        .then(res => {
          const favorites = res.data?.wishlist || res.data?.data || [];
          setWishlist(favorites);
          setWishlistIds(favorites.map(w => w.product?._id || w.productId));
        })
        .catch(() => {
          setWishlist([]);
          setWishlistIds([]);
        })
        .finally(() => setLoading(false));
    } else {
      setWishlist([]);
      setWishlistIds([]);
    }
  }, [user]);

  const addToWishlist = async (productId, productData = null) => {
    if (!user?._id) return;
    try {
      const res = await wishlistService.add(user._id, productId);
      // Update local state
      setWishlistIds(prev => {
        if (prev.includes(productId)) return prev;
        return [...prev, productId];
      });
      // If product data is provided, add it to wishlist array
      if (productData) {
        setWishlist(prev => [...prev, { product: productData }]);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user?._id) return;
    try {
      await wishlistService.remove(user._id, productId);
      setWishlist(prev => prev.filter(item => (item.product?._id || item.productId) !== productId));
      setWishlistIds(prev => prev.filter(id => id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const isInWishlist = (productId) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider 
      value={{ 
        wishlist, 
        wishlistIds, 
        loading, 
        addToWishlist, 
        removeFromWishlist,
        isInWishlist 
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
