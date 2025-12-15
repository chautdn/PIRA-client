import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../hooks/useI18n";
import icons from "../utils/icons";

const TermsAndConditions = () => {
  const { t } = useI18n();

  useEffect(() => {
    document.title = t("termsPage.title") + " - PIRA";
    window.scrollTo(0, 0);
  }, [t]);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 py-16">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-6">
              <icons.BiShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("termsPage.title")}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t("termsPage.subtitle")}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              {t("termsPage.lastUpdated")}: {t("termsPage.lastUpdatedDate")}
            </p>
          </div>
        </motion.div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-8 space-y-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          {/* Section 1: Introduction */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <icons.BiBookmark className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t("termsPage.section1Title")}
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {t("termsPage.section1Content")}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 2: User Accounts */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <icons.BiUser className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t("termsPage.section2Title")}
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section2Point1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section2Point2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section2Point3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section2Point4")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 3: Product Listing */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <icons.BiPackage className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t("termsPage.section3Title")}
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section3Point1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section3Point2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section3Point3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section3Point4")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 4: Payments & Fees */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <icons.HiCash className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t("termsPage.section4Title")}
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section4Point1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section4Point2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section4Point3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section4Point4")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 5: Promotions */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <icons.BiTrendingUp className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t("termsPage.section5Title")}
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section5Point1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section5Point2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section5Point3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.FiCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section5Point4")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 6: Prohibited Activities */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <icons.BiError className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t("termsPage.section6Title")}
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <icons.BiX className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section6Point1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.BiX className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section6Point2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.BiX className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section6Point3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <icons.BiX className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{t("termsPage.section6Point4")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 7: Contact */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <icons.BiEnvelope className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t("termsPage.section7Title")}
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {t("termsPage.section7Content")}
                </p>
                <div className="mt-4 space-y-2">
                  <p className="flex items-center gap-2 text-gray-700">
                    <icons.BiEnvelope className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Email:</span> support@pira.vn
                  </p>
                  <p className="flex items-center gap-2 text-gray-700">
                    <icons.BiPhone className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Hotline:</span> 1900 1234
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Notice */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 mt-8">
            <div className="flex items-start gap-3">
              <icons.BiInfoCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-primary-900 mb-2">
                  {t("termsPage.agreementTitle")}
                </h3>
                <p className="text-primary-800">
                  {t("termsPage.agreementContent")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default TermsAndConditions;
