import { Eye, EyeOff, Terminal } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer, Bounce } from 'react-toastify';
import { useState, useEffect } from 'react';

import { loginUser } from '../authSlice';

import 'react-toastify/dist/ReactToastify.css';


function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, isLoading, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !isLoading && !error) {
      const loggedInUsername = (typeof window !== "undefined" && JSON.parse(sessionStorage.getItem('subsync_user'))?.username)
        || '';
      
      toast.success("Login successful!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });

      navigate(`/${loggedInUsername}/dashboard`);
    }
  }, [isAuthenticated, isLoading, error, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(loginUser({ username, password }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <>
      <div className={`min-h-screen flex items-center justify-center transition-all duration-1000 relative overflow-hidden ${
        showPassword ? 'bg-black' : 'bg-gradient-to-tl from-blue-50 via-blue-100 to-blue-200'
      }`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 40%, #e0e7ff 20%, transparent 60%), radial-gradient(circle at 80% 70%, #bae6fd 20%, transparent 60%)",
      }}>

        {/* Enhanced Torch Beam Effect */}
        {showPassword && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Main torch beam cone */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-40"
              style={{
                width: '600px',
                height: '600px',
                background: `conic-gradient(from 270deg at 50% 0%, 
                  transparent 0deg,
                  rgba(255, 255, 150, 0.3) 40deg,
                  rgba(255, 255, 200, 0.5) 60deg,
                  rgba(255, 255, 255, 0.7) 90deg,
                  rgba(255, 255, 200, 0.5) 120deg,
                  rgba(255, 255, 150, 0.3) 140deg,
                  transparent 180deg)`,
                borderRadius: '50%',
                animation: 'torchSway 4s ease-in-out infinite'
              }}
            />

            {/* Inner bright cone */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-60"
              style={{
                width: '400px',
                height: '400px',
                background: `conic-gradient(from 270deg at 50% 0%, 
                  transparent 0deg,
                  rgba(255, 255, 100, 0.4) 50deg,
                  rgba(255, 255, 255, 0.8) 90deg,
                  rgba(255, 255, 100, 0.4) 130deg,
                  transparent 180deg)`,
                borderRadius: '50%',
                animation: 'torchSway 4s ease-in-out infinite reverse'
              }}
            />

            {/* Torch source (flashlight position) */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div 
                  className="w-6 h-12 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded-lg shadow-lg opacity-80"
                  style={{
                    boxShadow: '0 0 30px rgba(255, 255, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)'
                  }}
                />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-yellow-100 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Additional light rays */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-96 h-96">
                {[...Array(16)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 origin-left h-px bg-gradient-to-r from-yellow-200/50 via-white/40 to-transparent"
                    style={{
                      width: `${200 + Math.sin(i * 0.5) * 50}px`,
                      transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)`,
                      animation: `rayPulse 3s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Floating light particles */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
                  style={{
                    left: `${30 + (i * 8)}%`,
                    top: `${40 + Math.sin(i) * 20}%`,
                    animation: `float 4s ease-in-out infinite`,
                    animationDelay: `${i * 0.5}s`,
                    opacity: 0.7
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dark overlay for dramatic effect */}
        {showPassword && (
          <div
            className="absolute inset-0 z-5 pointer-events-none transition-opacity duration-1000"
            style={{
              background: `radial-gradient(ellipse 800px 400px at center 30%,
                transparent 0%,
                transparent 25%,
                rgba(0, 0, 0, 0.4) 45%,
                rgba(0, 0, 0, 0.8) 65%,
                rgba(0, 0, 0, 0.95) 85%,
                rgba(0, 0, 0, 1) 100%)`
            }}
          />
        )}

        {/* Landing Image (replaces Login Button) */}
        <div className="flex items-center justify-center w-full h-full absolute top-0 left-0 z-30">
          {!showForm && (
           <img
            src="../landing_image.webp"
            alt="Landing Image "
            className={`landing-img  transition-all duration-700
              ${showForm ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}
            `}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transition: 'all 0.7s cubic-bezier(.68,-0.55,.27,1.55)'
            }}
            onClick={() => setShowForm(true)}
            />
          )}
        </div>

        {/* Animated Login Form */}
        <div className={`absolute left-1/2 top-1/2 z-40 transition-all duration-700
          ${showForm ? 'login-morph-form--open' : 'login-morph-form--closed'}
        `}
          style={{
            transform: showForm
              ? 'translate(-50%, -50%) scale(1)'
              : 'translate(-50%, -50%) scale(0.2)',
            opacity: showForm ? 1 : 0,
            pointerEvents: showForm ? 'auto' : 'none',
            transition: 'all 0.7s cubic-bezier(.68,-0.55,.27,1.55)'
          }}
        >
          {showForm && (
            <form
              className={`w-80 max-w-md p-6 rounded-lg transition-all duration-1000 relative z-20 ${
                showPassword
                  ? 'bg-gradient-to-b from-gray-900/95 to-black/95 border-2 border-yellow-400/40 shadow-[0_0_80px_rgba(255,255,0,0.4)] backdrop-blur-sm'
                  : 'bg-white shadow-lg border border-gray-200'
              }`}
              style={{
                animation: showPassword ? 'formGlow 2s ease-in-out infinite alternate' : 'none'
              }}
              onSubmit={handleSubmit}
            >
              <div className="mb-6">
                <h1 className={`text-2xl font-bold text-center transition-all duration-1000 ${
                  showPassword ? 'text-yellow-200 text-shadow-lg' : 'text-gray-900'
                }`}>
                  Sign In
                </h1>
              </div>
              <div className="mb-6">
                {error && (
                  <div className={`mb-4 p-3 border rounded flex items-center transition-all duration-700 ${
                    showPassword 
                      ? 'bg-red-900/80 border-red-500/50 text-red-300'
                      : 'bg-red-100 border-red-400 text-red-700'
                  }`}>
                    <Terminal className="h-4 w-4 mr-2" />
                    <div>
                      <div className="font-semibold">Login Failed!</div>
                      <div className="text-sm">{error}</div>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className={`block text-sm font-medium transition-all duration-1000 ${
                      showPassword ? 'text-yellow-100' : 'text-gray-700'
                    }`}>
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter username"
                      className={`w-full px-3 py-2 border-2 rounded-md shadow-sm transition-all duration-1000 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                        showPassword
                          ? 'bg-gray-800/60 text-yellow-100 border-yellow-400/40 focus:border-yellow-400 focus:ring-yellow-400 backdrop-blur-sm'
                          : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className={`block text-sm font-medium transition-all duration-1000 ${
                      showPassword ? 'text-yellow-100' : 'text-gray-700'
                    }`}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        className={`w-full px-3 py-2 pr-10 border-2 rounded-md shadow-sm transition-all duration-1000 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                          showPassword
                            ? 'bg-yellow-50/15 text-yellow-100 border-yellow-400/60 focus:border-yellow-300 focus:ring-yellow-300 shadow-[0_0_30px_rgba(255,255,0,0.3)] backdrop-blur-sm'
                            : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        required
                      />
                      <button
                        type="button"
                        onKeyDown={handleKeyDown}
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-500 z-30 focus:outline-none hover:scale-110 ${
                          showPassword ? 'text-yellow-300' : 'text-gray-500'
                        }`}
                      >
                        {showPassword ? (
                          <div className="relative">
                            <EyeOff className="h-4 w-4" />
                            <div className="absolute inset-0 bg-yellow-300/40 blur-sm rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 bg-yellow-400/20 blur-lg rounded-full animate-pulse"></div>
                          </div>
                        ) : (
                          <Eye className="h-4 w-4 hover:text-gray-400 transition-colors" />
                        )}
                      </button>

                      {/* Enhanced password field glow effect */}
                      {showPassword && (
                        <div className="absolute inset-0 pointer-events-none rounded-md">
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 via-yellow-300/10 to-yellow-200/20 animate-shimmer rounded-md"></div>
                          <div className="absolute inset-0 border border-yellow-400/30 rounded-md animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded-md font-medium transition-all duration-1000 focus:outline-none focus:ring-2 focus:ring-opacity-50 transform hover:scale-105 ${
                      showPassword
                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-[0_0_30px_rgba(255,255,0,0.4)] focus:ring-yellow-400'
                        : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes beam-pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.2);
          }
        }

        @keyframes torchSway {
          0%, 100% {
            transform: translate(-50%, -50%) rotate(-2deg) scale(1);
          }
          25% {
            transform: translate(-48%, -52%) rotate(1deg) scale(1.05);
          }
          50% {
            transform: translate(-52%, -48%) rotate(-1deg) scale(0.98);
          }
          75% {
            transform: translate(-50%, -51%) rotate(1.5deg) scale(1.02);
          }
        }

        @keyframes rayPulse {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scaleX(1);
          }
          25% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scaleX(1.2);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scaleX(0.9);
          }
          75% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scaleX(1.1);
          }
        }

        @keyframes formGlow {
          0% {
            box-shadow: 0 0 80px rgba(255, 255, 0, 0.4), 0 0 40px rgba(255, 255, 0, 0.2) inset;
          }
          100% {
            box-shadow: 0 0 100px rgba(255, 255, 0, 0.6), 0 0 60px rgba(255, 255, 0, 0.3) inset;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.7;
          }
          25% {
            transform: translateY(-10px) scale(1.1);
            opacity: 1;
          }
          50% {
            transform: translateY(-5px) scale(0.9);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-15px) scale(1.05);
            opacity: 0.9;
          }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .animate-beam-pulse {
          animation: beam-pulse 2s infinite;
        }

        .text-shadow-lg {
          text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
        }
        /* Morphing animation classes */
        .login-morph-btn {
          z-index: 50;
        }
        .login-morph-form--closed {
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, -50%) scale(0.2);
        }
        .login-morph-form--open {
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, -50%) scale(1);
        }

        .landing-img {
          box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 1.5px 8px rgba(0,0,0,0.10);
        }
        .landing-img:active {
          filter: brightness(0.97) blur(0.5px);
        }
      `}</style>
    </>
  );
}

export default LoginPage;