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

  // Check if Google Client ID is configured.
  const isGoogleConfigured = GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  // Debug logging for mobile
  console.log("LoginScreen Debug:", {
    isGoogleConfigured,
    GOOGLE_CLIENT_ID,
    userAgent: navigator.userAgent,
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    windowGoogle: !!window.google
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

    // Only attempt to initialize and render the Google button if it's configured and active.
    if (window.google && !showFightNameLogin) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with' }
          );
        }
      } catch (e) {
        console.error("Google GSI error:", e);
        setError("Could not initialize Google Sign-In.");
      }
    }
  }, [isGoogleConfigured, showFightNameLogin]);
  
  const inputStyles = "block w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-all duration-200";
  const labelStyles = "block text-sm font-medium text-gray-300 mb-2";

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
              className="w-full p-3 font-bold text-white bg-fuchsia-600 rounded-lg hover:bg-fuchsia-500 disabled:bg-zinc-600 transition-colors duration-200"
          >
              Sign In
          </button>
           {isGoogleConfigured && (
               <p className="text-center text-sm">
                  <button type="button" onClick={() => setShowFightNameLogin(false)} className="font-medium text-fuchsia-400 hover:text-fuchsia-300">
                      Back to sign-in options
                  </button>
              </p>
           )}
      </form>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-900 p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-zinc-800 rounded-2xl shadow-lg border border-zinc-700">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-white tracking-wider">SOUL GOOD BOXING</h1>
          <p className="mt-2 text-fuchsia-400">Log in to meet your coach, Sammi.</p>
        </div>
        
        {error && <p className="text-red-400 text-center font-semibold pt-2">{error}</p>}

        {!isGoogleConfigured || showFightNameLogin ? (
            fightNameForm
        ) : (
             <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                <div ref={googleButtonRef}></div>
                <div className="inline-flex items-center justify-center w-full">
                    <hr className="w-full h-px my-4 bg-zinc-600 border-0" />
                    <span className="absolute px-3 font-medium text-zinc-400 -translate-x-1/2 bg-zinc-800 left-1/2">OR</span>
                </div>
                <button
                    onClick={() => { setShowFightNameLogin(true); setError(null); }}
                    className="w-full text-center font-semibold text-zinc-200 bg-zinc-700/80 border border-zinc-600 rounded-lg px-4 py-2 hover:bg-zinc-700 transition-all duration-200"
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