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
            loading: "Loading...",
            error: "Something went wrong",
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
            footer: {
              forRenters: {
                title: "For Renters",
                browseEquipment: "Browse Equipment",
                howItWorks: "How It Works",
                description: "Enhance your travel experience with quality equipment from local community."
              },
              forOwners: {
                title: "For Equipment Owners",
                listEquipment: "List Equipment",
                safety: "Safety & Insurance",
                customerSupport: "Customer Support",
                ownerCenter: "Owner Center",
                faq: "FAQ"
              },
              company: {
                title: "Company",
                aboutUs: "About Us",
                customerService: "Customer Service",
                paymentInfo: "Payment & Income",
                blog: "Blog & News",
                privacy: "Privacy Policy",
                terms: "Terms of Service",
                sitemap: "Sitemap"
              },
              contact: {
                email: "support@pira.vn",
                phone: "1900 1234"
              },
              copyright: "© 2024 PIRA. All rights reserved."
            },
            loading: {
              products: "Loading products..."
            },
            error: {
              products: "Could not load featured products"
            },
            featuredProducts: {
              title: "Featured Equipment",
              subtitle: "Top 10 promoted items - Quality verified",
              newProducts: "Discover our latest travel equipment"
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
            cta: {
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
            loading: "Đang tải...",
            error: "Đã xảy ra lỗi",
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
            footer: {
              forRenters: {
                title: "Cho Người Thuê",
                browseEquipment: "Duyệt Thiết Bị",
                howItWorks: "Cách Hoạt Động",
                description: "Nên tăng trải nghiệm cho thuê thiết bị du lịch. Khám phá thế giới với thiết bị chất lượng cao từ cộng đồng địa phương."
              },
              forOwners: {
                title: "Cho Chủ Thiết Bị",
                listEquipment: "Đăng Thiết Bị",
                safety: "An Toàn & Bảo Hiểm",
                customerSupport: "Hỗ Trợ Khách Hàng",
                ownerCenter: "Trung Tâm Chủ Sở Hữu",
                faq: "Câu Hỏi Thường Gặp"
              },
              company: {
                title: "Công Ty",
                aboutUs: "Về Chúng Tôi",
                customerService: "Quản Lý Đơn Hàng",
                paymentInfo: "Thu Nhập & Thanh Toán",
                blog: "Blog & Tin Tức",
                privacy: "Chính Sách Bảo Mật",
                terms: "Điều Khoản Dịch Vụ",
                sitemap: "Sitemap"
              },
              contact: {
                email: "support@pira.vn",
                phone: "1900 1234"
              },
              copyright: "© 2024 PIRA. Tất cả quyền được bảo lưu."
            },
            loading: {
              products: "Đang tải sản phẩm..."
            },
            error: {
              products: "Không thể tải sản phẩm nổi bật"
            },
            featuredProducts: {
              title: "Thiết Bị Nổi Bật",
              subtitle: "Top 10 thiết bị được quảng bá - Chất lượng đã xác minh",
              newProducts: "Khám phá các thiết bị du lịch mới nhất"
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
            cta: {
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
    interpolation: {
      escapeValue: false
    }
  });

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