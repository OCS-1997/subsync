import { Eye, EyeOff, Lock, User, Snowflake, Sparkles, PartyPopper, Gift, TreePine, CandyCane, Star, Clock, Trophy, Music } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast, Bounce } from "react-toastify";
import { useState, useEffect } from "react";
import { loginUser } from "../authSlice";

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [partyMode, setPartyMode] = useState(false);
  const fullText = "Happy New Year 2026!";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, isLoading, isAuthenticated } = useSelector((state) => state.auth);

  // Easter egg: Click logo 5 times
  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);

    if (logoClicks + 1 === 5) {
      setPartyMode(true);
      toast.success("🎆 Welcome to 2026! 🥂", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      // Reset after 5 seconds
      setTimeout(() => {
        setPartyMode(false);
        setLogoClicks(0);
      }, 5000);
    }

    // Reset click counter after 2 seconds of no clicks
    setTimeout(() => {
      setLogoClicks(0);
    }, 2000);
  };

  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

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

      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 transition-colors duration-300 relative overflow-hidden">
        {/* New Year Stars/Confetti Effect */}
        <div className="stars-container" aria-hidden="true">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="star-particle">
              <Star size={Math.random() * 15 + 5} className="text-yellow-400/30 dark:text-yellow-200/20" fill="currentColor" />
            </div>
          ))}
        </div>

        {/* Left Panel - Branding */}
        <div className={`hidden lg:flex lg:w-1/2 p-12 flex-col justify-center items-center relative overflow-hidden transition-all duration-500 ${partyMode
          ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-rainbow'
          : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950'
          }`}>

          {/* Animated Festive Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className={`absolute top-20 -left-20 w-96 h-96 rounded-full blur-3xl animate-pulse ${partyMode ? 'bg-pink-400/30' : 'bg-blue-400/20'
              }`}></div>
            <div className={`absolute bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 ${partyMode ? 'bg-yellow-400/30' : 'bg-purple-400/10'
              }`}></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-2xl animate-pulse delay-500 ${partyMode ? 'bg-white/20' : 'bg-indigo-400/10'
              }`}></div>
          </div>

          {/* Floating Festive Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => {
              const Icons = [Sparkles, PartyPopper, Star, Clock, Trophy, Music];
              const Icon = Icons[i % Icons.length];
              return (
                <div
                  key={i}
                  className="absolute animate-float opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${8 + Math.random() * 12}s`,
                    color: i % 3 === 0 ? '#ffd700' : (i % 3 === 1 ? '#c0c0c0' : '#ffffff')
                  }}
                >
                  <Icon size={Math.random() * 25 + 15} />
                </div>
              );
            })}
          </div>

          {/* New Year Fireworks */}
          <div className="absolute inset-0 z-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`firework-${i} absolute text-yellow-400/40 animate-pulse`} style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
                animationDelay: `${i * 0.8}s`,
                transform: `scale(${partyMode ? 1.5 : 1})`
              }}>
                <Sparkles size={partyMode ? 60 : 30} />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 text-center space-y-8 animate-fade-in">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <img
                  src="/logo.png"
                  alt="RMS Logo"
                  onClick={handleLogoClick}
                  className={`h-10 w-auto filter brightness-0 invert cursor-pointer transition-all duration-300 hover:scale-110 ${partyMode ? 'animate-bounce drop-shadow-[0_0_15px_rgba(255,255,0,0.8)]' : 'animate-slide-down'
                    }`}
                />
                <div className="absolute -top-4 -right-4 animate-bounce">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-[10px] text-slate-900 px-2 py-0.5 rounded-full border border-yellow-200 font-bold shadow-[0_0_10px_rgba(250,204,21,0.5)]">2026</div>
                </div>
              </div>
            </div>

            {/* Typewriter Text */}
            <div className="space-y-4">
              <h1 className={`text-5xl font-bold min-h-[60px] flex flex-col items-center justify-center transition-all duration-300 ${partyMode ? 'text-yellow-300 animate-pulse' : 'text-white'
                }`}>
                <span className="text-3xl font-light opacity-90 mb-2">
                  {partyMode ? '🎉 THE GRAND' : 'Happy New Year'}
                </span>
                <span>
                  {partyMode ? '2026 KICKOFF! 🎆' : displayText}
                </span>
                {!isTypingComplete && !partyMode && <span className="animate-blink ml-1">|</span>}
              </h1>
              <p className={`text-xl leading-relaxed max-w-md mx-auto animate-fade-in-delay ${partyMode ? 'text-yellow-100' : 'text-blue-100'
                }`}>
                {partyMode
                  ? 'Ready to make this year extraordinary? Let\'s build the future together! 🚀'
                  : 'Welcome to a brand new chapter of excellence and innovation.'
                }
              </p>
            </div>

            {/* Decorative Line */}
            <div className="flex flex-col items-center gap-4 animate-fade-in-delay-2">
              <div className="flex items-center justify-center gap-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-400"></div>
                <Star className="text-yellow-400 animate-spin-slow" size={24} fill="currentColor" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-400"></div>
              </div>
              <span className="text-xs text-white/40 italic flex items-center gap-1">
                <Snowflake size={10} /> Merry Christmas to those still celebrating <Snowflake size={10} />
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white/60 text-sm animate-fade-in-delay-3 flex items-center justify-center gap-2">
              <PartyPopper size={14} className="text-yellow-400" />
              © 2026 OCS New Year Edition
              <Sparkles size={14} className="text-blue-300" />
            </p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 z-10">
          <div className="w-full max-w-md animate-slide-up">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center animate-fade-in">
              <img
                src="/logo.png"
                alt="RMS Logo"
                className="h-12 w-auto mx-auto mb-4 dark:filter dark:brightness-0 dark:invert"
              />
              <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">RMS New Year 2026</h2>
            </div>

            {/* Login Card */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border-2 border-indigo-100 dark:border-indigo-900/30 transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-200 dark:hover:border-indigo-800">
              {/* Header */}
              <div className="mb-8 animate-fade-in text-center">
                <div className="inline-block p-3 rounded-full bg-indigo-50 dark:bg-indigo-900/30 mb-4">
                  <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please sign in to your dashboard
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-shake">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-red-800 dark:text-red-300">Login Failed</div>
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="animate-fade-in-delay">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                               transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="animate-fade-in-delay-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                               transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center
                                text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400
                                focus:outline-none transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-700 
                           hover:from-indigo-700 hover:to-purple-800
                           dark:from-indigo-700 dark:to-purple-800
                           dark:hover:from-indigo-800 dark:hover:to-purple-900
                           text-white font-semibold rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                           transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           shadow-lg hover:shadow-xl hover:shadow-indigo-500/50
                           animate-fade-in-delay-3"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking list...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <PartyPopper size={20} />
                      Launch 2026
                    </span>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 animate-fade-in-delay-3">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Secure system access by RMS
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 animate-fade-in-delay-3">
              <p className="flex items-center justify-center gap-2 text-indigo-400 group cursor-help">
                <Sparkles size={14} className="group-hover:animate-spin" />
                New year, new goals? Contact Support
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-40px) rotate(20deg);
            opacity: 0.3;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }

        @keyframes rainbow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        /* Stars/Particles Styles */
        .star-particle {
          position: fixed;
          top: -10%;
          z-index: 0;
          user-select: none;
          pointer-events: none;
          animation-name: stars-fall, stars-shake;
          animation-duration: 8s, 4s;
          animation-timing-function: linear, ease-in-out;
          animation-iteration-count: infinite, infinite;
        }

        @keyframes stars-fall {
          0% { top: -5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }

        @keyframes stars-shake {
          0% { transform: translateX(0px) rotate(0deg); }
          50% { transform: translateX(50px) rotate(180deg); }
          100% { transform: translateX(0px) rotate(360deg); }
        }

        .star-particle:nth-of-type(3n) { color: #fbbf24; }
        .star-particle:nth-of-type(3n+1) { color: #818cf8; }
        .star-particle:nth-of-type(3n+2) { color: #f472b6; }

        .star-particle:nth-of-type(1) { left: 5%; animation-delay: 0s, 0s; }
        .star-particle:nth-of-type(2) { left: 15%; animation-delay: 2s, 1s; }
        .star-particle:nth-of-type(3) { left: 25%; animation-delay: 4s, 0.5s; }
        .star-particle:nth-of-type(4) { left: 35%; animation-delay: 1s, 2s; }
        .star-particle:nth-of-type(5) { left: 45%; animation-delay: 6s, 3s; }
        .star-particle:nth-of-type(6) { left: 55%; animation-delay: 3s, 1s; }
        .star-particle:nth-of-type(7) { left: 65%; animation-delay: 5s, 2.5s; }
        .star-particle:nth-of-type(8) { left: 75%; animation-delay: 2s, 0.5s; }
        .star-particle:nth-of-type(9) { left: 85%; animation-delay: 7s, 1.5s; }
        .star-particle:nth-of-type(10) { left: 95%; animation-delay: 4s, 3s; }
        /* ... more variations ... */
        .star-particle:nth-of-type(n+11) { left: calc(5% + (n * 7%)); animation-delay: calc(n * 0.5s); }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-fade-in-delay {
          animation: fadeIn 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay-2 {
          animation: fadeIn 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay-3 {
          animation: fadeIn 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }

        .animate-slide-down {
          animation: slideDown 1s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.8s ease-out forwards;
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-rainbow {
          background-size: 200% 200%;
          animation: rainbow 3s ease infinite;
        }

        .animate-spin-slow {
          animation: spin 5s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </>
  );
}

export default LoginPage;