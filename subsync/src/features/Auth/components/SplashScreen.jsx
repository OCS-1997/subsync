import React, { useEffect } from "react";
import { motion } from "framer-motion";

/**
 * SplashScreen Component
 * Displays a minimal and professional entrance animation for Subsync.
 * Theme: Enterprise Blue (Professional, Trustworthy, Modern)
 */
const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    // Finish after animation + dwell time
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-white overflow-hidden px-6">
      {/* Background Gradient Mesh - Deep Blue Professional */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/30 opacity-80" />
      
      {/* Animated Blobs - Subtle & Professional */}
      <div className="absolute -top-[10%] -right-[10%] w-[280px] h-[280px] md:w-[600px] md:h-[600px] bg-blue-600/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse" />
      <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-slate-700/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute -bottom-[10%] -left-[10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[70px] md:blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo Animation */}
        <motion.div
          className="relative w-28 h-28 md:w-36 md:h-36 mb-8 md:mb-10"
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1.2, type: "spring", stiffness: 40 }}
        >
             {/* Professional Glow */}
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
            <div className="absolute inset-2 bg-indigo-500/10 blur-xl rounded-full animate-pulse" />
            
            <img 
                src="/pwa-192x192.png" 
                alt="OCS" 
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)] brightness-105" 
            />
        </motion.div>

        {/* Text Reveal */}
        <div className="text-center overflow-hidden w-full px-4">
            <motion.h1
                className="text-4xl md:text-6xl font-black tracking-tight mb-3 text-white drop-shadow-sm"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 50 }}
            >
                OCS <span className="text-blue-500">RMS</span>
            </motion.h1>
            
            <motion.div
                className="flex items-center justify-center gap-4 py-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
            >
                <div className="h-[1px] w-8 md:w-12 bg-gradient-to-l from-blue-500/40 to-transparent" />
                <span className="text-[10px] md:text-sm font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] text-slate-400 whitespace-nowrap">
                    CRM Suite
                </span>
                <div className="h-[1px] w-8 md:w-12 bg-gradient-to-r from-blue-500/40 to-transparent" />
            </motion.div>
        </div>

        {/* Loading Indicator - Professional Blue */}
        <motion.div 
            className="mt-12 md:mt-16 w-32 md:w-56 h-[3px] bg-slate-800/80 overflow-hidden rounded-full backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
        >
            <motion.div
                className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-500"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                    repeat: Infinity, 
                    duration: 1.5, 
                    ease: "easeInOut",
                    repeatDelay: 0.2
                }}
            />
        </motion.div>

        {/* Version/Footer Text */}
        <motion.div
            className="absolute -bottom-32 md:-bottom-40 text-[9px] text-slate-600 font-medium tracking-widest uppercase opacity-0"
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5, duration: 1 }}
        >
            Initializing Environment
        </motion.div>

      </motion.div>
    </div>
  );
};

export default SplashScreen;
