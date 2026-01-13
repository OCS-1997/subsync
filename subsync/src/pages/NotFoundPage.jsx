import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Unplug, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px),
                           repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)`
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Disconnected Cable Illustration */}
        <div className="mb-8 relative">
          {/* Cable Left Side */}
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="relative">
              {/* Left Cable with Plug */}
              <div className="flex items-center animate-swing-left">
                <div className="relative">
                  {/* Cable Wire */}
                  <div className="h-2 w-32 bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-700 rounded-full shadow-lg"></div>
                  {/* Plug End */}
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                    <div className="w-12 h-8 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 rounded-r-lg shadow-xl relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-yellow-400"></div>
                      <div className="absolute left-0 top-1/4 w-2 h-1 bg-yellow-400"></div>
                      <div className="absolute left-0 bottom-1/4 w-2 h-1 bg-yellow-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spark Effect */}
            <div className="relative">
              <div className="w-16 h-16 relative">
                {/* Sparks */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-spark"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      transform: `rotate(${i * 60}deg) translateX(20px)`
                    }}
                  ></div>
                ))}
                <Unplug className="w-12 h-12 text-red-500 dark:text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>

            {/* Cable Right Side */}
            <div className="relative">
              {/* Right Cable with Socket */}
              <div className="flex items-center animate-swing-right">
                <div className="relative">
                  {/* Socket */}
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                    <div className="w-12 h-8 bg-gradient-to-l from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 rounded-l-lg shadow-xl relative">
                      <div className="absolute right-2 top-1/4 w-3 h-1.5 bg-gray-800 dark:bg-gray-900 rounded-full"></div>
                      <div className="absolute right-2 bottom-1/4 w-3 h-1.5 bg-gray-800 dark:bg-gray-900 rounded-full"></div>
                    </div>
                  </div>
                  {/* Cable Wire */}
                  <div className="h-2 w-32 bg-gradient-to-l from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-700 rounded-full shadow-lg"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 404 Text */}
          <h1 className="text-9xl md:text-[180px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-red-500 to-purple-600 dark:from-blue-400 dark:via-red-400 dark:to-purple-400 select-none leading-none mb-4 animate-fade-in">
            404
          </h1>
        </div>

        {/* Connection Lost Icon */}
        <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in-delay">
          <WifiOff className="w-16 h-16 text-red-500 dark:text-red-400 animate-pulse" />
        </div>

        {/* Message */}
        <div className="space-y-4 animate-slide-up mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Connection Lost!
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Looks like this page got unplugged. The cable's disconnected and we can't establish a connection.
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-8 rounded-r-lg max-w-lg mx-auto animate-fade-in-delay-2">
          <div className="flex items-start gap-3">
            <Unplug className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">Network Error</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                The requested resource could not be found. Please check the URL and try again.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-3">
          <Button
            onClick={() => navigate(-1)}
            className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white px-6 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="px-6 py-6 text-lg rounded-lg border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transform transition-all duration-200 hover:scale-105 group"
          >
            <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
            Home Page
          </Button>
        </div>

        {/* Error Code */}
        <div className="mt-12 space-y-2 text-xs text-gray-400 dark:text-gray-600 font-mono animate-fade-in-delay-3">
          <p>ERROR_CODE: 404_NOT_FOUND</p>
          <p>STATUS: DISCONNECTED</p>
        </div>
      </div>

      <style>{`
        @keyframes swingLeft {
          0%, 100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(-8deg);
          }
        }

        @keyframes swingRight {
          0%, 100% {
            transform: rotate(5deg);
          }
          50% {
            transform: rotate(8deg);
          }
        }

        @keyframes spark {
          0%, 100% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) translateX(0px) scale(0);
          }
          50% {
            opacity: 1;
            transform: rotate(var(--rotation, 0deg)) translateX(25px) scale(1.5);
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

        .animate-swing-left {
          animation: swingLeft 3s ease-in-out infinite;
          transform-origin: top right;
        }

        .animate-swing-right {
          animation: swingRight 3s ease-in-out infinite;
          transform-origin: top left;
        }

        .animate-spark {
          animation: spark 2s ease-in-out infinite;
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
