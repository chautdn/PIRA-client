import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/admin';

const TransactionDetail = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTransactionDetail();
  }, [transactionId]);

  const loadTransactionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTransactionById(transactionId);
      setTransaction(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'processing': 'bg-blue-100 text-blue-800 border-blue-300',
      'success': 'bg-green-100 text-green-800 border-green-300',
      'failed': 'bg-red-100 text-red-800 border-red-300',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-300'
    };

    const statusText = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'success': 'Thành công',
      'failed': 'Thất bại',
      'cancelled': 'Đã hủy'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeClasses = {
      'deposit': 'bg-green-100 text-green-800',
      'withdrawal': 'bg-red-100 text-red-800',
      'payment': 'bg-blue-100 text-blue-800',
      'refund': 'bg-purple-100 text-purple-800',
      'penalty': 'bg-orange-100 text-orange-800',
      'order_payment': 'bg-indigo-100 text-indigo-800',
      'wallet_topup': 'bg-emerald-100 text-emerald-800',
      'wallet_withdrawal': 'bg-rose-100 text-rose-800',
      'rental_payment': 'bg-cyan-100 text-cyan-800',
      'rental_deposit': 'bg-teal-100 text-teal-800'
    };

    const typeText = {
      'deposit': 'Nạp tiền vào ví',
      'withdrawal': 'Rút tiền khỏi ví',
      'payment': 'Thanh toán hệ thống',
      'refund': 'Hoàn tiền',
      'penalty': 'Phí phạt',
      'order_payment': 'Thanh toán đơn hàng',
      'wallet_topup': 'Nạp tiền ví (Web)',
      'wallet_withdrawal': 'Rút tiền ví (Web)',
      'rental_payment': 'Thanh toán thuê sản phẩm',
      'rental_deposit': 'Đặt cọc thuê sản phẩm'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-lg ${typeClasses[type] || 'bg-gray-100 text-gray-800'}`}>
        {typeText[type] || type}
      </span>
    );
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Đang tải chi tiết giao dịch...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <h3 className="text-red-800 font-medium">Lỗi tải dữ liệu</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/admin/transactions')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 text-xl">⚠️</span>
              <div>
                <h3 className="text-yellow-800 font-medium">Không tìm thấy giao dịch</h3>
                <p className="text-yellow-700">Giao dịch với ID {transactionId} không tồn tại.</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/admin/transactions')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">💳</span>
                Chi tiết Giao dịch
              </h1>
              <p className="text-gray-600 mt-1">ID: {transaction.externalId || transaction._id}</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin/transactions"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span>←</span>
                Quay lại
              </Link>
            </div>
          </div>
        </div>

        {/* Transaction Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>💰</span>
              Tổng quan
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Loại giao dịch:</span>
                {getTypeBadge(transaction.type)}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                {getStatusBadge(transaction.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền:</span>
                <span className={`font-bold text-lg ${transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.type === 'withdrawal' ? '-' : '+'}
                  {formatAmount(transaction.amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>👤</span>
              Người dùng
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 text-sm">Tên người dùng:</span>
                <p className="font-medium">
                  {transaction.user?.profile?.firstName || transaction.user?.firstName || 'N/A'} {transaction.user?.profile?.lastName || transaction.user?.lastName || ''}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Email:</span>
                <p className="font-medium">{transaction.user?.email || 'Không có email'}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Loại tài khoản:</span>
                <p className="font-medium">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    transaction.user?.role === 'OWNER' ? 'bg-blue-100 text-blue-800' :
                    transaction.user?.role === 'RENTER' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {transaction.user?.role === 'OWNER' ? 'Chủ sản phẩm' :
                     transaction.user?.role === 'RENTER' ? 'Người thuê' : 'Không xác định'}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">User ID:</span>
                <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {transaction.user?._id || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>⏰</span>
              Thời gian
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 text-sm">Tạo lúc:</span>
                <p className="font-medium">{formatDate(transaction.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Cập nhật:</span>
                <p className="font-medium">{formatDate(transaction.updatedAt)}</p>
              </div>
              {transaction.processedAt && (
                <div>
                  <span className="text-gray-600 text-sm">Xử lý lúc:</span>
                  <p className="font-medium">{formatDate(transaction.processedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Thông tin chi tiết
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả giao dịch</label>
                <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                  <p className="text-gray-900">
                    {transaction.description || 
                     (transaction.type === 'deposit' ? 'Nạp tiền vào ví hệ thống qua các kênh thanh toán' :
                      transaction.type === 'withdrawal' ? 'Rút tiền từ ví hệ thống về tài khoản ngân hàng' :
                      transaction.type === 'wallet_topup' ? 'Người dùng nạp tiền vào ví qua giao diện website' :
                      transaction.type === 'wallet_withdrawal' ? 'Người dùng rút tiền từ ví qua giao diện website' :
                      transaction.type === 'order_payment' ? 'Thanh toán đơn hàng thuê sản phẩm trên hệ thống' :
                      transaction.type === 'rental_payment' ? 'Thanh toán tiền thuê cho chủ sản phẩm' :
                      transaction.type === 'rental_deposit' ? 'Đặt cọc đảm bảo cho việc thuê sản phẩm' :
                      transaction.type === 'refund' ? 'Hoàn trả tiền cho giao dịch đã hủy hoặc lỗi' :
                      transaction.type === 'penalty' ? 'Phí phạt do vi phạm quy định sử dụng' :
                      'Giao dịch trong hệ thống PIRA')}
                  </p>
                </div>
              </div>

              {transaction.externalId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID bên ngoài</label>
                  <p className="mt-1 font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                    {transaction.externalId}
                  </p>
                </div>
              )}

              {transaction.currency && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiền tệ</label>
                  <p className="mt-1 text-gray-900">{transaction.currency}</p>
                </div>
              )}

              {transaction.fee && transaction.fee > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phí giao dịch</label>
                  <p className="mt-1 text-red-600 font-medium">{formatAmount(transaction.fee)}</p>
                </div>
              )}

              {transaction.reference && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tham chiếu</label>
                  <div className="mt-1">
                    {transaction.reference.rentalOrderId && (
                      <Link
                        to={`/admin/orders/${transaction.reference.rentalOrderId}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Đơn hàng: {transaction.reference.rentalOrderId}
                      </Link>
                    )}
                    {transaction.reference.productId && (
                      <p className="text-gray-900">
                        Sản phẩm: {transaction.reference.productId}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🔧</span>
              Thông tin kỹ thuật
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                <p className="mt-1 font-mono text-xs bg-gray-100 px-3 py-2 rounded break-all">
                  {transaction._id}
                </p>
              </div>

              {transaction.provider && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phương thức thanh toán</label>
                  <p className="mt-1 text-gray-900">
                    {transaction.provider === 'vnpay' ? 'VNPay' :
                     transaction.provider === 'momo' ? 'MoMo' :
                     transaction.provider === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                     transaction.provider === 'wallet' ? 'Ví điện tử PIRA' :
                     transaction.provider}
                  </p>
                </div>
              )}

              {transaction.paymentMethod && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hình thức giao dịch</label>
                  <p className="mt-1 text-gray-900">
                    {transaction.paymentMethod === 'online' ? 'Thanh toán trực tuyến' :
                     transaction.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                     transaction.paymentMethod === 'wallet' ? 'Ví PIRA' :
                     transaction.paymentMethod}
                  </p>
                </div>
              )}

              {transaction.relatedOrder && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Đơn hàng liên quan</label>
                  <p className="mt-1">
                    <Link
                      to={`/admin/orders/${transaction.relatedOrder}`}
                      className="text-blue-600 hover:text-blue-800 underline font-mono text-sm"
                    >
                      #{transaction.relatedOrder}
                    </Link>
                  </p>
                </div>
              )}

              {transaction.errorMessage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thông báo lỗi</label>
                  <div className="mt-1 bg-red-50 border border-red-200 p-3 rounded">
                    <p className="text-red-800 text-sm">{transaction.errorMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Statistics Section */}
        {transaction.userStats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span>
              Thống kê người dùng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Transaction History Stats */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Lịch sử giao dịch</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tổng giao dịch:</span>
                    <span className="font-medium">{transaction.userStats.transactionHistory.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thành công:</span>
                    <span className="font-medium text-green-600">{transaction.userStats.transactionHistory.successfulTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thất bại:</span>
                    <span className="font-medium text-red-600">{transaction.userStats.transactionHistory.failedTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng giá trị:</span>
                    <span className="font-medium">{formatAmount(transaction.userStats.transactionHistory.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trung bình:</span>
                    <span className="font-medium">{formatAmount(transaction.userStats.transactionHistory.averageAmount || 0)}</span>
                  </div>
                  {transaction.userStats.transactionHistory.firstTransaction && (
                    <div className="flex justify-between">
                      <span>Giao dịch đầu:</span>
                      <span className="font-medium text-xs">{formatDate(transaction.userStats.transactionHistory.firstTransaction)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">Thông tin ví</h4>
                <div className="space-y-2 text-sm">
                  {transaction.userStats.wallet ? (
                    <>
                      <div className="flex justify-between">
                        <span>Số dư hiện tại:</span>
                        <span className="font-medium text-green-600">{formatAmount(transaction.userStats.wallet.balance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ví tạo lúc:</span>
                        <span className="font-medium text-xs">{formatDate(transaction.userStats.wallet.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cập nhật cuối:</span>
                        <span className="font-medium text-xs">{formatDate(transaction.userStats.wallet.updatedAt)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">Chưa có ví</p>
                  )}
                </div>
              </div>

              {/* Bank Account Information */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3">Thông tin ngân hàng</h4>
                <div className="space-y-2 text-sm">
                  {transaction.user?.bankAccount ? (
                    <>
                      <div className="flex justify-between">
                        <span>Ngân hàng:</span>
                        <span className="font-medium">{transaction.user.bankAccount.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chủ TK:</span>
                        <span className="font-medium">{transaction.user.bankAccount.accountHolder}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Số TK:</span>
                        <span className="font-mono text-xs">***{transaction.user.bankAccount.accountNumber?.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Xác minh:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.user.bankAccount.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                          transaction.user.bankAccount.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.user.bankAccount.verificationStatus === 'verified' ? 'Đã xác minh' :
                           transaction.user.bankAccount.verificationStatus === 'pending' ? 'Chờ xác minh' : 'Chưa xác minh'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">Chưa có thông tin ngân hàng</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            {transaction.userStats.recentTransactions && transaction.userStats.recentTransactions.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">5 giao dịch gần nhất</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transaction.userStats.recentTransactions.map((recentTx, index) => (
                        <tr key={index} className={`hover:bg-gray-50 ${recentTx._id === transaction._id ? 'bg-yellow-50 border-yellow-200' : ''}`}>
                          <td className="px-4 py-2 text-sm">
                            {getTypeBadge(recentTx.type)}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            <span className={recentTx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}>
                              {recentTx.type === 'withdrawal' ? '-' : '+'}
                              {formatAmount(recentTx.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {getStatusBadge(recentTx.status)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {formatDate(recentTx.createdAt)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">
                            {recentTx.description || 'Không có mô tả'}
                            {recentTx._id === transaction._id && (
                              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                Giao dịch hiện tại
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Account Information */}
        {transaction.user && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>👤</span>
              Thông tin tài khoản chi tiết
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Thông tin cá nhân</h4>
                <div className="space-y-3">
                  {transaction.user.profile?.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Điện thoại:</span>
                      <span className="font-medium">{transaction.user.profile.phone}</span>
                    </div>
                  )}
                  {transaction.user.profile?.dateOfBirth && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày sinh:</span>
                      <span className="font-medium">{formatDate(transaction.user.profile.dateOfBirth)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tham gia:</span>
                    <span className="font-medium">{formatDate(transaction.user.createdAt)}</span>
                  </div>
                  {transaction.user.kycStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">KYC:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.user.kycStatus === 'verified' ? 'bg-green-100 text-green-800' :
                        transaction.user.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.user.kycStatus === 'verified' ? 'Đã xác minh' :
                         transaction.user.kycStatus === 'pending' ? 'Chờ xác minh' : 'Chưa xác minh'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái TK:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      transaction.user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.user.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Hành động quản trị</h4>
                <div className="space-y-3">
                  <Link
                    to={`/admin/users/${transaction.user._id}`}
                    className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center text-sm"
                  >
                    🔍 Xem chi tiết người dùng
                  </Link>
                  {transaction.user.bankAccount && (
                    <Link
                      to={`/admin/bank-accounts/${transaction.user._id}`}
                      className="block w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-center text-sm"
                    >
                      🏦 Xem thông tin ngân hàng
                    </Link>
                  )}
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Information */}
        {(transaction.balanceBefore !== undefined || transaction.balanceAfter !== undefined) && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚖️</span>
              Thông tin số dư
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Số dư trước</p>
                <p className="text-xl font-bold text-blue-600">
                  {transaction.balanceBefore !== undefined ? formatAmount(transaction.balanceBefore) : 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Thay đổi</p>
                <p className={`text-xl font-bold ${transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.type === 'withdrawal' ? '-' : '+'}
                  {formatAmount(transaction.amount)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Số dư sau</p>
                <p className="text-xl font-bold text-green-600">
                  {transaction.balanceAfter !== undefined ? formatAmount(transaction.balanceAfter) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetail;