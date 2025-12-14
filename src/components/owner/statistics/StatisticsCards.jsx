import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useI18n } from '../../../hooks/useI18n';

const StatisticsCards = ({ statistics, loading }) => {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!statistics) return null;

  const { products, orders, revenue, profit } = statistics;

  const cards = [
    {
      title: t("ownerStatistics.cards.totalProducts"),
      value: products?.total || 0,
      icon: Package,
      color: 'blue',
      details: [
        { label: t("ownerStatistics.cards.activeProducts"), value: products?.active || 0 },
        { label: t("ownerStatistics.cards.rentedProducts"), value: products?.rented || 0 },
        { label: t("ownerStatistics.cards.unavailableProducts"), value: products?.unavailable || 0 }
      ]
    },
    {
      title: t("ownerStatistics.cards.totalOrders"),
      value: orders?.total || 0,
      icon: ShoppingCart,
      color: 'green',
      details: [
        { label: t("ownerStatistics.cards.pendingOrders"), value: orders?.pending || 0 },
        { label: t("ownerStatistics.cards.confirmedOrders"), value: orders?.confirmed || 0 },
        { label: t("ownerStatistics.cards.completedOrders"), value: orders?.completed || 0 }
      ]
    },
    {
      title: "Doanh thu (100%)",
      value: revenue?.totalRevenue || 0,
      icon: DollarSign,
      color: 'yellow',
      format: 'currency',
      details: [
        { label: "Tiền nhận về (90%)", value: revenue?.receivedAmount || 0, format: 'currency' },
        { label: "Phí nền tảng (10%)", value: revenue?.platformFee || 0, format: 'currency' },
        { label: "Phí quảng cáo", value: revenue?.promotionFees || 0, format: 'currency' }
      ]
    },
    {
      title: "Lợi nhuận thuần",
      value: profit?.profit || 0,
      icon: TrendingUp,
      color: 'purple',
      format: 'currency',
      subtitle: `Biên lợi nhuận: ${profit?.profitMargin || 0}%`,
      details: [
        { label: "Tiền nhận về", value: profit?.receivedAmount || 0, format: 'currency' },
        { label: "Chi phí", value: profit?.costs || 0, format: 'currency' }
      ]
    }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {card.format === 'currency' 
                    ? formatCurrency(card.value)
                    : card.value.toLocaleString()
                  }
                </p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-full ${getColorClasses(card.color)}`}>
                <Icon size={24} />
              </div>
            </div>

            {card.details && (
              <div className="border-t pt-3 space-y-1">
                {card.details.map((detail, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{detail.label}:</span>
                    <span className="font-semibold text-gray-800">
                      {detail.format === 'currency'
                        ? formatCurrency(detail.value)
                        : detail.value.toLocaleString()
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatisticsCards;
