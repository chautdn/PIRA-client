import React from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

const ExportButtons = ({ data, filename = 'statistics', title = 'Thống kê' }) => {
  // Export to Excel
  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      if (data.summary) {
        const summaryData = Object.entries(data.summary).map(([key, value]) => ({
          'Chỉ số': formatKey(key),
          'Giá trị': formatValue(value)
        }));
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Tổng quan');
      }

      // Time series sheet
      if (data.timeSeries && data.timeSeries.length > 0) {
        const timeSeriesData = data.timeSeries.map(item => ({
          'Ngày': item.date,
          'Doanh thu': item.revenue || 0,
          'Phí vận chuyển': item.shippingFee || 0,
          'Lợi nhuận': item.profit || 0,
          'Số đơn hàng': item.orderCount || 0
        }));
        const timeSeriesWs = XLSX.utils.json_to_sheet(timeSeriesData);
        XLSX.utils.book_append_sheet(wb, timeSeriesWs, 'Chi tiết theo thời gian');
      }

      // Breakdown sheet
      if (data.breakdown && data.breakdown.bySource) {
        const breakdownData = data.breakdown.bySource.map(item => ({
          'Nguồn': item.name,
          'Giá trị': item.value
        }));
        const breakdownWs = XLSX.utils.json_to_sheet(breakdownData);
        XLSX.utils.book_append_sheet(wb, breakdownWs, 'Cơ cấu doanh thu');
      }

      // Write file
      XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Lỗi khi xuất file Excel');
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Add title
      doc.setFontSize(18);
      doc.text(title, 14, yPosition);
      yPosition += 15;

      // Add summary
      if (data.summary) {
        doc.setFontSize(14);
        doc.text('Tổng quan', 14, yPosition);
        yPosition += 10;

        const summaryData = Object.entries(data.summary).map(([key, value]) => [
          formatKey(key),
          formatValue(value)
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Chỉ số', 'Giá trị']],
          body: summaryData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Add time series data
      if (data.timeSeries && data.timeSeries.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text('Chi tiết theo thời gian', 14, yPosition);
        yPosition += 10;

        const timeSeriesData = data.timeSeries.map(item => [
          item.date,
          formatCurrency(item.revenue || 0),
          formatCurrency(item.shippingFee || 0),
          formatCurrency(item.profit || 0),
          item.orderCount || 0
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Ngày', 'Doanh thu', 'Phí vận chuyển', 'Lợi nhuận', 'Số đơn']],
          body: timeSeriesData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 }
        });
      }

      // Save PDF
      doc.save(`${filename}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Lỗi khi xuất file PDF');
    }
  };

  // Helper functions
  const formatKey = (key) => {
    const keyMap = {
      total: 'Tổng',
      totalRevenue: 'Tổng doanh thu',
      totalCosts: 'Tổng chi phí',
      profit: 'Lợi nhuận',
      profitMargin: 'Biên lợi nhuận (%)',
      orderRevenue: 'Doanh thu từ đơn hàng',
      shippingRevenue: 'Doanh thu vận chuyển',
      promotionRevenue: 'Doanh thu quảng cáo',
      platformFees: 'Phí nền tảng'
    };
    return keyMap[key] || key;
  };

  const formatValue = (value) => {
    if (typeof value === 'number') {
      if (value > 1000) {
        return formatCurrency(value);
      }
      return value.toFixed(2);
    }
    return value;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={exportToExcel}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Xuất Excel
      </button>
      <button
        onClick={exportToPDF}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        Xuất PDF
      </button>
    </div>
  );
};

export default ExportButtons;
