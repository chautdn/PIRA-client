import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/auth';
import Loading from '../../components/common/Loading';
import { ROUTES } from '../../utils/constants';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');
  const [hasVerified, setHasVerified] = useState(false); // Prevent multiple calls
  const { saveSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent multiple API calls
      if (hasVerified || !token) {
        if (!token) {
          setStatus('error');
          setMessage('Verification token not found');
        }
        return;
      }

      setHasVerified(true); // Mark as attempting verification

      try {
        const response = await authService.verifyEmail(token);
        saveSession(response.data);
        setStatus('success');
        setMessage(response.data?.message || 'Email verified successfully!');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate(ROUTES.DASHBOARD);
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || error.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token, hasVerified, saveSession, navigate]); // Include hasVerified in dependencies

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'verifying' && (
            <div>
              <Loading message="Verifying your email..." />
            </div>
          )}
          
          {status === 'success' && (
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard in 3 seconds...</p>
              <Link
                to={ROUTES.DASHBOARD}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 mt-4"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
          
          {status === 'error' && (
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
              <p className="text-red-600 mb-6">{message}</p>
              <div className="space-y-4">
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Back to Login
                </Link>
                <div>
                  <Link
                    to={ROUTES.REGISTER}
                    className="text-blue-600 hover:text-blue-500 text-sm"
                  >
                    Need to register again?
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}