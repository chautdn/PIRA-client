import React, { useState, useEffect } from "react";
import icons from "../../../utils/icons";

const LocationSelector = ({ location, onChange, errors }) => {
  const [districts] = useState([
    "Quận Hải Châu",
    "Quận Thanh Khê",
    "Quận Sơn Trá",
    "Quận Ngũ Hành Sơn",
    "Quận Liên Chiểu",
    "Quận Cẩm Lệ",
    "Huyện Hòa Vang",
  ]);

  const [wards, setWards] = useState([]);

  useEffect(() => {
    // Load wards based on selected district
    if (location.district) {
      loadWards(location.district);
    } else {
      setWards([]);
    }
  }, [location.district]);

  const loadWards = (district) => {
    // Mapping wards for each district in Da Nang
    const wardMap = {
      "Quận Hải Châu": [
        "Phường Hải Châu I",
        "Phường Hải Châu II",
        "Phường Phước Ninh",
        "Phường Hòa Thuận Tây",
        "Phường Hòa Thuận Đông",
        "Phường Nam Dương",
        "Phường Bình Hiên",
        "Phường Bình Thuận",
        "Phường Hòa Cường Bắc",
        "Phường Hòa Cường Nam",
        "Phường Thạch Thang",
        "Phường Thanh Bình",
      ],
      "Quận Thanh Khê": [
        "Phường Thanh Khê Tây",
        "Phường Thanh Khê Đông",
        "Phường Xuân Hà",
        "Phường Tân Chính",
        "Phường Chính Gián",
        "Phường Vĩnh Trung",
        "Phường Thạc Gián",
        "Phường An Khê",
        "Phường Hòa Khê",
        "Phường Tam Thuận",
      ],
      "Quận Sơn Trá": [
        "Phường Thọ Quang",
        "Phường Nại Hiên Đông",
        "Phường Mân Thái",
        "Phường An Hải Bắc",
        "Phường An Hải Tây",
        "Phường An Hải Đông",
        "Phường Phước Mỹ",
      ],
      "Quận Ngũ Hành Sơn": [
        "Phường Mỹ An",
        "Phường Khuê Mỹ",
        "Phường Hòa Quý",
        "Phường Hòa Hải",
      ],
      "Quận Liên Chiểu": [
        "Phường Hòa Hiệp Bắc",
        "Phường Hòa Hiệp Nam",
        "Phường Hòa Khánh Bắc",
        "Phường Hòa Khánh Nam",
        "Phường Hòa Minh",
      ],
      "Quận Cẩm Lệ": [
        "Phường Khuê Trung",
        "Phường Hòa Phát",
        "Phường Hòa An",
        "Phường Hòa Thọ Tây",
        "Phường Hòa Thọ Đông",
        "Phường Hòa Xuân",
      ],
      "Huyện Hòa Vang": [
        "Xã Hòa Bắc",
        "Xã Hòa Liên",
        "Xã Hòa Ninh",
        "Xã Hòa Sơn",
        "Xã Hòa Nhơn",
        "Xã Hòa Phú",
        "Xã Hòa Phong",
        "Xã Hòa Châu",
        "Xã Hòa Tiến",
        "Xã Hòa Khương",
      ],
    };

    setWards(wardMap[district] || []);
  };

  return (
    <div className="space-y-6">
      {/* Street Address */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-800">
          <icons.HiOutlineHome className="inline w-4 h-4 mr-2 text-primary-600" />
          Số Nhà, Tên Đường *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <icons.FiMapPin className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="location.address.streetAddress"
            value={location.address.streetAddress}
            onChange={onChange}
            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 ${
              errors.streetAddress
                ? "border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500 animate-shake"
                : "border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-primary-200"
            }`}
            placeholder="Ví dụ: 123 Đường Nguyễn Văn Linh"
          />
        </div>
        {errors.streetAddress && (
          <p className="text-red-600 text-sm flex items-center font-medium bg-red-50 px-3 py-1.5 rounded-lg">
            <icons.BiInfoCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
            {errors.streetAddress}
          </p>
        )}
        {!errors.streetAddress && (
          <p className="text-xs text-gray-500 flex items-center">
            <icons.BiInfoCircle className="w-3 h-3 mr-1" />
            Nhập địa chỉ chi tiết bao gồm số nhà và tên đường
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">
            <icons.BsBuildings className="inline w-4 h-4 mr-2 text-primary-600" />
            Quận/Huyện *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <icons.BiMap className="w-5 h-5 text-gray-400" />
            </div>
            <select
              name="location.district"
              value={location.district}
              onChange={onChange}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 appearance-none cursor-pointer ${
                errors.district
                  ? "border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500 animate-shake"
                  : "border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-primary-200"
              }`}
            >
              <option value="">Chọn quận/huyện</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <icons.MdKeyboardArrowDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          {errors.district && (
            <p className="text-red-600 text-sm flex items-center font-medium bg-red-50 px-3 py-1.5 rounded-lg">
              <icons.BiInfoCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
              {errors.district}
            </p>
          )}
        </div>

        {/* Ward */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">
            <icons.MdLocationCity className="inline w-4 h-4 mr-2 text-primary-600" />
            Phường/Xã *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <icons.FaSearchLocation className="w-5 h-5 text-gray-400" />
            </div>
            <select
              name="location.ward"
              value={location.ward || ""}
              onChange={onChange}
              disabled={!location.district || wards.length === 0}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.ward
                  ? "border-red-500 bg-red-50 focus:ring-red-200 focus:border-red-500 animate-shake"
                  : "border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-primary-200"
              }`}
            >
              <option value="">
                {!location.district
                  ? "Chọn quận/huyện trước"
                  : "Chọn phường/xã"}
              </option>
              {wards.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <icons.MdKeyboardArrowDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          {errors.ward && (
            <p className="text-red-600 text-sm flex items-center font-medium bg-red-50 px-3 py-1.5 rounded-lg">
              <icons.BiInfoCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
              {errors.ward}
            </p>
          )}
        </div>
      </div>

      {/* City Display - Fixed to Da Nang */}
      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
            <icons.MdLocationCity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Thành Phố</h4>
            <p className="text-primary-700 font-medium">Đà Nẵng</p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center text-green-600 text-sm">
              <icons.FiCheck className="w-4 h-4 mr-1" />
              <span>Đã chọn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address Preview */}
      {location.address.streetAddress && location.district && location.ward && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
              <icons.FiMapPin className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-800">
              Địa Chỉ Hoàn Chỉnh
            </h4>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-800 font-medium text-lg flex items-center">
              <icons.HiOutlineLocationMarker className="w-5 h-5 mr-2 text-red-500" />
              {location.address.streetAddress}, {location.ward},{" "}
              {location.district}, Đà Nẵng
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center text-green-700">
              <icons.FiCheck className="w-4 h-4 mr-1" />
              <span>Địa chỉ hợp lệ</span>
            </div>
            <div className="flex items-center text-blue-600">
              <icons.BsShieldCheck className="w-4 h-4 mr-1" />
              <span>Sẵn sàng để giao nhận</span>
            </div>
          </div>
        </div>
      )}

      {/* Location Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h5 className="font-bold text-blue-800 mb-3 flex items-center">
          <icons.BiInfoCircle className="w-5 h-5 mr-2" />
          Mẹo Chọn Địa Điểm
        </h5>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <icons.FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Chọn địa điểm dễ tìm và thuận tiện cho việc giao nhận</span>
          </div>
          <div className="flex items-start space-x-2">
            <icons.HiOutlineLocationMarker className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Ưu tiên khu vực có chỗ đậu xe hoặc gần phương tiện công cộng
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <icons.BsBuildings className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Có thể gặp tại văn phòng, trung tâm thương mại hoặc địa điểm công
              cộng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
