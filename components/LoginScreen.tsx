import React, { useEffect, useRef, useState } from 'react';
import type { User } from '../types';
import { GOOGLE_CLIENT_ID } from '../constants';

// Add a declaration for the google object from the GSI script
declare global {
  interface Window {
    google: any;
  }
}

/**
 * Decodes a JWT token to extract its payload.
 * This is a simple implementation for demonstration purposes and does not validate the signature.
 * @param token The JWT token string.
 * @returns The decoded payload object.
 */
function jwt_decode(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
}

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fightName, setFightName] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check if Google Client ID is configured.
  const isGoogleConfigured = GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  // Debug logging for mobile
  console.log("LoginScreen Debug:", {
    isGoogleConfigured,
    GOOGLE_CLIENT_ID,
    userAgent: navigator.userAgent,
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    windowGoogle: !!window.google,
    googleLoaded,
    retryCount
  });

  // Default to username login if Google is not configured to avoid showing a broken button.
  const [showFightNameLogin, setShowFightNameLogin] = useState(!isGoogleConfigured);

  const handleCredentialResponse = (response: any) => {
    if (response.credential) {
      const decodedToken = jwt_decode(response.credential);
      if (decodedToken) {
        onLogin({
          id: decodedToken.sub, // 'sub' is the unique user ID from Google
          name: decodedToken.given_name || decodedToken.name, // Use given_name or fallback to name
        });
      } else {
        setError("Failed to process Google login. Please try again.");
      }
    }
  };
  
  const handleFightNameLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors on new submission

    if (!fightName.trim()) {
      setError("Fight Name cannot be empty.");
      return;
    }

    // If validation passes
    onLogin({
        id: fightName.trim().toLowerCase(), // Use fight name as a unique ID
        name: fightName.trim(),
    });
  };

  useEffect(() => {
    // If Google isn't configured, show an info message and stop.
    if (!isGoogleConfigured) {
        setError("Google Login is not set up. Please use a Fight Name to continue.");
        return;
    }

    // Check if Google is loaded
    if (window.google && !googleLoaded) {
      setGoogleLoaded(true);
      console.log("Google API loaded successfully");
    }

    // Only attempt to initialize and render the Google button if it's configured and active.
    if (window.google && !showFightNameLogin && googleButtonRef.current) {
      try {
        // Clear any existing button first
        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = '';
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with' }
        );
        
        console.log("Google Sign-In button rendered successfully");
      } catch (e) {
        console.error("Google GSI error:", e);
        setError("Could not initialize Google Sign-In.");
      }
    }
  }, [isGoogleConfigured, showFightNameLogin, googleLoaded]);

  // Retry mechanism for Google loading
  useEffect(() => {
    if (!isGoogleConfigured || googleLoaded) return;

    const checkGoogle = () => {
      if (window.google) {
        setGoogleLoaded(true);
        console.log("Google API loaded on retry");
      } else if (retryCount < 10) {
        setRetryCount(prev => prev + 1);
        setTimeout(checkGoogle, 500);
      } else {
        console.error("Google API failed to load after 10 retries");
        setError("Google Sign-In is taking too long to load. Please use Fight Name login.");
      }
    };

    const timer = setTimeout(checkGoogle, 100);
    return () => clearTimeout(timer);
  }, [isGoogleConfigured, googleLoaded, retryCount]);
  
  const inputStyles = "block w-full bg-white border border-orange-200 rounded-lg p-3 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition-all duration-200";
  const labelStyles = "block text-sm font-bold text-gray-900 mb-2";

  const fightNameForm = (
      <form onSubmit={handleFightNameLogin} className="space-y-4 pt-4">
           <div>
              <label htmlFor="fightname" className={labelStyles}>
                  Fight Name
              </label>
              <input
                  id="fightname"
                  type="text"
                  value={fightName}
                  onChange={(e) => {
                      setFightName(e.target.value);
                      setError(null);
                  }}
                  className={inputStyles}
                  placeholder="e.g., The Hurricane"
                  autoFocus
              />
          </div>
          <button
              type="submit"
              className="w-full p-3 font-bold text-gray-900 bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 border border-orange-300 rounded-lg"
          >
              Sign In
          </button>
           {isGoogleConfigured && (
               <p className="text-center text-sm">
                  <button type="button" onClick={() => setShowFightNameLogin(false)} className="font-medium text-orange-700 hover:text-orange-900">
                      Back to sign-in options
                  </button>
               </p>
           )}
      </form>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white border border-gray-300 rounded-lg">
        <div className="text-center border-b border-orange-200 pb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-wider">SOUL GOOD BOXING</h1>
          <p className="mt-2 text-orange-700 font-semibold">Log in to meet your coach, Sammi.</p>
        </div>
        
        {error && <p className="text-rose-800 text-center font-semibold pt-2 bg-rose-50 p-3 border border-rose-200 rounded-lg">{error}</p>}

        {!isGoogleConfigured || showFightNameLogin ? (
            fightNameForm
        ) : (
             <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                {!googleLoaded && retryCount < 10 ? (
                  <div className="flex items-center space-x-2 text-orange-700">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    <span className="text-sm font-semibold">Loading Google Sign-In...</span>
                  </div>
                ) : (
                  <div ref={googleButtonRef}></div>
                )}
                <div className="inline-flex items-center justify-center w-full">
                    <hr className="w-full h-px my-4 bg-orange-200 border-0" />
                    <span className="absolute px-3 font-medium text-orange-700 -translate-x-1/2 bg-white left-1/2">OR</span>
                </div>
                <button
                    onClick={() => { setShowFightNameLogin(true); setError(null); }}
                    className="w-full text-center font-semibold text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 rounded-lg px-4 py-2 hover:from-orange-100 hover:to-amber-100 hover:border-orange-400 transition-all duration-200"
                >
                    Sign in with Fight Name
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;