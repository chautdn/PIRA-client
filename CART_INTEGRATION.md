# 🛒 Cart Integration Guide

## Tổng quan
Cart system đã được implement với **Server-side + localStorage fallback**:
- **Chưa login**: Cart lưu trong `localStorage`
- **Đã login**: Cart lưu trong `backend MongoDB`
- **Stock validation**: Backend validate số lượng tồn kho

## ✅ Đã hoàn thành
- ✅ Backend API (`/api/cart`)
- ✅ Cart Context & Service
- ✅ Cart UI (Drawer, Cart Page)
- ✅ Tích hợp vào ProductList & ProductDetail

## ⚠️ Optional: Sync Cart khi Login

### Vấn đề
Khi user **chưa login** → add items vào cart (localStorage) → **login** → cart backend rỗng

### Giải pháp (Optional)
Thêm **3 dòng code** vào `src/pages/auth/Login.jsx` để sync cart sau khi login:

```jsx
// 1️⃣ Import useCart
import { useCart } from '../../context/CartContext';

export default function Login() {
  const { login } = useAuth();
  const { syncCart } = useCart(); // 2️⃣ Destructure syncCart
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... existing code ...
    
    try {
      const result = await login({ email, password });
      const user = result.data?.data?.user || result.data?.user;
      
      // 3️⃣ Sync cart from localStorage to backend
      await syncCart();
      
      // Navigate based on user role
      navigateByRole(navigate, user);
    } catch (err) {
      // ... error handling ...
    }
  };
}
```

### Hoặc không thêm vào Login
Nếu không thêm vào Login:
- Cart vẫn hoạt động bình thường
- Items trong localStorage vẫn hiển thị
- Khi user **add item mới** sau khi login → tất cả items sẽ được sync lên backend tự động

## 📚 API Endpoints

### 1. Get Cart
```http
GET /api/cart
Authorization: Bearer {token}
```

### 2. Add to Cart
```http
POST /api/cart
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 1,
  "rental": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-03",
    "duration": 3
  }
}
```

### 3. Update Quantity
```http
PUT /api/cart/:productId
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 2
}
```

### 4. Remove Item
```http
DELETE /api/cart/:productId
Authorization: Bearer {token}
```

### 5. Clear Cart
```http
DELETE /api/cart
Authorization: Bearer {token}
```

### 6. Sync Cart (Manual)
```http
POST /api/cart/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "product": { "_id": "product_id", ... },
      "quantity": 1,
      "rental": { "duration": 1 }
    }
  ]
}
```

### 7. Validate Cart (Before Checkout)
```http
POST /api/cart/validate
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "valid": false,
    "errors": [
      {
        "productId": "xxx",
        "message": "Chỉ còn 2 sản phẩm trong kho (bạn đang chọn 5)"
      }
    ],
    "cart": { ... }
  }
}
```

## 🔧 Frontend Usage

### 1. Sử dụng Cart Context
```jsx
import { useCart } from '../context/CartContext';

function MyComponent() {
  const {
    cart,           // Array of cart items
    cartCount,      // Total number of items
    cartTotal,      // Total price
    isCartOpen,     // Cart drawer state
    loading,        // Loading state
    addToCart,      // Add item to cart
    removeFromCart, // Remove item from cart
    updateQuantity, // Update item quantity
    clearCart,      // Clear all items
    syncCart,       // Sync localStorage to backend
    refreshCart,    // Refresh cart from backend
    toggleCart,     // Toggle cart drawer
    openCart,       // Open cart drawer
    closeCart,      // Close cart drawer
    isInCart,       // Check if product in cart
    getProductQuantity // Get product quantity
  } = useCart();
  
  // Add to cart with error handling
  const handleAddToCart = async () => {
    const result = await addToCart(product, 1, {
      startDate: startDate,
      endDate: endDate,
      duration: days
    });
    
    if (result.success) {
      toast.success('Đã thêm vào giỏ hàng!');
    } else {
      toast.error(result.error || 'Có lỗi xảy ra');
    }
  };
}
```

### 2. Stock Validation
Backend tự động validate stock khi:
- Add to cart
- Update quantity
- Validate before checkout

Nếu vượt quá stock, backend trả về error:
```json
{
  "success": false,
  "message": "Chỉ còn 3 sản phẩm trong kho"
}
```

## 📝 Files Created/Modified

### Backend (New Files)
- `src/models/Cart.js`
- `src/services/cart.service.js`
- `src/controllers/cart.controller.js`
- `src/routes/cart.routes.js`
- `src/routes/api.js` (1 line added)

### Frontend (New Files)
- `src/services/cart.js`
- `src/context/CartContext.jsx`
- `src/components/cart/CartDrawer.jsx`
- `src/components/cart/CartItem.jsx`
- `src/pages/Cart.jsx`

### Frontend (Modified - Already in your branch)
- `src/App.jsx` (CartDrawer, Cart route, Footer)
- `src/components/layout/Navigation.jsx` (cart icon)
- `src/pages/ProductDetail.jsx` (addToCart)
- `src/pages/ProductList.jsx` (addToCart)
- `src/providers/AppProviders.jsx` (CartProvider)
- `src/utils/constants.js` (CART constants)

### Frontend (NOT Modified - Safe for your friend)
- ✅ `src/pages/auth/Login.jsx` - NOT touched (you can add sync manually if needed)

## 🚀 Testing

1. **Test without login:**
   ```
   - Add items to cart
   - Check localStorage
   - Reload page → items persist
   ```

2. **Test with login:**
   ```
   - Login → cart loaded from backend
   - Add items → saved to backend
   - Logout → Login again → cart persists
   ```

3. **Test stock validation:**
   ```
   - Add item quantity > available stock
   - Should show error: "Chỉ còn X sản phẩm trong kho"
   ```

4. **Test sync (if implemented):**
   ```
   - Add items without login
   - Login → items should sync to backend
   - Check backend cart → items present
   ```

---

**Note**: Tất cả changes đều **an toàn** và **không ảnh hưởng** đến code của bạn bạn, ngoại trừ file `Login.jsx` đã được revert về trạng thái ban đầu.

