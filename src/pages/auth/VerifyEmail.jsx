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
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate(ROUTES.HOME);
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || error.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token, hasVerified, saveSession, navigate]); // Include hasVerified in dependencies

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
          {status === 'verifying' && (
            <div className="text-center animate-fade-in">
              {/* Custom loading animation */}
              <div className="mx-auto w-16 h-16 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-emerald-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Your Email</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center animate-fade-in">
              {/* Success animation */}
              <div className="mx-auto flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-scale-in">
                <div className="relative">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" className="animate-draw-check"></path>
                  </svg>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              {/* Countdown */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-green-700 mb-2">
                  🎉 Welcome to our platform!
                </p>
                <p className="text-xs text-green-600">Redirecting to home page in 3 seconds...</p>
              </div>
              
              <Link
                to={ROUTES.HOME}
                className="inline-flex items-center bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                Go to Home
              </Link>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center animate-fade-in">
              {/* Error animation */}
              <div className="mx-auto flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 animate-shake-error">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
              <p className="text-red-600 mb-6">{message}</p>
              
              {/* Error details */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700 mb-2">
                  Don't worry, this can happen for several reasons:
                </p>
                <ul className="text-xs text-red-600 text-left space-y-1">
                  <li>• The verification link may have expired</li>
                  <li>• The link may have been used already</li>
                  <li>• There might be a network issue</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <Link
                  to={ROUTES.LOGIN}
                  className="block w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                >
                  Back to Login
                </Link>
                
                <Link
                  to={ROUTES.REGISTER}
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200"
                >
                  Need to register again?
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes shake-error {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes draw-check {
          0% { stroke-dasharray: 0 20; }
          100% { stroke-dasharray: 20 0; }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-scale-in { animation: scale-in 0.8s ease-out; }
        .animate-shake-error { animation: shake-error 0.8s ease-in-out; }
        .animate-draw-check { 
          stroke-dasharray: 20;
          animation: draw-check 0.6s ease-in-out 0.3s forwards;
        }
      `}</style>
    </div>
  );
}