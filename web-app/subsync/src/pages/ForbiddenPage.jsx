import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, ShieldX, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-gray-50 to-orange-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px),
                           repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)`
                }}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center max-w-3xl mx-auto">
                {/* Locked Shield Illustration */}
                <div className="mb-8 relative">
                    {/* Security Barrier Animation */}
                    <div className="flex items-center justify-center gap-8 mb-12">
                        <div className="relative">
                            {/* Left Security Bar */}
                            <div className="flex items-center animate-barrier-slide-left">
                                <div className="relative">
                                    {/* Security Bar */}
                                    <div className="h-3 w-32 bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 rounded-full shadow-lg relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                    </div>
                                    {/* Warning Stripes */}
                                    <div className="absolute -right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-8 h-8 bg-yellow-500 dark:bg-yellow-400 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                                            <AlertTriangle className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Central Lock & Shield */}
                        <div className="relative">
                            <div className="w-24 h-24 relative">
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-red-500 dark:bg-red-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>

                                {/* Shield Background */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShieldX className="w-20 h-20 text-red-600 dark:text-red-400 animate-shield-pulse" />
                                </div>

                                {/* Lock Icon */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <Lock className="w-10 h-10 text-red-500 dark:text-red-300 animate-lock-shake z-10" />
                                </div>

                                {/* Security Particles */}
                                {[...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full animate-security-particle"
                                        style={{
                                            animationDelay: `${i * 0.15}s`,
                                            transform: `rotate(${i * 45}deg) translateX(0px)`
                                        }}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        {/* Right Security Bar */}
                        <div className="relative">
                            <div className="flex items-center animate-barrier-slide-right">
                                <div className="relative">
                                    {/* Warning Stripes */}
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2">
                                        <div className="w-8 h-8 bg-yellow-500 dark:bg-yellow-400 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                                            <AlertTriangle className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    {/* Security Bar */}
                                    <div className="h-3 w-32 bg-gradient-to-l from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 rounded-full shadow-lg relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 403 Text */}
                    <h1 className="text-9xl md:text-[180px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-red-600 dark:from-red-400 dark:via-orange-400 dark:to-red-400 select-none leading-none mb-4 animate-fade-in">
                        403
                    </h1>
                </div>

                {/* Access Denied Icon */}
                <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in-delay">
                    <div className="relative">
                        <EyeOff className="w-16 h-16 text-red-500 dark:text-red-400 animate-pulse" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-4 animate-slide-up mb-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                        Access Denied!
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        This area is restricted. You don't have the required permissions to access this resource.
                    </p>
                </div>

                {/* Warning Box */}
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg max-w-lg mx-auto animate-fade-in-delay-2">
                    <div className="flex items-start gap-3">
                        <ShieldX className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                            <p className="font-semibold text-red-800 dark:text-red-300">Permission Error</p>
                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                You don't have sufficient permissions to view this page. Contact your administrator if you believe this is an error.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-3">
                    <Button
                        onClick={() => navigate(-1)}
                        className="group bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 text-white px-6 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                        Go Back
                    </Button>
                    <Button
                        onClick={() => navigate('/')}
                        variant="outline"
                        className="px-6 py-6 text-lg rounded-lg border-2 border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transform transition-all duration-200 hover:scale-105 group"
                    >
                        <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                        Home Page
                    </Button>
                </div>

                {/* Error Code */}
                <div className="mt-12 space-y-2 text-xs text-gray-400 dark:text-gray-600 font-mono animate-fade-in-delay-3">
                    <p>ERROR_CODE: 403_FORBIDDEN</p>
                    <p>STATUS: ACCESS_DENIED</p>
                </div>
            </div>

            <style>{`
        @keyframes barrierSlideLeft {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-8px);
          }
        }

        @keyframes barrierSlideRight {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(8px);
          }
        }

        @keyframes shieldPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        @keyframes lockShake {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-5deg);
          }
          75% {
            transform: rotate(5deg);
          }
        }

        @keyframes securityParticle {
          0%, 100% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) translateX(0px) scale(0);
          }
          50% {
            opacity: 1;
            transform: rotate(var(--rotation, 0deg)) translateX(35px) scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
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

        .animate-barrier-slide-left {
          animation: barrierSlideLeft 2s ease-in-out infinite;
        }

        .animate-barrier-slide-right {
          animation: barrierSlideRight 2s ease-in-out infinite;
        }

        .animate-shield-pulse {
          animation: shieldPulse 2s ease-in-out infinite;
        }

        .animate-lock-shake {
          animation: lockShake 0.5s ease-in-out infinite;
        }

        .animate-security-particle {
          animation: securityParticle 3s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay {
          animation: fadeIn 0.8s ease-out 0.3s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay-2 {
          animation: fadeIn 0.8s ease-out 0.5s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay-3 {
          animation: fadeIn 0.8s ease-out 0.7s forwards;
          opacity: 0;
        }
      `}</style>
        </div>
    );
}
