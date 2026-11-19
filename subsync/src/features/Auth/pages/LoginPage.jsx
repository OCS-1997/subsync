import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Calendar, 
  Sparkles, 
  Sun, 
  Moon, 
  ArrowRight,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Zap,
  BarChart3
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from '@/utils/toast';
import { loginUser } from "../authSlice";
import { getActiveFestival, getFestivalDateString } from "../../../utils/festivalThemes";
import SplashScreen from "../components/SplashScreen";
import { isPWA, getRememberMe } from "../../../utils/storage";
import { useTheme } from "@/context/ThemeContext";

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(getRememberMe() || isPWA());
  const [festival, setFestival] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark" || (typeof document !== 'undefined' && document.documentElement.classList.contains("dark"));

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { error, isLoading, isAuthenticated, user } = useSelector((state) => state.auth);

  // Check for active festival on component mount
  useEffect(() => {
    const activeFestival = getActiveFestival();
    if (activeFestival) {
      setFestival(activeFestival);
    }
  }, []);

  // Avoid "Login successful" toast on initial load when already authenticated
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isAuthenticated && !isLoading && !error && user) {
      if (!isInitialMount.current) {
        toast.success("Login successful!", {
          description: `Welcome back${user.username ? `, ${user.username}` : ''}`,
          confetti: true,
          duration: 2000,
        });
      }
      if (redirect) {
        const cleanRedirect = redirect.startsWith('/') ? redirect.slice(1) : redirect;
        const targetPath = cleanRedirect.includes('dashboard')
          ? cleanRedirect.replace(/^[^/]+\/dashboard/, 'dashboard')
          : cleanRedirect;
        navigate(`/${user.username}/${targetPath}`);
      } else {
        navigate(`/${user.username}/dashboard`);
      }
    }
    isInitialMount.current = false;
  }, [isAuthenticated, isLoading, error, user, navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }
    await dispatch(loginUser({ username: username.trim(), password, rememberMe }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden font-sans">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Left Panel - Centered Branding / Festival Panel */}
      <div 
        className={`hidden lg:flex lg:w-3/5 relative overflow-hidden items-center justify-center p-12 xl:p-16 transition-colors duration-700 ${
          festival 
            ? `${festival.colors.bg}` 
            : 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950'
        }`}
      >
        {/* Ambient Glow Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl ${
            festival ? (festival.colors.glow || 'bg-white/10') : 'bg-white/10 dark:bg-blue-500/10'
          }`} />
          <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl ${
            festival ? (festival.colors.glow || 'bg-white/10') : 'bg-indigo-400/10 dark:bg-indigo-600/10'
          }`} />

          {/* Minimalist Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.035] dark:opacity-[0.045]"
            style={{ 
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
              backgroundSize: '36px 36px' 
            }} 
          />
        </div>

        {/* Content Container - Clean & Centered */}
        <div className="relative z-10 w-full max-w-lg text-center flex flex-col items-center justify-center">
          {/* OCS Logo with crisp white background badge */}
          <div className="mb-8 p-3 sm:p-3.5 px-6 sm:px-7 rounded-2xl bg-white shadow-xl shadow-blue-950/20 border border-white/80 inline-flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <img
              src="/logo.png"
              alt="OCS Logo"
              className="h-9 sm:h-11 w-auto object-contain"
            />
          </div>

          {festival ? (
            <>
              {/* Festival Date Pill */}
              <div className="flex items-center gap-2.5 mb-6 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-sm">
                <Calendar size={15} className="text-white/90" />
                <span className="text-xs font-semibold text-white tracking-wide uppercase">
                  {getFestivalDateString(festival)}
                </span>
              </div>

              {/* Festival Wish */}
              <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight drop-shadow-sm">
                {festival.wish}
              </h1>

              {/* Subtitle / Description */}
              <p className={`text-base xl:text-lg leading-relaxed max-w-md mb-8 ${festival.colors.accent || 'text-white/90'}`}>
                {festival.subWish || "Centralized business operations, pipeline management, client tracking, and internal team workflows."}
              </p>

              {/* Festival Icons Showcase */}
              {festival.icons && festival.icons.length > 0 && (
                <div className="flex items-center justify-center gap-4">
                  {festival.icons.map((iconName, index) => {
                    const IconComponent = LucideIcons[iconName];
                    return IconComponent ? (
                      <div 
                        key={index} 
                        className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-lg animate-float"
                        style={{ animationDelay: `${index * 0.4}s` }}
                      >
                        <IconComponent size={26} />
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Minimalist Live Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] font-bold text-white tracking-widest uppercase">
                  Business Operations Platform
                </span>
              </div>

              {/* Aesthetic Headline */}
              <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-white leading-[1.18] mb-4 tracking-tight drop-shadow-sm">
                Empowering Business,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-sky-100 to-white">
                  Simplifying Operations.
                </span>
              </h1>

              {/* Refined Description */}
              <p className="text-sm xl:text-base text-blue-100/80 leading-relaxed max-w-sm font-normal mb-8">
                Centralized subscription lifecycle, CRM pipeline, and internal team workflows in one intuitive workspace.
              </p>

              {/* Aesthetic Feature Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                <span className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-xs font-semibold text-white/95 flex items-center gap-2 shadow-sm transition-all hover:scale-105">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-200" />
                  Subscriptions
                </span>
                <span className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-xs font-semibold text-white/95 flex items-center gap-2 shadow-sm transition-all hover:scale-105">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-200" />
                  CRM Pipeline
                </span>
                <span className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-xs font-semibold text-white/95 flex items-center gap-2 shadow-sm transition-all hover:scale-105">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Enterprise Security
                </span>
              </div>

              {/* Minimal Brand Tag */}
              <div className="mt-10 flex items-center gap-2 text-[11px] text-blue-200/70 font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300/60" />
                <span>SubSync Enterprise Suite • Online Consultancy Services</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-white dark:bg-slate-900 z-10 relative">
        {/* Top Bar with Theme Toggle */}
        <div className="flex justify-between items-center w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="p-1.5 px-3 rounded-xl bg-white shadow-xs border border-slate-200/80 dark:border-slate-700">
              <img src="/logo.png" alt="Subsync Logo" className="h-6 w-auto object-contain" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Internal</span>
          </div>
          <div className="hidden lg:block" />

          {/* Minimalist Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer active:scale-95"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {/* Festival Theme Pill on Right Panel */}
          {festival && (
            <div className="mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <Sparkles size={13} className="text-amber-500" />
              <span>{festival.name} Theme Active</span>
            </div>
          )}

          {/* Headline */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Sign In
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-normal">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-r-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl
                           text-slate-900 dark:text-white placeholder-slate-400 text-sm
                           focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl
                           text-slate-900 dark:text-white placeholder-slate-400 text-sm
                           focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 accent-blue-600 
                           focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  Keep me logged in
                  {isPWA() && (
                    <span className="ml-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      (Mobile app)
                    </span>
                  )}
                </span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 font-semibold text-sm rounded-xl text-white shadow-md active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer ${
                festival && festival.colors.button
                  ? festival.colors.button
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} className="text-white/80" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Minimal Footer */}
        <div className="w-full max-w-md mx-auto pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center gap-1.5">
            &copy; {new Date().getFullYear()} RMS • Internal Operations Platform
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
