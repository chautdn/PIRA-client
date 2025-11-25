import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const RentalPaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { masterOrderId } = useParams();
  
  const payment = searchParams.get('payment'); // 'success' or 'cancel'
  const orderCode = searchParams.get('orderCode');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [message, setMessage] = useState('Đang xác nhận thanh toán...');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderCode || !masterOrderId) {
        setStatus('failed');
        setMessage('Thiếu thông tin đơn hàng');
        return;
      }

      if (payment === 'cancel') {
        setStatus('failed');
        setMessage('Bạn đã hủy thanh toán');
        toast.error('Thanh toán đã bị hủy');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate(`/rental-orders/${masterOrderId}`);
        }, 3000);
        return;
      }

      try {
        console.log('🔄 Verifying payment:', { masterOrderId, orderCode });

        // Call verify payment API
        const response = await api.post(`/rental-orders/${masterOrderId}/verify-payment`, {
          orderCode: orderCode
        });

        console.log('✅ Verification response:', response.data);

        if (response.data.success) {
          setStatus('success');
          setMessage('Thanh toán thành công! Đơn hàng đã được xác nhận.');
          
          toast.success('🎉 Thanh toán thành công!', {
            duration: 4000,
            icon: '✅'
          });

          // Clear pending order from sessionStorage
          sessionStorage.removeItem('pendingPaymentOrder');

          // Redirect to order detail after 2 seconds
          setTimeout(() => {
            navigate(`/rental-orders/${masterOrderId}`);
          }, 2000);
        } else {
          throw new Error(response.data.message || 'Xác nhận thanh toán thất bại');
        }
      } catch (error) {
        console.error('❌ Payment verification failed:', error);
        setStatus('failed');
        setMessage(error.response?.data?.message || error.message || 'Không thể xác nhận thanh toán');
        
        toast.error('Xác nhận thanh toán thất bại: ' + message);

        // Redirect after 5 seconds
        setTimeout(() => {
          navigate(`/rental-orders/${masterOrderId}`);
        }, 5000);
      }
    };

    verifyPayment();
  }, [orderCode, masterOrderId, payment, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {/* Status Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          {status === 'verifying' && (
            <div className="relative">
              <Loader className="w-20 h-20 text-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full animate-pulse" />
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="w-20 h-20 text-green-500" strokeWidth={2} />
            </motion.div>
          )}
          
          {status === 'failed' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <XCircle className="w-20 h-20 text-red-500" strokeWidth={2} />
            </motion.div>
          )}
        </motion.div>

        {/* Status Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className={`text-2xl font-bold mb-4 ${
            status === 'success' ? 'text-green-600' :
            status === 'failed' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {status === 'verifying' && 'Đang xử lý thanh toán'}
            {status === 'success' && 'Thanh toán thành công!'}
            {status === 'failed' && 'Thanh toán thất bại'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {status === 'verifying' && (
            <div className="space-y-2 text-sm text-gray-500">
              <p>Vui lòng đợi trong giây lát...</p>
              <p className="text-xs">Chúng tôi đang xác nhận thanh toán của bạn với ngân hàng</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-700">
                Đơn hàng của bạn đã được xác nhận và đang chờ chủ sản phẩm phê duyệt.
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-700">
                Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
              </p>
            </div>
          )}

          {/* Redirect Notice */}
          {(status === 'success' || status === 'failed') && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-500 mt-4"
            >
              Đang chuyển hướng đến trang đơn hàng...
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RentalPaymentReturn;
