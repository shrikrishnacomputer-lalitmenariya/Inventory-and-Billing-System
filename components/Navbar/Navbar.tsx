"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      // 1. Detect scroll depth for header background style changes
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // 2. Automatically fallback active indicator to Home if near top
      if (window.scrollY < 120) {
        setActiveSection("home");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver to dynamically shift the active indicator line
  useEffect(() => {
    if (pathname !== "/") {
      if (pathname.includes("/login")) {
        // Wrap setState in an async microtask to avoid react-hooks/set-state-in-effect warning
        setTimeout(() => setActiveSection("login"), 0);
      }
      return;
    }

    const sections = ["about", "services", "contact"];
    const observers = sections.map((id) => {
      const element = document.getElementById(id);
      if (!element) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        {
          rootMargin: "-30% 0px -50% 0px", // triggers when element is centered in viewport
          threshold: 0,
        }
      );
      observer.observe(element);
      return { observer, element };
    });

    return () => {
      observers.forEach((obs) => {
        if (obs) obs.observer.unobserve(obs.element);
      });
    };
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/#about" },
    { name: "Services", href: "/#services" },
    { name: "Contact", href: "/#contact" },
  ];

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("home");
    } else {
      setActiveSection("home");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo (Left Aligned) */}
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-1.5 min-[350px]:gap-2 sm:gap-3 group">
            <div className="flex h-9 w-9 min-[350px]:h-10 min-[350px]:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white overflow-hidden shadow-sm border border-slate-200/50 transition-transform group-hover:scale-105 duration-300 shrink-0">
              <Image 
                src="/logo.png" 
                alt="Shree Krishna Computers Logo" 
                width={48} 
                height={48} 
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm min-[350px]:text-base min-[390px]:text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white leading-tight whitespace-nowrap">
                Shree Krishna Computers
              </span>
              <span className="text-[8px] min-[350px]:text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wider uppercase mt-0.5">
                Sales & Services
              </span>
            </div>
          </Link>

          {/* Right Aligned Navigation & CTA Buttons */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = activeSection === link.name.toLowerCase();
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setActiveSection(link.name.toLowerCase())}
                    className={`relative text-sm font-medium transition-colors hover:text-blue-600 ${
                      isActive
                        ? "text-blue-600 font-semibold"
                        : "text-slate-600 dark:text-slate-400 font-medium"
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <motion.span
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 hover:shadow-md hover:shadow-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all active:scale-98"
            >
              Owner Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80 focus:outline-none transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-slate-200/50 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1 shadow-inner"
            id="mobile-menu"
          >
            {navLinks.map((link) => {
              const isActive = activeSection === link.name.toLowerCase();
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    setIsOpen(false);
                    setActiveSection(link.name.toLowerCase());
                  }}
                  className={`block rounded-lg px-3 py-2 text-base font-semibold transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/60 mt-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                Owner Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
