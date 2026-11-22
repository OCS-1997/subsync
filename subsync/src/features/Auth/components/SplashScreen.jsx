import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SplashScreen Component
 * Displays a snappy, high-precision entrance animation for Subsync.
 * Dismissible on click/press and cached per session so it never interrupts workflow.
 */
const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    // If already seen in this tab session, skip immediately
    if (typeof window !== "undefined" && sessionStorage.getItem("subsync_splash_seen")) {
      onFinish?.();
      return;
    }

    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("subsync_splash_seen", "true");
      }
      onFinish?.();
    }, 1400);

    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("subsync_splash_seen", "true");
        }
        onFinish?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onFinish]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("subsync_splash_seen", "true");
    }
    onFinish?.();
  };

  return (
    <motion.div
      onClick={handleDismiss}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07090e] text-white overflow-hidden px-6 cursor-pointer select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      {/* Background Architectural Grid Lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      {/* Subtle Ambient Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#07090e]/70 to-[#07090e] pointer-events-none" />

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm mx-auto text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Emblem */}
        <motion.div
          className="relative w-20 h-20 mb-6 flex items-center justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-blue-500/15 rounded-2xl blur-xl" />
          <div className="relative p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-2xl">
            <img 
              src="/logo.png" 
              alt="OCS BOP" 
              className="w-12 h-12 object-contain"
            />
          </div>
        </motion.div>

        {/* Text */}
        <div className="space-y-1.5 mb-8">
          <motion.h1
            className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            Sub<span className="text-blue-400">Sync</span>
            <span className="ml-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 border border-slate-700/80 px-1.5 py-0.5 rounded">
              BOP
            </span>
          </motion.h1>
          <motion.p
            className="text-[11px] font-mono tracking-[0.2em] uppercase text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            Business Operations Platform
          </motion.p>
        </div>

        {/* Snappy Linear Telemetry Loader */}
        <motion.div 
          className="w-40 h-[2px] bg-white/[0.08] overflow-hidden rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-400"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.1, 
              ease: "easeInOut"
            }}
          />
        </motion.div>

        <span className="mt-4 text-[10px] font-mono text-slate-500 tracking-wider">
          Click or press Esc to skip
        </span>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
