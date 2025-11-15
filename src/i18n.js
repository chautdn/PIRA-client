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
          profile: {
            edit: 'Edit Profile',
            messages: {
              loading: 'Loading profile...',
              fetchError: 'Failed to load profile',
              updateSuccess: 'Profile updated successfully'
            },
            avatar: {
              fileTooLarge: 'File too large',
              invalidFormat: 'Invalid file format',
              uploadSuccess: 'Avatar uploaded successfully',
              uploadError: 'Failed to upload avatar',
              choose: 'Choose Image',
              fileSize: 'Max file size: 5MB',
              formats: 'Formats: JPG, PNG'
            },
            kyc: {
              title: 'Identity Verification (KYC)',
              emailVerification: 'Email Verification',
              emailDesc: 'Verify your email address',
              modalTitle: 'Identity Verification (KYC)',
              emailVerified: 'Verified',
              emailNotVerified: 'Not Verified',
              viewInfo: 'View KYC Info',
              verifyNow: 'Verify Now',
              kycDescVerified: 'Your identity has been verified',
              kycDescNotVerified: 'Verify your identity to unlock features',
              statusVerified: 'Verified',
              statusPending: 'Pending',
              statusNotVerified: 'Not Verified',
              successVerified: 'Identity verified successfully',
              successUpdate: 'KYC information updated'
            },
            menu: {
              notifications: 'Notifications',
              account: 'Account',
              profile: 'Profile',
              address: 'Address',
              password: 'Password',
              verification: 'Verification',
              banking: 'Banking',
              orders: 'Orders',
              vouchers: 'Vouchers'
            },
            header: {
              profileTitle: 'My Profile',
              addressTitle: 'Address Information',
              verificationTitle: 'Verification',
              passwordTitle: 'Change Password',
              bankingTitle: 'Banking Information',
              profileDesc: 'Update your personal information',
              addressDesc: 'Manage your addresses',
              verificationDesc: 'Verify your account',
              passwordDesc: 'Change your password',
              bankingDesc: 'Manage your banking information'
            },
            fields: {
              firstName: 'First Name',
              lastName: 'Last Name',
              name: 'Full Name',
              email: 'Email',
              phone: 'Phone',
              dob: 'Date of Birth',
              gender: 'Gender',
              address: 'Address',
              district: 'District',
              city: 'City',
              province: 'Province',
              streetAddress: 'Street Address',
              change: 'Change',
              notUpdated: 'Not Updated',
              save: 'Save Changes',
              cancel: 'Cancel'
            },
            placeholders: {
              enterName: 'Enter full name',
              enterPhone: 'Enter phone number'
            }
            ,
            address: {
              saveButton: 'Save Address'
            },
            placeholders: {
              streetAddress: 'House number, street',
              district: 'District',
              city: 'City',
              province: 'Province'
            },
            password: {
              currentLabel: 'Current Password',
              newLabel: 'New Password',
              confirmLabel: 'Confirm New Password',
              placeholderCurrent: 'Enter current password',
              placeholderNew: 'Enter new password',
              placeholderConfirm: 'Re-enter new password',
              updateButton: 'Update Password'
            },
            bank: {
              fetchError: 'Could not load bank account information',
              addSuccess: 'Bank account added successfully',
              updateSuccess: 'Bank account updated successfully',
              deleteSuccess: 'Bank account deleted',
              deleteError: 'Could not delete bank account',
              verified: 'Verified',
              accountNumberLabel: 'Account Number',
              accountHolderLabel: 'Account Holder',
              addedOn: 'Added on: {{date}}',
              editButton: 'Edit Bank Account',
              deleteButton: 'Delete',
              cancelButton: 'Cancel',
              importantNoteTitle: 'Important Note:',
              importantNote: 'This bank account will be used for withdrawals. Please ensure information is correct to avoid delays.',
              confirmDeleteTitle: 'Confirm delete bank account',
              confirmDeleteDesc: 'Are you sure you want to delete this bank account? You will not be able to withdraw until you add a new account.'
            },
            security: {
              title: 'Security Level',
              completion: 'Completion: {{count}}/2',
              helpText: 'Improve your account security by verifying your identity and connecting your bank account.',
              completeMessage: 'Your profile security is complete'
            },
          },
          cart: {
            title: 'Shopping Cart',
            empty: {
              title: 'Your Cart is Empty',
              message: "You don't have any products in your cart yet. Explore our products!",
              browseButton: 'Explore Products'
            },
            summary: 'You have {{count}} product in your cart',
            items: 'Products ({{count}})',
            subtotal: 'Subtotal',
            platformFee: 'Platform Fee',
            platformFeeNote: '(5% for regular products, 10% for premium products)',
            discount: 'Discount',
            total: 'Total',
            createOrder: '📋 Create Rental Order',
            checkout: '🚀 Proceed to Checkout',
            continueShopping: '← Continue Shopping',
            removeAll: 'Remove All',
            confirmRemove: 'Are you sure you want to remove all items from your cart?',
            quantity: 'Quantity',
            maxQuantity: 'Max: {{quantity}} items',
            decreaseQuantity: 'Decrease quantity',
            increaseQuantity: 'Increase quantity (max: {{quantity}})',
            removeItem: 'Remove product',
            pricePerDay: '/day',
            rentalDuration: 'Rental Duration',
            rentalDates: 'Rental Period',
            days: 'days',
            security: {
              secure: '🔒 100% Secure Payment',
              support: '✓ 24/7 Support',
              shipping: '🚚 Free Shipping'
            }
          },
          wishlist: {
            title: 'Wishlist',
            empty: 'You have not added any products to your wishlist.',
            loading: 'Loading...',
            view: 'View',
            remove: 'Remove',
            removeError: 'Error removing product from wishlist!',
            productLabel: 'Product #'
          },
          chat: {
            title: 'Messages',
            selectConversation: 'Select a conversation to start chatting',
            connecting: 'Connecting to chat...',
            connected: 'Connected',
            disconnected: 'Disconnected',
            noConversations: 'No conversations yet',
            startChatting: 'Start chatting by messaging other users',
            conversation: 'conversation',
            conversations: 'conversations',
            noMessagesYet: 'No messages yet',
            noPreviewAvailable: 'No preview available',
            image: '📷 Image',
            typeMessage: 'Type your message...',
            send: 'Send',
            loading: 'Loading...',
            error: 'Error loading conversations',
            unknownUser: 'Unknown User'
          },
          productList: {
            title: 'Explore Travel Equipment',
            subtitle: 'Rent the best gear for your trip',
            searchPlaceholder: 'Search travel equipment...',
            sortOptions: {
              createdAt_desc: 'Newest',
              price_asc: 'Price: Low to High',
              price_desc: 'Price: High to Low',
              rating_desc: 'Top Rated'
            },
            foundProducts: 'Found {{count}} products',
            filters: {
              title: 'Filters',
              allCategories: 'All Categories',
              priceRanges: {
                under100k: 'Under 100k',
                '100k_500k': '100k - 500k',
                '500k_1m': '500k - 1M',
                over1m: 'Over 1M'
              },
              categories: 'Categories',
              priceTitle: 'Price Range',
              districtTitle: 'District',
              conditionTitle: 'Condition',
              districts: {
                all: 'All Areas',
                '': 'All Areas',
                'hai-chau': 'Hai Chau',
                'thanh-khe': 'Thanh Khe',
                'son-tra': 'Son Tra',
                'ngu-hanh-son': 'Ngu Hanh Son',
                'lien-chieu': 'Lien Chieu',
                'cam-le': 'Cam Le'
              },
              conditions: {
                all: 'All Conditions',
                '': 'All Conditions',
                new: 'New',
                'like-new': 'Like New',
                good: 'Good',
                fair: 'Fair'
              },
              clearAll: 'Clear all filters',
              price: { from: 'From', to: 'To' }
            },
            categories: {
              travel: 'Travel Equipment',
              accessories: 'Travel Accessories',
              electronics: 'Electronics',
              sports: 'Sports Equipment',
              luggage: 'Luggage & Bags',
              camping: 'Camping Gear',
              camera: 'Camera',
              film: 'Film',
              home: 'Home Appliances',
              other: 'Other'
            },
            categoryNames: {
              travel: 'Travel Equipment',
              camera: 'Camera',
              film: 'Film',
              'Máy ảnh & Quay phim': 'Camera & Film',
              camping: 'Camping Gear',
              luggage: 'Luggage & Bags',
              sports: 'Sports Equipment',
              accessories: 'Travel Accessories',
              electronics: 'Electronics',
              home: 'Home Appliances',
              other: 'Other'
            },
            error: {
              loadFailed: 'Could not load categories or products'
            },
            noProductsTitle: 'No products found',
            noProductsDesc: 'Try changing filters or keywords',
            pagination: { previous: 'Previous', next: 'Next' }
          },
          wallet: {
            topUp: {
              title: 'Top Up Wallet',
              subtitle: 'Add funds to your account',
              tabs: { quick: 'Quick Amounts', custom: 'Custom Amount' },
              chooseQuick: 'Choose a quick amount to get started:',
              currency: 'VND',
              enterAmountLabel: 'Enter Amount (VND)',
              placeholderEnterAmount: 'Enter amount...',
              minLabel: 'Min',
              maxLabel: 'Max',
              topUpNow: 'Top Up Now',
              redirecting: 'Redirecting to payment...',
              processing: 'Processing...',
              securedBy: 'Secured by PayOS',
              instantProcessing: 'Instant processing'
            },
            transactionHistory: {
              title: 'Transaction History',
              subtitle: 'View all your wallet transactions',
              loadingTransactions: 'Loading transactions...',
              pleaseWait: 'Please wait',
              noTransactions: 'No transactions yet',
              transactionWillAppear: 'Your transaction history will appear here',
              close: 'Close',
              topUp: '💰 Top Up',
              deposit: 'Deposit',
              withdrawal: 'Withdrawal',
              success: 'Success',
              failed: 'Failed',
              pending: 'Pending',
              processing: 'Processing',
              walletTransaction: 'Wallet transaction',
              vnd: 'VND',
              status: 'Status'
            },
            balance: {
              label: 'Balance',
              currentBalance: 'Current Balance',
              topUp: 'Top Up',
              viewAllTransactions: 'View all transactions'
            },
            user: {
              profile: 'Profile',
              myProducts: 'My Products',
              myBookings: 'My Bookings',
              withdrawals: 'Withdrawals',
              settings: 'Settings',
              logout: 'Logout',
              loggingOut: 'Logging out...'
            }
            ,
            withdrawals: {
              title: 'Withdrawals',
              subtitle: 'Withdraw funds from your PIRA wallet to your bank account',
              beforeTitle: 'Before You Can Withdraw',
              step1: {
                title: 'Step 1: Complete KYC Verification',
                verified: '✓ Your identity has been verified',
                notVerified: 'Verify your identity to unlock withdrawals',
                button: 'Complete KYC Verification →'
              },
              step2: {
                title: 'Step 2: Add Bank Account',
                bankInfo: '✓ {{bankName}} - {{accountNumber}}',
                noBankKycVerified: 'Link your Vietnamese bank account for withdrawals',
                noBankKycNotVerified: 'Complete KYC verification first',
                addButton: 'Add Bank Account →',
                editButton: 'Edit Bank Account'
              },
              ready: "You're all set! You can now request withdrawals.",
              historyTitle: 'Withdrawal History',
              requestButton: 'Request Withdrawal',
              noWithdrawalsTitle: 'No withdrawals yet',
              noWithdrawalsDescReady: 'Click "Request Withdrawal" to get started',
              noWithdrawalsDescNotReady: 'Complete the steps above to start withdrawing'
            }
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
            },
            rentalRequests: {
              title: 'Rental Requests',
              filters: {
                all: 'All',
                pending: 'Pending',
                confirmed: 'Confirmed',
                rejected: 'Rejected'
              },
              noRequests: 'No rental requests',
              noRequestsDesc: 'You currently have no rental requests.'
            },
            createProduct: {
              title: 'Create Product',
              subtitle: 'List your product to start earning',
              description: 'Provide details and photos to create a listing.',
              pageTitle: 'Create Product',
              loading: 'Loading...',
              cccdError: 'Please complete ID verification to proceed',
              bankError: 'Please verify your bank account',
              checkError: 'Please check required fields before creating product',
              badge: 'New Listing',
              features: {
                aiVerification: 'AI Verification',
                fastListing: 'Fast Listing',
                stableIncome: 'Stable Income'
              },
              requirementsTitle: 'Requirements',
              requirementsDesc: 'Please complete the following before listing.',
              cccdVerification: 'ID Verification (CCCD)',
              cccdVerified: 'Verified',
              cccdVerifiedDesc: 'Your ID has been verified',
              cccdNotVerified: 'Your ID is not verified yet.',
              verifyNow: 'Verify Now',
              breadcrumb: {
                dashboard: 'Dashboard',
                products: 'Products',
                create: 'Create'
              },
              bankVerification: 'Bank Verification',
              bankVerified: 'Bank Account Verified',
              bankVerifiedDesc: 'Your bank account is verified and ready for payouts',
              bankNotVerified: 'Your bank account is not linked or verified.',
              bankButton: 'Save Wallet',
              whyVerify: 'Why Verify?',
              createProductGuide: 'Guide to create and optimize your product listing',
              helpSection: {
                aiVerification: { title: 'AI Verification', desc: 'Use AI to validate key product attributes and speed listing.' },
                pricingTips: { title: 'Pricing Tips', desc: 'Set competitive rental prices to increase bookings.' },
                photoGuide: { title: 'Photo Guide', desc: 'Upload clear photos showing product details and condition.' }
              },
              successTips: 'Success Tips',
              tips: {
                detailedDesc: 'Provide detailed descriptions',
                quickResponse: 'Respond quickly to inquiries',
                correctCategory: 'Choose the correct category'
              },
              cta: {
                title: 'Ready to List?',
                subtitle: 'Follow the guide and publish your first listing',
                support: 'Support',
                watchGuide: 'Watch Guide'
              }
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
            support: 'Support',
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
          cart: {
            title: 'Giỏ Hàng',
            empty: {
              title: 'Giỏ Hàng Trống',
              message: 'Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm của chúng tôi!',
              browseButton: 'Khám Phá Sản Phẩm'
            },
            summary: 'Bạn có {{count}} sản phẩm trong giỏ hàng',
            items: 'Sản Phẩm ({{count}})',
            subtotal: 'Tạm tính',
            platformFee: 'Phí nền tảng',
            platformFeeNote: '(5% cho sản phẩm thường, 10% cho sản phẩm cao cấp)',
            discount: 'Giảm giá',
            total: 'Tổng cộng',
            createOrder: '📋 Tạo Đơn Thuê',
            checkout: '🚀 Tiến Hành Thanh Toán',
            continueShopping: '← Tiếp Tục Mua Sắm',
            removeAll: 'Xóa Tất Cả',
            confirmRemove: 'Bạn có chắc muốn xóa toàn bộ giỏ hàng?',
            quantity: 'Số lượng',
            maxQuantity: 'Tối đa: {{quantity}} cái',
            decreaseQuantity: 'Giảm số lượng',
            increaseQuantity: 'Tăng số lượng (tối đa: {{quantity}})',
            removeItem: 'Xóa sản phẩm',
            pricePerDay: '/ngày',
            rentalDuration: 'Thời gian thuê',
            rentalDates: 'Khoảng thời gian thuê',
            days: 'ngày',
            security: {
              secure: '🔒 Thanh toán bảo mật 100%',
              support: '✓ Hỗ trợ 24/7',
              shipping: '🚚 Miễn phí vận chuyển'
            }
          },
          wishlist: {
            title: 'Danh sách yêu thích',
            empty: 'Bạn chưa thêm sản phẩm nào vào wishlist.',
            loading: 'Đang tải...',
            view: 'Xem',
            remove: 'Xóa',
            removeError: 'Có lỗi khi xóa sản phẩm khỏi wishlist!',
            productLabel: 'Sản phẩm #'
          },
          chat: {
            title: 'Tin Nhắn',
            selectConversation: 'Chọn một cuộc trò chuyện để bắt đầu',
            connecting: 'Đang kết nối...',
            connected: 'Đã kết nối',
            disconnected: 'Mất kết nối',
            noConversations: 'Chưa có cuộc trò chuyện nào',
            startChatting: 'Bắt đầu nhắn tin bằng cách nhắn cho những người dùng khác',
            conversation: 'cuộc trò chuyện',
            conversations: 'cuộc trò chuyện',
            noMessagesYet: 'Chưa có tin nhắn nào',
            noPreviewAvailable: 'Không có bản xem trước',
            image: '📷 Hình ảnh',
            typeMessage: 'Gõ tin nhắn của bạn...',
            send: 'Gửi',
            loading: 'Đang tải...',
            error: 'Lỗi tải cuộc trò chuyện',
            unknownUser: 'Người dùng không xác định'
          },
          productList: {
            title: 'Khám Phá Thiết Bị Du Lịch',
            subtitle: 'Thuê những thiết bị tốt nhất cho chuyến đi của bạn',
            searchPlaceholder: 'Tìm kiếm thiết bị du lịch...',
            sortOptions: {
              createdAt_desc: 'Mới nhất',
              price_asc: 'Giá thấp đến cao',
              price_desc: 'Giá cao đến thấp',
              rating_desc: 'Đánh giá cao nhất'
            },
            foundProducts: 'Tìm thấy {{count}} sản phẩm',
            filters: {
              title: 'Bộ lọc',
              allCategories: 'Tất cả danh mục',
              priceRanges: {
                under100k: 'Dưới 100k',
                '100k_500k': '100k - 500k',
                '500k_1m': '500k - 1tr',
                over1m: 'Trên 1tr'
              },
              categories: 'Danh Mục',
              priceTitle: 'Khoảng Giá',
              districtTitle: 'Khu Vực',
              conditionTitle: 'Tình Trạng',
              districts: {
                all: 'Tất cả khu vực',
                '': 'Tất cả khu vực',
                'hai-chau': 'Hải Châu',
                'thanh-khe': 'Thanh Khê',
                'son-tra': 'Sơn Trà',
                'ngu-hanh-son': 'Ngũ Hành Sơn',
                'lien-chieu': 'Liên Chiểu',
                'cam-le': 'Cẩm Lệ'
              },
              conditions: {
                '': 'Tất cả tình trạng',
                new: 'Mới',
                'like-new': 'Như mới',
                good: 'Tốt',
                fair: 'Khá'
              },
              clearAll: 'Xóa tất cả bộ lọc',
              price: { from: 'Từ', to: 'Đến' }
            },
            categories: {
              travel: 'Thiết Bị Du Lịch',
              accessories: 'Phụ kiện du lịch',
              electronics: 'Đồ điện tử',
              sports: 'Thiết bị thể thao',
              luggage: 'Vali & Túi xách',
              camping: 'Thiết bị cắm trại',
              camera: 'Máy ảnh',
              film: 'Quay Phim',
              home: 'Đồ gia dụng',
              other: 'Khác'
            },
            categoryNames: {
              travel: 'Thiết Bị Du Lịch',
              camera: 'Máy ảnh',
              film: 'Quay Phim',
              camping: 'Thiết bị cắm trại',
              luggage: 'Vali & Túi xách',
              sports: 'Thiết bị thể thao',
              accessories: 'Phụ kiện du lịch',
              electronics: 'Đồ điện tử',
              home: 'Đồ gia dụng',
              other: 'Khác'
            },
            error: {
              loadFailed: 'Không tải được danh sách sản phẩm hoặc danh mục'
            },
            noProductsTitle: 'Không tìm thấy sản phẩm',
            noProductsDesc: 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm',
            pagination: { previous: 'Trước', next: 'Sau' }
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
            ,
            rentalRequests: {
              title: 'Yêu Cầu Thuê',
              filters: {
                all: 'Tất cả',
                pending: 'Đang chờ',
                confirmed: 'Đã xác nhận',
                rejected: 'Đã từ chối'
              },
              noRequests: 'Chưa có yêu cầu thuê',
              noRequestsDesc: 'Hiện tại bạn chưa có yêu cầu thuê nào.'
            },
            createProduct: {
              title: 'Tạo Sản Phẩm',
              subtitle: 'Đăng sản phẩm để bắt đầu kiếm tiền',
              description: 'Cung cấp thông tin và ảnh để tạo danh sách sản phẩm.',
              pageTitle: 'Tạo Sản Phẩm',
              loading: 'Đang tải...',
              cccdError: 'Vui lòng hoàn tất xác thực CCCD để tiếp tục',
              bankError: 'Vui lòng xác thực tài khoản ngân hàng của bạn',
              checkError: 'Vui lòng kiểm tra các trường bắt buộc trước khi tạo sản phẩm',
              badge: 'Mới',
              features: {
                aiVerification: 'Xác thực AI',
                fastListing: 'Đăng nhanh',
                stableIncome: 'Thu nhập ổn định'
              },
              requirementsTitle: 'Yêu Cầu',
              requirementsDesc: 'Vui lòng hoàn thành các mục sau trước khi đăng.',
              cccdVerification: 'Xác thực CCCD',
              cccdVerified: 'Đã xác thực',
              cccdVerifiedDesc: 'CCCD của bạn đã được xác thực',
              cccdNotVerified: 'Bạn chưa xác thực CCCD.',
              verifyNow: 'Xác thực ngay',
              breadcrumb: {
                dashboard: 'Bảng điều khiển',
                products: 'Sản phẩm',
                create: 'Tạo'
              },
              bankVerification: 'Xác thực Tài Khoản Ngân Hàng',
              bankVerified: 'Tài khoản ngân hàng đã được xác thực',
              bankVerifiedDesc: 'Tài khoản ngân hàng của bạn đã được xác thực và sẵn sàng cho thanh toán',
              bankNotVerified: 'Tài khoản ngân hàng của bạn chưa được liên kết hoặc xác thực.',
              bankButton: 'Ví Lưu',
              whyVerify: 'Tại sao xác thực?',
              createProductGuide: 'Hướng dẫn tạo và tối ưu danh sách sản phẩm',
              helpSection: {
                aiVerification: { title: 'Xác thực AI', desc: 'Sử dụng AI để xác thực thuộc tính chính của sản phẩm và tăng tốc đăng bài.' },
                pricingTips: { title: 'Mẹo Định Giá', desc: 'Đặt giá thuê cạnh tranh để tăng lượt đặt.' },
                photoGuide: { title: 'Hướng Dẫn Ảnh', desc: 'Tải ảnh rõ nét thể hiện chi tiết và tình trạng sản phẩm.' }
              },
              successTips: 'Mẹo Thành Công',
              tips: {
                detailedDesc: 'Cung cấp mô tả chi tiết',
                quickResponse: 'Phản hồi nhanh các yêu cầu',
                correctCategory: 'Chọn đúng danh mục'
              },
              cta: {
                title: 'Sẵn sàng đăng?',
                subtitle: 'Làm theo hướng dẫn và xuất bản danh sách của bạn',
                support: 'Hỗ trợ',
                watchGuide: 'Xem hướng dẫn'
              }
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
    common: { language: { en: 'English', vi: 'Tiếng Việt' }, support: 'Support' }
  }, true, true);

  // ensure common support in Vietnamese footer bundle area if not present

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
    auth: {
      login: 'Đăng Nhập',
      register: 'Đăng Ký',
      logout: 'Đăng Xuất'
    },
    profile: {
      edit: 'Chỉnh Sửa Hồ Sơ',
      messages: {
        loading: 'Đang tải hồ sơ...',
        fetchError: 'Không thể tải hồ sơ',
        updateSuccess: 'Cập nhật hồ sơ thành công'
      },
      avatar: {
        fileTooLarge: 'File quá lớn',
        invalidFormat: 'Định dạng file không hợp lệ',
        uploadSuccess: 'Tải lên ảnh đại diện thành công',
        uploadError: 'Lỗi tải lên ảnh đại diện',
        choose: 'Chọn Ảnh',
        fileSize: 'Kích thước tệp tối đa: 5MB',
        formats: 'Định dạng: JPG, PNG'
      },
      kyc: {
        title: 'Xác Thực Danh Tính (KYC)',
        emailVerification: 'Xác Thực Email',
        emailDesc: 'Xác thực địa chỉ email của bạn',
        modalTitle: 'Xác thực danh tính (KYC)',
        emailVerified: 'Đã Xác Thực',
        emailNotVerified: 'Chưa Xác Thực',
        viewInfo: 'Xem thông tin KYC',
        verifyNow: 'Xác thực ngay',
        kycDescVerified: 'Danh tính của bạn đã được xác thực',
        kycDescNotVerified: 'Xác thực danh tính của bạn để mở khóa các tính năng',
        statusVerified: 'Đã Xác Thực',
        statusPending: 'Chờ Xử Lý',
        statusNotVerified: 'Chưa Xác Thực',
        successVerified: 'Danh tính đã được xác thực thành công',
        successUpdate: 'Thông tin KYC đã được cập nhật'
      },
      menu: {
        notifications: 'Thông Báo',
        account: 'Tài Khoản',
        profile: 'Hồ Sơ',
        address: 'Địa Chỉ',
        password: 'Mật Khẩu',
        verification: 'Xác Thực',
        banking: 'Ngân Hàng',
        orders: 'Đơn Hàng',
        vouchers: 'Mã Khuyến Mãi'
      },
      header: {
        profileTitle: 'Hồ Sơ Của Tôi',
        addressTitle: 'Thông Tin Địa Chỉ',
        verificationTitle: 'Xác Thực',
        passwordTitle: 'Đổi Mật Khẩu',
        bankingTitle: 'Thông Tin Ngân Hàng',
        profileDesc: 'Cập nhật thông tin cá nhân của bạn',
        addressDesc: 'Quản lý các địa chỉ của bạn',
        verificationDesc: 'Xác thực tài khoản của bạn',
        passwordDesc: 'Đổi mật khẩu của bạn',
        bankingDesc: 'Quản lý thông tin ngân hàng của bạn'
      },
      fields: {
        firstName: 'Tên',
        lastName: 'Họ',
        name: 'Họ và Tên',
        email: 'Email',
        phone: 'Điện Thoại',
        dob: 'Ngày Sinh',
        gender: 'Giới Tính',
        address: 'Địa Chỉ',
        district: 'Quận',
        city: 'Thành Phố',
        province: 'Tỉnh',
        streetAddress: 'Địa Chỉ Chi Tiết',
        change: 'Thay Đổi',
        notUpdated: 'Chưa Cập Nhật',
        save: 'Lưu Thay Đổi',
        cancel: 'Hủy'
      },
      placeholders: {
        enterName: 'Nhập họ và tên',
        enterPhone: 'Nhập số điện thoại'
      }
      ,
      address: {
        saveButton: 'Lưu địa chỉ'
      },
      placeholders: {
        streetAddress: 'Số nhà, tên đường',
        district: 'Quận/Huyện',
        city: 'Thành phố',
        province: 'Tỉnh/Thành phố'
      },
      password: {
        currentLabel: 'Mật khẩu hiện tại',
        newLabel: 'Mật khẩu mới',
        confirmLabel: 'Xác nhận mật khẩu mới',
        placeholderCurrent: 'Nhập mật khẩu hiện tại',
        placeholderNew: 'Nhập mật khẩu mới',
        placeholderConfirm: 'Nhập lại mật khẩu mới',
        updateButton: 'Cập nhật mật khẩu'
      },
      bank: {
        fetchError: 'Không thể tải thông tin tài khoản ngân hàng',
        addSuccess: 'Thêm tài khoản ngân hàng thành công',
        updateSuccess: 'Cập nhật tài khoản ngân hàng thành công',
        deleteSuccess: 'Đã xóa tài khoản ngân hàng',
        deleteError: 'Không thể xóa tài khoản ngân hàng',
        verified: 'Đã xác minh',
        accountNumberLabel: 'Số tài khoản',
        accountHolderLabel: 'Chủ tài khoản',
        addedOn: 'Đã thêm vào: {{date}}',
        editButton: 'Chỉnh sửa',
        deleteButton: 'Xóa',
        cancelButton: 'Hủy',
        importantNoteTitle: 'Lưu ý quan trọng:',
        importantNote: 'Tài khoản ngân hàng này sẽ được sử dụng để rút tiền. Vui lòng đảm bảo thông tin chính xác để tránh trì hoãn trong quá trình xử lý.',
        confirmDeleteTitle: 'Xác nhận xóa tài khoản ngân hàng',
        confirmDeleteDesc: 'Bạn có chắc chắn muốn xóa tài khoản ngân hàng này không? Bạn sẽ không thể rút tiền cho đến khi thêm tài khoản mới.'
      },
      security: {
        title: 'Mức độ bảo mật',
        completion: 'Hoàn thành: {{count}}/2',
        helpText: 'Tăng cường bảo mật tài khoản bằng cách xác thực danh tính và liên kết tài khoản ngân hàng.',
        completeMessage: 'Hồ sơ của bạn đã được xác thực đầy đủ'
      },
    },
    common: { language: { en: 'English', vi: 'Tiếng Việt' }, support: 'Hỗ trợ' }
  }, true, true);

  // Vietnamese translations for wallet top-up
  i18n.addResourceBundle('vi', 'translation', {
    wallet: {
      topUp: {
        title: 'Nạp Tiền Vào Ví',
        subtitle: 'Thêm tiền vào tài khoản của bạn',
        tabs: { quick: 'Số tiền nhanh', custom: 'Tùy chỉnh' },
        chooseQuick: 'Chọn số tiền nhanh để bắt đầu:',
        currency: 'VND',
        enterAmountLabel: 'Nhập số tiền (VND)',
        placeholderEnterAmount: 'Nhập số tiền...',
        minLabel: 'Tối thiểu',
        maxLabel: 'Tối đa',
        topUpNow: 'Nạp Tiền',
        redirecting: 'Chuyển hướng đến thanh toán...',
        processing: 'Đang xử lý...',
        securedBy: 'Được bảo mật bởi PayOS',
        instantProcessing: 'Xử lý tức thì'
      },
      transactionHistory: {
        title: 'Lịch Sử Giao Dịch',
        subtitle: 'Xem tất cả các giao dịch ví của bạn',
        loadingTransactions: 'Đang tải giao dịch...',
        pleaseWait: 'Vui lòng chờ',
        noTransactions: 'Chưa có giao dịch nào',
        transactionWillAppear: 'Lịch sử giao dịch của bạn sẽ xuất hiện ở đây',
        close: 'Đóng',
        topUp: '💰 Nạp Tiền',
        deposit: 'Nạp tiền',
        withdrawal: 'Rút tiền',
        success: 'Thành công',
        failed: 'Thất bại',
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        walletTransaction: 'Giao dịch ví',
        vnd: 'VND',
        status: 'Trạng thái'
      },
      withdrawals: {
        title: 'Rút Tiền',
        subtitle: 'Rút tiền từ ví PIRA của bạn về tài khoản ngân hàng',
        beforeTitle: 'Trước khi bạn có thể rút tiền',
        step1: {
          title: 'Bước 1: Hoàn tất xác thực KYC',
          verified: '✓ Danh tính của bạn đã được xác thực',
          notVerified: 'Xác thực danh tính để mở khóa tính năng rút tiền',
          button: 'Hoàn tất xác thực KYC →'
        },
        step2: {
          title: 'Bước 2: Thêm tài khoản ngân hàng',
          bankInfo: '✓ {{bankName}} - {{accountNumber}}',
          noBankKycVerified: 'Liên kết tài khoản ngân hàng Việt Nam để rút tiền',
          noBankKycNotVerified: 'Vui lòng hoàn tất xác thực KYC trước',
          addButton: 'Thêm tài khoản ngân hàng →',
          editButton: 'Chỉnh sửa tài khoản ngân hàng'
        },
        ready: 'Bạn đã sẵn sàng! Bạn có thể yêu cầu rút tiền.',
        historyTitle: 'Lịch sử rút tiền',
        requestButton: 'Yêu cầu rút tiền',
        noWithdrawalsTitle: 'Chưa có yêu cầu rút tiền',
        noWithdrawalsDescReady: 'Nhấn "Yêu cầu rút tiền" để bắt đầu',
        noWithdrawalsDescNotReady: 'Hoàn thành các bước trên để bắt đầu rút tiền'
      },
      balance: {
        label: 'Số Dư',
        currentBalance: 'Số Dư Hiện Tại',
        topUp: 'Nạp Tiền',
        viewAllTransactions: 'Xem tất cả giao dịch'
      },
      user: {
        profile: 'Hồ Sơ',
        myProducts: 'Sản Phẩm Của Tôi',
        myBookings: 'Đơn Đặt Của Tôi',
        withdrawals: 'Rút Tiền',
        settings: 'Cài Đặt',
        logout: 'Đăng Xuất',
        loggingOut: 'Đang đăng xuất...'
      }
    }
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