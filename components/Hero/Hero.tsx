"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ArrowRight, LogIn } from "lucide-react";

export default function Hero() {
  // Stagger entry animations
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 18 },
    },
  };

  return (
    <section className="relative w-full min-h-[90vh] py-16 lg:py-0 flex items-center justify-center overflow-hidden bg-slate-950">
      
      {/* Background Layer 1: Blurred Ambient Colors Glow covering the entire section */}
      <motion.div
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.35 }}
        transition={{ duration: 2.2, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 filter blur-[50px]"
      >
        <Image
          src="/ShreeKrishnaHero.webp"
          alt="Storefront Ambient Glow"
          fill
          priority
          className="object-cover object-center filter brightness-50"
          sizes="100vw"
        />
      </motion.div>

      {/* Background Layer 2: Uncropped Storefront Image contained on the right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-y-0 right-0 w-full lg:w-[60%] pointer-events-none z-10"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 25%, black 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 25%, black 100%)",
        }}
      >
        <Image
          src="/ShreeKrishnaHero.webp"
          alt="Shree Krishna Computers Storefront Background"
          fill
          priority
          className="object-contain object-right"
          sizes="(max-w-1024px) 100vw, 60vw"
        />
      </motion.div>

      {/* Modern Gradient Overlays for High Readability and Blending */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950 to-transparent z-20 pointer-events-none" />

      {/* Interactive Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-60 pointer-events-none z-20" />

      {/* Floating Blurred Light Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen z-20" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] bg-indigo-500/15 dark:bg-indigo-650/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen z-20" />

      {/* Hero Content Wrapper */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-30 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Glassmorphic Content Card */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-8 xl:col-span-7 flex flex-col items-start text-left space-y-6 bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 sm:p-10 md:p-12 shadow-[0_30px_70px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Glowing Accent Border at top */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none" />

            

            {/* Heading with curated gradients */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] max-w-4xl text-left">
              <motion.span className="block drop-shadow-md text-white" variants={itemVariants}>
                Shree Krishna Computers
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent pb-1 drop-shadow-sm"
                variants={itemVariants}
              >
                Sales & Billing Solutions
              </motion.span>
            </h1>

            {/* Subtitle description */}
            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal text-left"
            >
              Empowering your lifestyle and business with high-performance Computer & Laptop Sales, genuine Accessories, certified GST Billing and Inventory Software, robust Printer and Networking configurations, and professional repairs.
            </motion.p>

            {/* Buttons Group */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-start gap-4 w-full sm:w-auto pt-3 z-10"
            >
              <Link
                href="/#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 gap-2 shrink-0 cursor-pointer"
              >
                Contact Us
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-7 py-3.5 text-sm font-bold text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 gap-2 shrink-0 cursor-pointer"
              >
                Owner Login
                <LogIn className="h-4 w-4 opacity-80" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
