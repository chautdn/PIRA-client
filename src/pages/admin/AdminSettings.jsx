import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import icons from '../../utils/icons';

const { FiSettings, FiSun, FiMoon, FiMonitor, BiCheckCircle, FiBell, FiShield, FiDatabase, FiGlobe, FiUser } = icons;

const AdminSettings = () => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme } = useTheme();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    maintenanceMode: false,
    autoBackup: true,
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh'
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    // Save settings to backend
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FiSettings className="text-3xl" />
          <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
        </div>
        <p className="text-indigo-100">Quản lý các thiết lập và tùy chỉnh hệ thống PIRA</p>
      </div>

      {/* Save Button - Sticky */}
      {saved && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-down z-50">
          <BiCheckCircle className="text-xl" />
          <span className="font-medium">Đã lưu cài đặt!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appearance Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <FiSun className="text-xl text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Giao diện</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Chế độ màu sắc
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {/* Light Theme */}
                  <button
                    onClick={setLightTheme}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FiSun className={`text-3xl mx-auto mb-2 ${
                      theme === 'light' ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <p className={`text-sm font-medium ${
                      theme === 'light' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      Sáng
                    </p>
                    {theme === 'light' && (
                      <BiCheckCircle className="text-blue-500 mx-auto mt-2" />
                    )}
                  </button>

                  {/* Dark Theme */}
                  <button
                    onClick={setDarkTheme}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FiMoon className={`text-3xl mx-auto mb-2 ${
                      theme === 'dark' ? 'text-purple-500' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <p className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-purple-700 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      Tối
                    </p>
                    {theme === 'dark' && (
                      <BiCheckCircle className="text-purple-500 mx-auto mt-2" />
                    )}
                  </button>

                  {/* Auto Theme */}
                  <button
                    className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <FiMonitor className="text-3xl mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tự động
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Sắp có</p>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Xem trước</p>
                <div className="space-y-2">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 dark:text-white font-medium">Card mẫu</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Preview</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Đây là cách giao diện sẽ hiển thị với chế độ {theme === 'dark' ? 'tối' : 'sáng'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <FiBell className="text-xl text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thông báo</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email thông báo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo qua email</p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Thông báo đẩy trên trình duyệt</p>
                </div>
                <button
                  onClick={() => handleToggle('pushNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <FiShield className="text-xl text-green-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hệ thống</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Chế độ bảo trì</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tạm dừng truy cập cho người dùng</p>
                </div>
                <button
                  onClick={() => handleToggle('maintenanceMode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Tự động sao lưu</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Backup dữ liệu hàng ngày</p>
                </div>
                <button
                  onClick={() => handleToggle('autoBackup')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoBackup ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <FiDatabase className="text-3xl mb-3" />
            <h3 className="text-lg font-bold mb-2">Thông tin hệ thống</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-100">Phiên bản:</span>
                <span className="font-semibold">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Database:</span>
                <span className="font-semibold">MongoDB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Trạng thái:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Language & Region */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <FiGlobe className="text-xl text-purple-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Vùng & Ngôn ngữ</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngôn ngữ
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Múi giờ
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <BiCheckCircle className="text-xl" />
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
