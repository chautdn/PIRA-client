import React from 'react';

const PricingForm = ({ pricing, onChange, errors }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Daily Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Daily Rental Rate (VND) *
        </label>
        <div className="relative">
          <input
            type="number"
            name="pricing.dailyRate"
            value={pricing.dailyRate}
            onChange={onChange}
            min="0"
            step="1000"
            className={`w-full px-3 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dailyRate ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="50000"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 text-sm">VND</span>
          </div>
        </div>
        {errors.dailyRate && <p className="text-red-500 text-sm mt-1">{errors.dailyRate}</p>}
        {pricing.dailyRate && (
          <p className="text-gray-500 text-xs mt-1">
            ≈ {formatCurrency(pricing.dailyRate)} per day
          </p>
        )}
      </div>

      {/* Deposit Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Security Deposit (VND) *
        </label>
        <div className="space-y-2">
          <div className="relative">
            <input
              type="number"
              name="pricing.deposit.amount"
              value={pricing.deposit.amount}
              onChange={onChange}
              min="0"
              step="1000"
              className={`w-full px-3 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.depositAmount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="100000"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 text-sm">VND</span>
            </div>
          </div>
          
          {/* Deposit Type */}
          <select
            name="pricing.deposit.type"
            value={pricing.deposit.type}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="FIXED">Fixed Amount</option>
            <option value="PERCENTAGE">Percentage of Daily Rate</option>
          </select>
        </div>
        
        {errors.depositAmount && <p className="text-red-500 text-sm mt-1">{errors.depositAmount}</p>}
        
        {pricing.deposit.amount && (
          <p className="text-gray-500 text-xs mt-1">
            {pricing.deposit.type === 'FIXED' 
              ? `≈ ${formatCurrency(pricing.deposit.amount)} security deposit`
              : `≈ ${pricing.deposit.amount}% of daily rate (${formatCurrency(pricing.dailyRate * pricing.deposit.amount / 100)})`
            }
          </p>
        )}
      </div>

      {/* Pricing Summary */}
      {pricing.dailyRate && pricing.deposit.amount && (
        <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Pricing Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Daily Rate:</span>
              <span className="font-medium">{formatCurrency(pricing.dailyRate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Deposit:</span>
              <span className="font-medium">
                {pricing.deposit.type === 'FIXED' 
                  ? formatCurrency(pricing.deposit.amount)
                  : `${pricing.deposit.amount}% (${formatCurrency(pricing.dailyRate * pricing.deposit.amount / 100)})`
                }
              </span>
            </div>
            <div className="border-t pt-1 flex justify-between font-semibold">
              <span>Total (1 day):</span>
              <span>
                {formatCurrency(
                  parseFloat(pricing.dailyRate) + 
                  (pricing.deposit.type === 'FIXED' 
                    ? parseFloat(pricing.deposit.amount)
                    : parseFloat(pricing.dailyRate) * parseFloat(pricing.deposit.amount) / 100
                  )
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingForm;