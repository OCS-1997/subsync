import { Eye, EyeOff, Lock, User, LayoutDashboard, ShieldCheck, BarChart3, Globe, Zap, Calendar } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast, Bounce } from "react-toastify";
import { useState, useEffect } from "react";
import { loginUser } from "../authSlice";
import { getActiveFestival, getFestivalDateString } from "../../../utils/festivalThemes";
import * as LucideIcons from "lucide-react";
import SplashScreen from "../components/SplashScreen";
import { isPWA, getRememberMe } from "../../../utils/storage";

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(getRememberMe() || isPWA());
  const [festival, setFestival] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, isLoading, isAuthenticated } = useSelector((state) => state.auth);

  // Check for active festival on component mount
  useEffect(() => {
    const activeFestival = getActiveFestival();
    if (activeFestival) {
      setFestival(activeFestival);
    }
  }, []);

  const [showSplash, setShowSplash] = useState(true);


  useEffect(() => {
    if (isAuthenticated && !isLoading && !error) {
      const loggedInUsername = (typeof window !== "undefined" && JSON.parse(sessionStorage.getItem('subsync_user') || localStorage.getItem('subsync_user'))?.username)
        || '';

      toast.success("Login successful!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "colored",
        transition: Bounce,
      });

      navigate(`/${loggedInUsername}/dashboard`);
    }
  }, [isAuthenticated, isLoading, error, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(loginUser({ username, password, rememberMe }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden font-sans">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      {/* Left Panel - Branding & Visuals */}
      <div className={`hidden lg:flex lg:w-3/5 relative overflow-hidden items-center justify-center p-16 transition-colors duration-700 ${festival ? festival.colors.bg : 'bg-blue-600 dark:bg-blue-900'}`}>
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          <div className="mb-12">
            <img
              src="/logo.png"
              alt="Subsync Logo"
              className="h-12 w-auto filter brightness-0 invert mb-8 drop-shadow-lg"
            />
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              {festival ? festival.wish : <>Empower Your <span className="text-blue-200 italic">Organisation</span> Pipeline</>}
            </h1>
            <p className={`text-xl leading-relaxed max-w-lg ${festival ? 'mb-4' : 'mb-10'} ${festival ? festival.colors.accent : 'text-blue-100/90'}`}>
              {festival ? festival.subWish : "The next-generation CRM designed for scalability, intelligence, and seamless workflow management."}
            </p>
            {festival && (
              <div className="flex items-center gap-3 mb-10 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 w-fit">
                <Calendar size={16} className="text-white/80" />
                <span className="text-sm font-semibold text-white/90 tracking-wide">
                  {getFestivalDateString(festival)}
                </span>
              </div>
            )}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-transform hover:scale-105">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-200">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Advanced Analytics</h3>
                <p className="text-sm text-blue-100/70">Real-time insights for informed decisions.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-transform hover:scale-105">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-200">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Intuitive Pipeline</h3>
                <p className="text-sm text-blue-100/70">Visual deal tracking and management.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-transform hover:scale-105">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-200">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Fast Performance</h3>
                <p className="text-sm text-blue-100/70">Optimized for speed and efficiency.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-transform hover:scale-105">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-200">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Enterprise Security</h3>
                <p className="text-sm text-blue-100/70">Role-based access & data encryption.</p>
              </div>
            </div>
          </div>

          {/* Festival Icons Decoration */}
          {festival && festival.icons && (
            <div className="flex gap-4 mb-8">
              {festival.icons.map((iconName, index) => {
                const IconComponent = LucideIcons[iconName];
                return IconComponent ? (
                  <div key={index} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}>
                    <IconComponent size={32} className="text-white" />
                  </div>
                ) : null;
              })}
            </div>
          )}

          <div className="flex items-center gap-6 pt-6 border-t border-white/10">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-500/40 flex items-center justify-center text-xs text-white font-bold backdrop-blur-md">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="text-blue-100/60 text-sm italic">Trusted by OCS.</span>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-[10%] left-[10%] w-4 h-4 rounded-full bg-blue-300/20 animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[15%] w-6 h-6 rounded-full bg-blue-300/30 animate-pulse delay-700"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900 z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12 text-center">
            <img src="/logo.png" alt="Subsync Logo" className="h-10 w-auto mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Subsync CRM</h2>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Sign In</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-md animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 text-red-500 flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </div>
                <div className="text-sm text-red-800 dark:text-red-300 font-medium">
                  {error}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 transition-colors group-focus-within:text-blue-500">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl
                           text-slate-900 dark:text-white placeholder-slate-400
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl
                           text-slate-900 dark:text-white placeholder-slate-400
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 accent-blue-600 
                           hover:border-blue-500 dark:hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 
                           transition-all cursor-pointer shadow-sm"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  Keep me logged in
                  {isPWA() && (
                    <span className="ml-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      (Recommended for mobile)
                    </span>
                  )}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl
                       shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all
                       disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Festival Theme Notification */}
          {/* {festival && (
            <div className="mt-6 p-4 rounded-xl border border-dashed bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-blue-300 dark:border-slate-600 flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-600 text-white animate-pulse">
                <LucideIcons.Sparkles size={16} />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                🎉 Special {festival.name} Theme Active!
              </p>
            </div>
          )} */}

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-500 text-sm flex items-center justify-center gap-4">
              &copy; {new Date().getFullYear()} RMS. All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;