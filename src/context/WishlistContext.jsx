import React, { createContext, useContext, useEffect, useState } from 'react';
import { wishlistService } from '../services/wishlist';
import { useAuth } from '../hooks/useAuth';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      setLoading(true);
      wishlistService.list(user._id)
        .then(res => {
          setWishlist(res.data?.wishlist?.map(w => w.product?._id) || []);
        })
        .catch(() => setWishlist([]))
        .finally(() => setLoading(false));
    } else {
      setWishlist([]);
    }
  }, [user]);

  const addToWishlist = async (productId) => {
    if (!user?._id) return;
    await wishlistService.add(user._id, productId);
    setWishlist(prev => [...prev, productId]);
  };

  const removeFromWishlist = async (productId) => {
    if (!user?._id) return;
    await wishlistService.remove(user._id, productId);
    setWishlist(prev => prev.filter(id => id !== productId));
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
