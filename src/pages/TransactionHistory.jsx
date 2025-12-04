import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import paymentService from '../services/payment';
import { 
  CreditCard, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw,
  Filter,
  Calendar
} from 'lucide-react';

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadWalletBalance();
    }
  }, [user, filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getTransactionHistory(filter);
      setTransactions(response.metadata?.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const response = await paymentService.getWalletBalance();
      setWalletBalance(response.metadata?.balance || 0);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const getTransactionIcon = (type, status) => {
    if (status === 'pending') return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
    if (status === 'failed') return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
    
        switch (type) {
      case 'deposit':
      case 'DEPOSIT':
      case 'TRANSFER_IN':
        return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case 'payment':
      case 'order_payment':
      case 'penalty':
        return <ArrowDownCircle className="w-5 h-5 text-blue-500" />;
      case 'withdrawal':
      case 'WITHDRAWAL':
      case 'TRANSFER_OUT':
        return <ArrowDownCircle className="w-5 h-5 text-orange-500" />;
      case 'refund':
        return <ArrowUpCircle className="w-5 h-5 text-purple-500" />;
      case 'PROMOTION_REVENUE':
        return <ArrowUpCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return 'Thành công';
      case 'pending': return 'Đang chờ';
      case 'processing': return 'Đang xử lý';
      case 'failed': return 'Thất bại';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'deposit':
      case 'DEPOSIT':
        return 'Nạp tiền';
      case 'payment':
      case 'order_payment':
        return 'Thanh toán';
      case 'withdrawal':
      case 'WITHDRAWAL':
        return 'Rút tiền';
      case 'refund': return 'Hoàn tiền';
      case 'penalty': return 'Phạt';
      case 'PROMOTION_REVENUE': return 'Doanh thu khuyến mãi';
      case 'TRANSFER_IN': return 'Chuyển vào';
      case 'TRANSFER_OUT': return 'Chuyển ra';
      default: return type;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'wallet': return 'Ví điện tử';
      case 'payos': return 'PayOS';
      case 'cod': return 'Tiền mặt';
      case 'system_wallet': return 'Ví hệ thống';
      default: return method || 'N/A';
    }
  };

  const formatAmount = (amount, type) => {
    // Các type TĂNG tiền (cộng): deposit, refund, PROMOTION_REVENUE, TRANSFER_IN
    // Các type GIẢM tiền (trừ): payment, withdrawal, penalty, order_payment, TRANSFER_OUT
    const increaseTypes = ['deposit', 'DEPOSIT', 'refund', 'PROMOTION_REVENUE', 'TRANSFER_IN'];
    const sign = increaseTypes.includes(type) ? '+' : '-';
    return `${sign}${amount?.toLocaleString('vi-VN')}đ`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <p className="text-gray-600">Bạn cần đăng nhập để xem lịch sử giao dịch</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Lịch sử giao dịch</h1>
            <p className="text-gray-600">Theo dõi các giao dịch nạp tiền và thanh toán</p>
          </div>
          <button
            onClick={() => {
              loadTransactions();
              loadWalletBalance();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center space-x-3">
            <Wallet className="w-8 h-8" />
            <div>
              <p className="text-blue-100">Số dư ví hiện tại</p>
              <p className="text-2xl font-bold">{walletBalance.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filter.type}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                className="border border-gray-300 rounded px-3 py-2"
               >
                <option value="all">Tất cả loại</option>
                <option value="deposit">Nạp tiền</option>
                <option value="payment">Thanh toán</option>
                <option value="withdrawal">Rút tiền</option>
                <option value="refund">Hoàn tiền</option>
                <option value="penalty">Phạt</option>
                <option value="PROMOTION_REVENUE">Doanh thu khuyến mãi</option>
              </select>
            </div>
            <div>
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="success">Thành công</option>
                <option value="pending">Đang chờ</option>
                <option value="processing">Đang xử lý</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p>Đang tải lịch sử giao dịch...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Chưa có giao dịch nào</h3>
            <p className="text-gray-500">Lịch sử giao dịch sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giao dịch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phương thức
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type, transaction.status)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.description}
                            </p>
                            {transaction.orderCode && (
                              <p className="text-xs text-gray-500">
                                Mã đơn: {transaction.orderCode}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getTypeText(transaction.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getPaymentMethodText(transaction.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          ['deposit', 'DEPOSIT', 'refund', 'PROMOTION_REVENUE', 'TRANSFER_IN'].includes(transaction.type) 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;