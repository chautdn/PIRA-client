import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks/useI18n';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">P</span>
              </div>
              <span className="text-2xl font-extrabold text-white">{t('footer.brand')}</span>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              {['📘', '📷', '🐦', '📺'].map((icon, idx) => (
                <button
                  key={idx}
                  className="w-10 h-10 bg-white/10 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                >
                  <span className="text-xl">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cho Người Thuê */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.forRenters.title')}</h3>
            <ul className="space-y-3">
              {[
                t('footer.forRenters.browse'),
                t('footer.forRenters.howItWorks'),
                t('footer.forRenters.safetyInsurance'),
                t('footer.forRenters.customerSupport'),
                t('footer.forRenters.faq'),
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    to="#"
                    className="text-gray-300 hover:text-primary-400 transition-colors inline-flex items-center group"
                  >
                    <span className="mr-2 text-primary-500 group-hover:translate-x-1 transition-transform">→</span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cho Chủ Thiết Bị */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.forOwners.title')}</h3>
            <ul className="space-y-3">
              {[
                t('footer.forOwners.listEquipment'),
                t('footer.forOwners.manageOrders'),
                t('footer.forOwners.incomePayment'),
                t('footer.forOwners.equipmentInsurance'),
                t('footer.forOwners.ownerCenter'),
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    to="#"
                    className="text-gray-300 hover:text-primary-400 transition-colors inline-flex items-center group"
                  >
                    <span className="mr-2 text-primary-500 group-hover:translate-x-1 transition-transform">→</span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Công Ty */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('footer.company.title')}</h3>
            <ul className="space-y-3">
              {[
                t('footer.company.aboutUs'),
                t('footer.company.contact'),
                t('footer.company.blog'),
                t('footer.company.privacyPolicy'),
                t('footer.company.termsOfService'),
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    to="#"
                    className="text-gray-300 hover:text-primary-400 transition-colors inline-flex items-center group"
                  >
                    <span className="mr-2 text-primary-500 group-hover:translate-x-1 transition-transform">→</span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact Info */}
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span>📧</span>
                <span>{t('footer.contact.email')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>{t('footer.contact.phone')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              {t('footer.copyright')}
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link to="#" className="hover:text-primary-400 transition-colors">
                {t('footer.company.privacyPolicy')}
              </Link>
              <Link to="#" className="hover:text-primary-400 transition-colors">
                {t('footer.company.termsOfService')}
              </Link>
              <Link to="#" className="hover:text-primary-400 transition-colors">
                {t('footer.sitemap')}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>🌐</span>
              <select className="bg-transparent border border-gray-600 rounded px-2 py-1 text-gray-300 hover:border-primary-500 transition-colors">
                <option value="vi">{t('footer.language')}</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}



