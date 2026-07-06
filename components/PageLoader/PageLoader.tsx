"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface PageLoaderProps {
  onComplete: () => void;
}

export default function PageLoader({ onComplete }: PageLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fill the progress bar over 1.6 seconds
    const duration = 1600;
    const intervalTime = 30;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200); // Small buffer before reveal
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950"
    >
      <div className="flex flex-col items-center max-w-sm px-6">
        
        {/* Animated Brand Logo Container */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, rotate: -5 }}
          animate={{ 
            scale: [0.95, 1.05, 1],
            opacity: 1,
            rotate: 0,
            y: [0, -6, 0]
          }}
          transition={{
            y: {
              repeat: Infinity,
              repeatType: "mirror",
              duration: 2.5,
              ease: "easeInOut"
            },
            default: { duration: 1.2, ease: "easeOut" }
          }}
          className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 mb-6"
        >
          <Image 
            src="/logo.png" 
            alt="Shree Krishna Computers Logo" 
            width={96} 
            height={96} 
            className="h-full w-full object-contain"
            priority
          />
        </motion.div>

        {/* Company Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center"
        >
          Shree Krishna Computers
        </motion.h2>

        {/* Small subtitle details */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mt-1 mb-8"
        >
          Sales • Service • Repair
        </motion.span>

        {/* Custom Progress Bar Indicator */}
        <div className="w-48 h-[3px] bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden relative mb-3">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dynamic Loading Text */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest"
        >
          Loading {Math.min(Math.round(progress), 100)}%
        </motion.span>

      </div>
    </motion.div>
  );
}
