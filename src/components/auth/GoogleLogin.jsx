import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import auth from '../../services/auth';
import { API_CONFIG } from '../../utils/constants';
import { navigateByRole } from '../../utils/navigation';

const GoogleLogin = ({ onSuccess, onError }) => {
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google || !window.google.accounts || isInitialized.current)
        return;

      try {
        window.google.accounts.id.initialize({
          client_id: API_CONFIG.CLIENT_ID_GG,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "signin_with",
            width: 300,
          });
        }
        isInitialized.current = true;
      } catch (error) {
        console.error("Google Sign-In initialization error:", error);
        if (onError) onError("Failed to initialize Google Sign-In");
      }
    };

    initializeGoogle();
    if (!isInitialized.current) {
      const timer = setTimeout(initializeGoogle, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const result = await auth.googleLogin(response.credential);
      console.log('Google login successful:', result);
      
      saveSession(result.data);
      
      const user = result.data?.data?.user || result.data?.user;
      
      // Call success callback
      if (onSuccess) onSuccess(user);
      
      // Navigate based on user role
      navigateByRole(navigate, user);
      
    } catch (error) {
      console.error("Google login error:", error);
      const errorMsg =
        error.response?.data?.message || error.message || "Google login failed";
      if (onError) onError(errorMsg);
    }
  };

  return (
    <div className="flex justify-center my-4">
      <div ref={buttonRef}></div>
    </div>
  );
};

export default GoogleLogin;
