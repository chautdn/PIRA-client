import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DeliveryRefusalForm from '../components/dispute/DeliveryRefusalForm';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const CreateDispute = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const subOrderId = searchParams.get('subOrderId');
  const type = searchParams.get('type');
  
  const [subOrder, setSubOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubOrder = async () => {
      if (!subOrderId) {
        console.log('❌ No subOrderId, redirecting...');
        navigate('/rental-orders');
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Fetching SubOrder:', subOrderId);
        const url = `/disputes/suborder/${subOrderId}`;
        console.log('📡 API URL:', url);
        // Fetch SubOrder details via dispute API to avoid route conflicts
        const response = await api.get(url);
        console.log('✅ SubOrder response:', response.data);
        
        // Handle different response structures
        const subOrderData = response.data.metadata?.subOrder || response.data.data?.subOrder || response.data.data;
        console.log('📦 Parsed SubOrder:', subOrderData);
        console.log('📦 SubOrder._id:', subOrderData?._id);
        console.log('📦 SubOrder keys:', Object.keys(subOrderData || {}));
        
        if (!subOrderData) {
          throw new Error('SubOrder data not found in response');
        }
        
        setSubOrder(subOrderData);
      } catch (error) {
        console.error('❌ Error fetching SubOrder:', error);
        console.error('Error response:', error.response?.data);
        alert('Không thể tải thông tin đơn hàng');
        navigate('/rental-orders');
      } finally {
        setLoading(false);
      }
    };

    fetchSubOrder();
  }, [subOrderId, navigate]);

  const handleSuccess = () => {
    navigate('/disputes/my-disputes');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Debug: Log subOrder when it changes
  useEffect(() => {
    if (subOrder) {
      console.log('🔄 SubOrder state updated:', subOrder);
      console.log('🔄 SubOrder._id in state:', subOrder._id);
    }
  }, [subOrder]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">Đang tải thông tin đơn hàng...</span>
        </div>
      </div>
    );
  }

  if (!subOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
          <button
            onClick={() => navigate('/rental-orders')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold">Từ chối giao hàng</h1>
            <p className="text-gray-600">Đơn hàng #{subOrder.subOrderNumber}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {type === 'delivery-refusal' ? (
            <DeliveryRefusalForm
              subOrder={subOrder}
              subOrderId={subOrderId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : (
            <div className="text-center text-gray-600">
              <p>Loại khiếu nại không hợp lệ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateDispute;
