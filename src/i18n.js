import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          nav: {
            home: 'Home',
            products: 'Products',
            cart: 'Cart',
            wishlist: 'Wishlist',
            orders: 'Orders',
            chat: 'Chat',
            wallet: 'Wallet',
            rental: 'Rental'
          },
          auth: {
            login: 'Login',
            register: 'Register',
            logout: 'Logout'
          },
          orders: {
            title: 'Order Management',
            subtitle: 'Track and manage your rental orders',
            reload: 'Reload',
            rentProduct: 'Rent Product',
            createOrder: 'Create New Order',
            myOrders: 'My Orders',
            searchPlaceholder: 'Search orders...',
            allStatus: 'All Statuses',
            status: {
              DRAFT: 'Draft',
              PENDING_PAYMENT: 'Pending Payment',
              PAYMENT_COMPLETED: 'Paid',
              PENDING_CONFIRMATION: 'Pending Confirmation',
              PENDING_OWNER_CONFIRMATION: 'Pending Owner Confirmation',
              OWNER_CONFIRMED: 'Owner Confirmed',
              OWNER_REJECTED: 'Owner Rejected',
              READY_FOR_CONTRACT: 'Ready for Contract',
              CONTRACT_SIGNED: 'Contract Signed',
              ACTIVE: 'Active',
              COMPLETED: 'Completed',
              CANCELLED: 'Cancelled'
            },
            noOrders: 'No orders yet',
            noOrdersDesc: 'You have no rental orders. Create your first order!',
            viewProducts: 'View Products',
            notFound: 'No orders found',
            createdAt: 'Created at',
            rentalTime: 'Rental Duration',
            days: 'days',
            productCount: 'Product Count',
            delivery: 'Delivery',
            deliveryPickup: 'Pickup',
            deliveryShip: 'Ship to address',
            total: 'Total',
            updateAt: 'Updated at',
            viewDetail: 'View Details',
            signContract: 'Sign Contract',
            prev: 'Prev',
            next: 'Next',
            page: 'Page',
            of: 'of',
            owner: 'Owner',
            ownerUnknown: 'Unknown',
            ownerDetail: 'Owner Details',
            product: 'Product',
            quantity: 'Quantity',
            price: 'Rental Price',
            deposit: 'Deposit',
            shippingFee: 'Shipping Fee',
            totalRental: 'Total Rental',
            totalDeposit: 'Total Deposit',
            totalAmount: 'Total Payment',
            paymentMethod: 'Payment Method',
            paymentWallet: 'Wallet',
            paymentBank: 'Bank Transfer',
            paymentCOD: 'Cash on Delivery',
            close: 'Close',
            contract: 'Contract',
            ownerNameUnknown: 'Unknown Name',
            notLoggedIn: 'Please log in',
            loginToView: 'You need to log in to view orders',
            login: 'Log in'
          },
          owner: {
            menu: {
              title: 'Rental Management',
              description: 'All features for product owners',
              myProducts: {
                label: 'My Products',
                description: 'Manage rental products'
              },
              addProduct: {
                label: 'Add New Product',
                description: 'Create rental product'
              },
              rentalRequests: {
                label: 'Rental Requests',
                description: 'Manage rental requests'
              },
              analytics: {
                label: 'Analytics',
                description: 'View revenue and reports',
                comingSoon: 'Coming Soon'
              },
              tip: 'Tip: List more products to increase your income!'
            }
          },
          home: {
            hero: {
              title: "Your Adventure Starts Here!",
              subtitle: "Rent Travel Equipment Now",
              description: "Explore, Save & Share. Access high-quality travel equipment from trusted locals.",
              trusted: "Trusted by 10,000+ customers",
              searchButton: "Find Equipment Now",
              rentButton: "Rent Out Equipment"
            },
            promotion: {
              tiers: {
                1: 'Premium',
                2: 'Gold',
                3: 'Silver',
                4: 'Bronze',
                5: 'Basic',
                featured: 'Featured'
              }
            },
            categories: {
              camera: "Camera",
              backpack: "Backpack",
              tent: "Tent",
              vali: "Suitcase",
              flycam: "Drone",
              gps: "GPS"
            },
            features: {
              rating: "4.9/5 rating",
              safety: "Secure payments",
              support: "24/7 Support"
            }
          },
          whyChoosePira: {
            title: "Why Choose PIRA?",
            subtitle: "Join thousands of travelers who trust PIRA for their equipment rental needs",
            cards: {
              variety: {
                title: "Wide Selection",
                desc: "From cameras and camping gear to specialized equipment, everything is available in your area."
              },
              safety: {
                title: "Safe Transactions",
                desc: "Secure payments, verification, and comprehensive insurance for peace of mind."
              },
              community: {
                title: "Trusted Community",
                desc: "Verified reviews, user ratings, and a supportive community."
              }
            }
          },
          product: {
            search: {
              placeholder: "Search for travel equipment..."
            },
            status: {
              available: "Available",
              rented: "Rented",
              pending: "Pending"
            },
            actions: {
              addToCart: "Add to Cart",
              rentNow: "Rent Now",
              contactOwner: "Contact Owner"
            }
          },
          common: {
            loading: {
              general: "Loading...",
              products: "Loading products..."
            },
            error: {
              general: "Something went wrong",
              products: "Could not load featured products"
            },
            success: "Success",
            cancel: "Cancel",
            save: "Save",
            delete: "Delete",
            edit: "Edit",
            view: "View",
            close: "Close",
            confirm: "Confirm",
            retry: "Try Again",
            viewAll: "View All Products",
            noProducts: {
              title: "No Products Yet",
              message: "There are no products yet. Please check back later!"
            },
            featuredProducts: {
              title: "Featured Equipment",
              subtitle: "Top 10 promoted items - Quality verified",
              newProducts: "Discover our latest travel equipment",
              badgePromoted: "TOP PROMOTED",
              badgeNew: "NEW PRODUCTS"
            },
            exploreCategories: {
              title: "Explore by Category",
              subtitle: "Find the right equipment for your adventure"
            },
            testimonials: {
              title: "Trusted by Global Travelers",
              subtitle: "See what our community says about PIRA experience",
              reviews: [
                {
                  name: "Mai Hoang",
                  location: "Ho Chi Minh",
                  text: "PIRA made my trip amazing! Easy rental process, supportive owners."
                },
                {
                  name: "Nguyen Van A",
                  location: "Hanoi",
                  text: "Excellent service, high-quality equipment. Will use PIRA again."
                },
                {
                  name: "Tran Thi B",
                  location: "Da Nang",
                  text: "User-friendly interface, secure payments. Very satisfied with the experience."
                }
              ]
            },
            reviewsBadge: "REVIEWS",
            perDay: "/day",
            na: "N/A",
            cta: {
              badge: "GET STARTED TODAY",
              title: "Ready to Start Your Adventure?",
              subtitle: "Join PIRA today and explore a world of possibilities with thousands of quality equipment.",
              findEquipment: "Find Equipment Now",
              rentOut: "Rent Out Equipment",
              stats: {
                travelers: "10,000+ Travelers",
                equipment: "5,000+ Equipment",
                rating: "4.9★ Rating"
              }
            }
          }
        }
      },
      vi: {
        translation: {
          nav: {
            home: 'Trang Chủ',
            products: 'Sản Phẩm',
            cart: 'Giỏ Hàng',
            wishlist: 'Yêu Thích',
            orders: 'Đơn Hàng',
            chat: 'Tin Nhắn',
            wallet: 'Ví',
            rental: 'Cho Thuê'
          },
          auth: {
            login: 'Đăng Nhập',
            register: 'Đăng Ký',
            logout: 'Đăng Xuất'
          },
          orders: {
            title: 'Quản lý đơn thuê',
            subtitle: 'Theo dõi và quản lý các đơn hàng thuê của bạn',
            reload: 'Reload',
            rentProduct: 'Thuê sản phẩm',
            createOrder: 'Tạo đơn mới',
            myOrders: 'Đơn thuê của tôi',
            searchPlaceholder: 'Tìm kiếm đơn hàng...',
            allStatus: 'Tất cả trạng thái',
            status: {
              DRAFT: 'Nháp',
              PENDING_PAYMENT: 'Chờ thanh toán',
              PAYMENT_COMPLETED: 'Đã thanh toán',
              PENDING_CONFIRMATION: 'Chờ xác nhận',
              PENDING_OWNER_CONFIRMATION: 'Chờ chủ xác nhận',
              OWNER_CONFIRMED: 'Chủ đã xác nhận',
              OWNER_REJECTED: 'Chủ từ chối',
              READY_FOR_CONTRACT: 'Sẵn sàng ký HĐ',
              CONTRACT_SIGNED: 'Đã ký HĐ',
              ACTIVE: 'Đang thuê',
              COMPLETED: 'Hoàn thành',
              CANCELLED: 'Đã hủy'
            },
            noOrders: 'Chưa có đơn hàng nào',
            noOrdersDesc: 'Bạn chưa có đơn thuê nào. Hãy tạo đơn thuê đầu tiên!',
            viewProducts: 'Xem sản phẩm',
            notFound: 'Không tìm thấy đơn hàng nào',
            createdAt: 'Tạo ngày',
            rentalTime: 'Thời gian thuê',
            days: 'ngày',
            productCount: 'Số sản phẩm',
            delivery: 'Giao hàng',
            deliveryPickup: 'Nhận trực tiếp',
            deliveryShip: 'Giao tận nơi',
            total: 'Tổng tiền',
            updateAt: 'Cập nhật lúc',
            viewDetail: 'Xem chi tiết',
            signContract: 'Ký HĐ',
            prev: 'Trước',
            next: 'Sau',
            page: 'Trang',
            of: '/',
            owner: 'Chủ thuê',
            ownerUnknown: 'Không rõ',
            ownerDetail: 'Chi tiết chủ thuê',
            product: 'Sản phẩm',
            quantity: 'Số lượng',
            price: 'Giá thuê',
            deposit: 'Cọc',
            shippingFee: 'Phí vận chuyển',
            totalRental: 'Tổng tiền thuê',
            totalDeposit: 'Tổng tiền cọc',
            totalAmount: 'Tổng thanh toán',
            paymentMethod: 'Phương thức thanh toán',
            paymentWallet: 'Ví điện tử',
            paymentBank: 'Chuyển khoản',
            paymentCOD: 'Thanh toán khi nhận hàng',
            close: 'Đóng',
            contract: 'Hợp đồng',
            ownerNameUnknown: 'Không rõ tên',
            notLoggedIn: 'Vui lòng đăng nhập',
            loginToView: 'Bạn cần đăng nhập để xem đơn hàng',
            login: 'Đăng nhập'
          },
          owner: {
            menu: {
              title: 'Quản Lý Cho Thuê',
              description: 'Tất cả tính năng dành cho chủ sản phẩm',
              myProducts: {
                label: 'Sản Phẩm Của Tôi',
                description: 'Quản lý sản phẩm cho thuê'
              },
              addProduct: {
                label: 'Đăng Sản Phẩm Mới', 
                description: 'Tạo sản phẩm cho thuê'
              },
              rentalRequests: {
                label: 'Yêu Cầu Thuê',
                description: 'Quản lý yêu cầu thuê sản phẩm'
              },
              analytics: {
                label: 'Thống Kê',
                description: 'Xem doanh thu và báo cáo',
                comingSoon: 'Sắp có'
              },
              tip: 'Mẹo: Đăng nhiều sản phẩm để tăng thu nhập!'
            }
          },
          home: {
            hero: {
              title: "Cuộc Phiêu Lưu Đang Chờ!",
              subtitle: "Thuê Thiết Bị Du Lịch Ngay",
              description: "Khám phá, Ghi lại, Chia sẻ. Truy cập thiết bị du lịch cao cấp từ những người địa phương đáng tin cậy.",
              trusted: "Được tin tưởng bởi 10.000+ khách hàng",
              searchButton: "Tìm Thiết Bị Ngay",
              rentButton: "Cho Thuê Đồ"
            },
            promotion: {
              tiers: {
                1: 'Cao Cấp',
                2: 'Vàng',
                3: 'Bạc',
                4: 'Đồng',
                5: 'Cơ Bản',
                featured: 'Nổi Bật'
              }
            },
            whyChoosePira: {
              title: "Tại Sao Chọn PIRA?",
              subtitle: "Tham gia cùng hàng nghìn du khách tin tưởng PIRA cho nhu cầu thuê thiết bị",
              cards: {
                variety: {
                  title: "Lựa Chọn Đa Dạng",
                  desc: "Từ máy ảnh, đồ cắm trại đến thiết bị chuyên dụng, tất cả đều sẵn trong khu vực của bạn."
                },
                safety: {
                  title: "Giao Dịch An Toàn",
                  desc: "Thanh toán bảo mật, xác minh và bảo hiểm toàn diện đảm bảo sự yên tâm."
                },
                community: {
                  title: "Cộng Đồng Tin Cậy",
                  desc: "Đánh giá đã xác minh, xếp hạng người dùng và cộng đồng hỗ trợ."
                }
              }
            },
            categories: {
              camera: "Máy Ảnh",
              backpack: "Balo",
              tent: "Lều Trại",
              vali: "Vali",
              flycam: "Flycam",
              gps: "GPS"
            },
            features: {
              rating: "4.9/5 đánh giá",
              safety: "Thanh toán an toàn",
              support: "Hỗ trợ 24/7"
            }
          },
          product: {
            search: {
              placeholder: "Tìm kiếm thiết bị du lịch..."
            },
            status: {
              available: "Còn trống",
              rented: "Đã cho thuê",
              pending: "Đang chờ"
            },
            actions: {
              addToCart: "Thêm vào giỏ",
              rentNow: "Thuê ngay",
              contactOwner: "Liên hệ chủ sở hữu"
            }
          },
          common: {
            loading: {
              general: "Đang tải...",
              products: "Đang tải sản phẩm..."
            },
            error: {
              general: "Đã xảy ra lỗi",
              products: "Không thể tải sản phẩm nổi bật"
            },
            success: "Thành công",
            cancel: "Hủy",
            save: "Lưu",
            delete: "Xóa",
            edit: "Sửa",
            view: "Xem",
            close: "Đóng",
            confirm: "Xác nhận",
            retry: "Thử lại",
            viewAll: "Xem tất cả sản phẩm",
            noProducts: {
              title: "Chưa có sản phẩm",
              message: "Hiện tại chưa có sản phẩm nào. Vui lòng quay lại sau!"
            },
            featuredProducts: {
              title: "Thiết Bị Nổi Bật",
              subtitle: "Top 10 thiết bị được quảng bá - Chất lượng đã xác minh",
              newProducts: "Khám phá các thiết bị du lịch mới nhất",
              badgePromoted: "TOP QUẢNG BÁ",
              badgeNew: "SẢN PHẨM MỚI"
            },
            exploreCategories: {
              title: "Khám Phá Theo Danh Mục",
              subtitle: "Tìm thiết bị phù hợp cho chuyến phiêu lưu của bạn"
            },
            testimonials: {
              title: "Được Tin Tưởng Bởi Du Khách Toàn Cầu",
              subtitle: "Xem cộng đồng của chúng tôi nói gì về trải nghiệm PIRA",
              reviews: [
                {
                  name: "Mai Hoàng",
                  location: "Hồ Chí Minh",
                  text: "PIRA đã làm cho chuyến du lịch của tôi trở nên tuyệt vời! Thuê dễ, chủ sở hữu hỗ trợ."
                },
                {
                  name: "Nguyễn Văn A",
                  location: "Hà Nội",
                  text: "Dịch vụ tuyệt vời, thiết bị chất lượng cao. Sẽ quay lại sử dụng PIRA."
                },
                {
                  name: "Trần Thị B",
                  location: "Đà Nẵng",
                  text: "Giao diện dễ sử dụng, thanh toán an toàn. Rất hài lòng với trải nghiệm."
                }
              ]
            },
            reviewsBadge: "ĐÁNH GIÁ",
            perDay: "/ngày",
            na: "N/A",
            cta: {
              badge: "BẮT ĐẦU NGAY HÔM NAY",
              title: "Sẵn Sàng Bắt Đầu Cuộc Phiêu Lưu?",
              subtitle: "Tham gia PIRA ngay hôm nay và khám phá thế giới khả năng với hàng ngàn thiết bị chất lượng.",
              findEquipment: "Tìm Thiết Bị Ngay",
              rentOut: "Cho Thuê Đồ",
              stats: {
                travelers: "10,000+ Du khách",
                equipment: "5,000+ Thiết bị",
                rating: "4.9★ Đánh giá"
              }
            }
          }
        }
      }
    },
    lng: 'vi', // Default language
    fallbackLng: 'vi',
    // Allow returning objects/arrays from translation keys (used for testimonials)
    returnObjects: true,
    interpolation: {
      escapeValue: false
    }
  });

// Add extra translation keys (footer, language labels)
  i18n.addResourceBundle('en', 'translation', {
    footer: {
      brand: { description: 'Trusted platform for renting travel equipment. Explore the world with high-quality gear from the local community.' },
      renters: 'For Renters',
      owners: 'For Owners',
      company: 'Company',
      links: {
        renters: ['Device Approval', 'How It Works', 'Safety & Insurance', 'Customer Support', 'FAQ'],
        owners: ['List Device', 'Order Management', 'Income & Payments', 'Device Insurance', 'Owner Center'],
        company: ['About Us', 'Contact', 'Blog & News', 'Privacy Policy', 'Terms of Service']
      },
      contact: { email: 'support@pira.vn', phone: '1900 1234' },
      bottom: { privacy: 'Privacy Policy', terms: 'Terms', sitemap: 'Sitemap', copyright: '© 2024 PIRA. All rights reserved.' }
    },
    common: { language: { en: 'English', vi: 'Tiếng Việt' } }
  }, true, true);

  i18n.addResourceBundle('vi', 'translation', {
    footer: {
      brand: { description: 'Nền tảng tin cậy cho thuê thiết bị du lịch. Khám phá thế giới với thiết bị chất lượng cao từ cộng đồng địa phương.' },
      renters: 'Cho Người Thuê',
      owners: 'Cho Chủ Thiết Bị',
      company: 'Công Ty',
      links: {
        renters: ['Duyệt Thiết Bị', 'Cách Hoạt Động', 'An Toàn & Bảo Hiểm', 'Hỗ Trợ Khách Hàng', 'Câu Hỏi Thường Gặp'],
        owners: ['Đăng Thiết Bị', 'Quản Lý Đơn Hàng', 'Thu Nhập & Thanh Toán', 'Bảo Hiểm Thiết Bị', 'Trung Tâm Chủ Sở Hữu'],
        company: ['Về Chúng Tôi', 'Liên Hệ', 'Blog & Tin Tức', 'Chính Sách Bảo Mật', 'Điều Khoản Dịch Vụ']
      },
      contact: { email: 'support@pira.vn', phone: '1900 1234' },
      bottom: { privacy: 'Chính Sách Bảo Mật', terms: 'Điều Khoản', sitemap: 'Sitemap', copyright: '© 2024 PIRA. Tất cả quyền được bảo lưu.' }
    },
    common: { language: { en: 'English', vi: 'Tiếng Việt' } }
  }, true, true);

// Handle language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  console.log('Language changed to:', lng);
});

// Initialize language from localStorage
const savedLang = localStorage.getItem('i18nextLng');
if (savedLang) {
  i18n.changeLanguage(savedLang);
}

export default i18n;