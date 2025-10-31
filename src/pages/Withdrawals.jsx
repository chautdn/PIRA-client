import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Lock,
  CreditCard,
  CheckCircle,
  Plus,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import BankAccountForm from "../components/wallet/BankAccountForm";
import WithdrawalModal from "../components/wallet/WithdrawalModal";
import userService from "../services/user.Api";
import toast from "react-hot-toast";

const Withdrawals = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showBankForm, setShowBankForm] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check what the user is missing
  const isKycVerified = user?.cccd?.isVerified === true;
  const hasBankAccount = bankAccount && bankAccount.accountNumber;

  // Refresh user data on mount to get latest KYC status
  useEffect(() => {
    const initializeData = async () => {
      if (refreshUser) {
        await refreshUser();
      }
      if (user) {
        fetchBankAccount();
      }
    };
    initializeData();
  }, []);

  const fetchBankAccount = async () => {
    try {
      const response = await userService.getBankAccount();
      console.log("📊 Bank account response:", response.data);
      // Response structure: { status, message, data: { bankAccount: {...} } }
      const account =
        response.data?.data?.bankAccount || response.data?.bankAccount;
      console.log("🏦 Bank account:", account);
      setBankAccount(account);
    } catch (error) {
      // No bank account yet, which is fine
      if (error.response?.status !== 404) {
        console.error("Error fetching bank account:", error);
      }
      setBankAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBankAccountAdded = async () => {
    setShowBankForm(false);
    await fetchBankAccount();
    await refreshUser?.();
    toast.success("Bank account added! You can now request withdrawals.");
  };

  const handleWithdrawalSuccess = async () => {
    // Refresh user data and close modal
    await refreshUser?.();
    setShowWithdrawalModal(false);
    // TODO: Refresh withdrawal history when we add that component
  };

  const handleGoToKyc = () => {
    navigate("/profile", { state: { openKyc: true } });
  };

  // Step-by-step requirements checklist
  const renderRequirementChecklist = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Before You Can Withdraw
        </h2>
        <div className="space-y-4">
          {/* Step 1: KYC */}
          <div
            className={`flex items-start space-x-3 p-3 rounded-lg ${
              isKycVerified ? "bg-green-50" : "bg-gray-50"
            }`}
          >
            <div
              className={`flex-shrink-0 mt-0.5 ${
                isKycVerified ? "text-green-600" : "text-gray-400"
              }`}
            >
              {isKycVerified ? <CheckCircle size={20} /> : <Lock size={20} />}
            </div>
            <div className="flex-1">
              <h3
                className={`text-sm font-medium ${
                  isKycVerified ? "text-green-900" : "text-gray-900"
                }`}
              >
                Step 1: Complete KYC Verification
              </h3>
              <p
                className={`text-sm mt-1 ${
                  isKycVerified ? "text-green-700" : "text-gray-600"
                }`}
              >
                {isKycVerified
                  ? "✓ Your identity has been verified"
                  : "Verify your identity to unlock withdrawals"}
              </p>
              {!isKycVerified && (
                <button
                  onClick={handleGoToKyc}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Complete KYC Verification →
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Bank Account */}
          <div
            className={`flex items-start space-x-3 p-3 rounded-lg ${
              hasBankAccount
                ? "bg-green-50"
                : isKycVerified
                ? "bg-gray-50"
                : "bg-gray-100 opacity-60"
            }`}
          >
            <div
              className={`flex-shrink-0 mt-0.5 ${
                hasBankAccount
                  ? "text-green-600"
                  : isKycVerified
                  ? "text-gray-400"
                  : "text-gray-300"
              }`}
            >
              {hasBankAccount ? (
                <CheckCircle size={20} />
              ) : (
                <CreditCard size={20} />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`text-sm font-medium ${
                  hasBankAccount
                    ? "text-green-900"
                    : isKycVerified
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                Step 2: Add Bank Account
              </h3>
              <p
                className={`text-sm mt-1 ${
                  hasBankAccount
                    ? "text-green-700"
                    : isKycVerified
                    ? "text-gray-600"
                    : "text-gray-500"
                }`}
              >
                {hasBankAccount
                  ? `✓ ${bankAccount.bankName} - ${bankAccount.accountNumber}`
                  : isKycVerified
                  ? "Link your Vietnamese bank account for withdrawals"
                  : "Complete KYC verification first"}
              </p>
              {!hasBankAccount && isKycVerified && (
                <button
                  onClick={() => setShowBankForm(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add Bank Account →
                </button>
              )}
              {hasBankAccount && (
                <button
                  onClick={() => setShowBankForm(true)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Edit Bank Account
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ready to withdraw message */}
        {isKycVerified && hasBankAccount && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="text-blue-600 mr-2" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  You're all set! You can now request withdrawals.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Withdrawals</h1>
        <p className="mt-2 text-gray-600">
          Withdraw funds from your PIRA wallet to your bank account
        </p>
      </div>

      {/* Requirements Checklist */}
      {renderRequirementChecklist()}

      {/* Bank Account Form Modal */}
      {showBankForm && (
        <BankAccountForm
          key={bankAccount?.accountNumber || "new-bank-account"}
          existingAccount={bankAccount}
          onSuccess={handleBankAccountAdded}
          onCancel={() => setShowBankForm(false)}
          isModal={true}
        />
      )}

      {/* Withdrawal Request Modal */}
      {showWithdrawalModal && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={handleWithdrawalSuccess}
          bankAccount={bankAccount}
        />
      )}

      {/* Main Content - Withdrawal History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Withdrawal History
            </h2>
            {isKycVerified && hasBankAccount && (
              <button
                type="button"
                onClick={() => setShowWithdrawalModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Request Withdrawal
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No withdrawals yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isKycVerified && hasBankAccount
                ? 'Click "Request Withdrawal" to get started'
                : "Complete the steps above to start withdrawing"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdrawals;
