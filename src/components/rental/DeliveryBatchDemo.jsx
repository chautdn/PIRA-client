import React, { useState } from 'react';
import { Package, Calendar, MapPin, Truck } from 'lucide-react';
import VietMapService from '../../services/vietmap';

const DeliveryBatchDemo = () => {
  const [demoProducts, setDemoProducts] = useState([
    {
      id: 1,
      name: "Máy ảnh Canon",
      quantity: 2,
      rentalPeriod: {
        startDate: "2025-11-15T00:00:00.000Z",
        endDate: "2025-11-20T00:00:00.000Z"
      }
    },
    {
      id: 2,
      name: "Ống kính 50mm",
      quantity: 1,
      rentalPeriod: {
        startDate: "2025-11-15T00:00:00.000Z", // Same date as product 1
        endDate: "2025-11-22T00:00:00.000Z"
      }
    },
    {
      id: 3,
      name: "Tripod",
      quantity: 1,
      rentalPeriod: {
        startDate: "2025-11-18T00:00:00.000Z", // Different date
        endDate: "2025-11-25T00:00:00.000Z"
      }
    },
    {
      id: 4,
      name: "Flash",
      quantity: 2,
      rentalPeriod: {
        startDate: "2025-11-18T00:00:00.000Z", // Same as product 3
        endDate: "2025-11-23T00:00:00.000Z"
      }
    }
  ]);

  const [distance, setDistance] = useState(8.5);
  const [calculation, setCalculation] = useState(null);

  const calculateDeliveryBatches = () => {
    const result = VietMapService.calculateProductShippingFees(demoProducts, distance);
    setCalculation(result);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        🚚 Demo: Delivery Batch Shipping System
      </h2>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Products */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Sản phẩm thuê
          </h3>
          <div className="space-y-2">
            {demoProducts.map((product) => (
              <div key={product.id} className="bg-white p-3 rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      Số lượng: {product.quantity}
                    </div>
                    <div className="text-sm text-blue-600 flex items-center mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(product.rentalPeriod.startDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distance Input */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Thông tin giao hàng
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng cách (km)
              </label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.1"
                min="0"
              />
            </div>
            <button
              onClick={calculateDeliveryBatches}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Truck className="w-4 h-4 mr-2" />
              Tính phí ship theo batch
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {calculation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-green-800">
            📊 Kết quả tính phí ship
          </h3>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {calculation.deliveryCount}
              </div>
              <div className="text-sm text-gray-600">Lần giao hàng</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-blue-700">
                {calculation.totalShippingFee?.toLocaleString('vi-VN')}đ
              </div>
              <div className="text-sm text-gray-600">Tổng phí ship</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-purple-700">
                {calculation.summary?.totalProducts}
              </div>
              <div className="text-sm text-gray-600">Tổng sản phẩm</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-orange-700">
                {calculation.summary?.totalQuantity}
              </div>
              <div className="text-sm text-gray-600">Tổng số lượng</div>
            </div>
          </div>

          {/* Delivery Batches */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 mb-3">
              🗓️ Chi tiết giao hàng theo ngày:
            </h4>
            {calculation.deliveryBatches?.map((batch, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="font-medium">
                      Lần giao {batch.deliveryBatch}: {formatDate(batch.deliveryDate)}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    {batch.deliveryFee?.toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Sản phẩm trong batch:</div>
                    <div className="space-y-1">
                      {batch.products?.map((product, pIndex) => (
                        <div key={pIndex} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span>Sản phẩm {product.productIndex + 1}</span>
                            <span className="font-medium">
                              {product.allocatedFee?.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Số lượng: {product.quantity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Chi phí breakdown:</div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Base fee:</span>
                        <span>{batch.breakdown?.baseFee?.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Distance fee:</span>
                        <span>{batch.breakdown?.distanceFee?.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-medium">
                        <span>Total:</span>
                        <span>{batch.breakdown?.total?.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">
              💡 So sánh với cách tính cũ (per product):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-red-600">
                  Cách cũ: {calculation.summary?.totalProducts} products × {Math.round((15000 + distance * 5000))} = {((calculation.summary?.totalProducts || 0) * Math.round((15000 + distance * 5000))).toLocaleString('vi-VN')}đ
                </div>
              </div>
              <div>
                <div className="text-green-600">
                  Cách mới: {calculation.deliveryCount} deliveries = {calculation.totalShippingFee?.toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>
            <div className="mt-2 font-medium text-green-700">
              Tiết kiệm: {(((calculation.summary?.totalProducts || 0) * Math.round((15000 + distance * 5000))) - (calculation.totalShippingFee || 0)).toLocaleString('vi-VN')}đ
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryBatchDemo;