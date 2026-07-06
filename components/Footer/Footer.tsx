"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ExternalLink, 
  ChevronRight,
  Smartphone,
  CreditCard,
  Laptop,
  Wind,
  Printer,
  Package,
  Monitor,
  Watch,
  Headphones,
  Wrench
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";

export default function Footer() {
  const quickLinks = [
    { name: "Home", href: "/", targetId: "top" },
    { name: "About Us", href: "/#about", targetId: "about" },
    { name: "Our Services", href: "/#services", targetId: "services" },
    { name: "Contact", href: "/#contact", targetId: "contact" },
  ];

  const services = [
    { name: "Mobile Phones", icon: Smartphone },
    { name: "EMI Facility", icon: CreditCard },
    { name: "Laptops & Computers", icon: Laptop },
    { name: "Air Conditioners", icon: Wind },
    { name: "Printer Sales", icon: Printer },
    { name: "Mobile Accessories", icon: Package },
    { name: "Computer Accessories", icon: Monitor },
    { name: "Smart Watches", icon: Watch },
    { name: "Headphones & Speakers", icon: Headphones },
    { name: "Mobile Repair", icon: Wrench },
  ];

  const contactInfo = [
    {
      label: "Phone",
      value: "+91 99282 03203",
      icon: Phone,
      href: "tel:+919928203203",
    },
    {
      label: "Email",
      value: "info@shreekrishnacomputers.com",
      icon: Mail,
      href: "mailto:info@shreekrishnacomputers.com",
    },
    {
      label: "Store Address",
      value: "Main Bus Stand, Kanore, Udaipur, Raj., 313604",
      icon: MapPin,
      href: "https://maps.google.com/?q=Shree+Krishna+Computers+Kanore",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      label: "Business Hours",
      value: "10:00 AM - 8:00 PM (Daily)",
      icon: Clock,
      href: undefined,
    },
    {
      label: "Instagram",
      value: "@shree_krishna_computer_7441",
      icon: FaInstagram,
      href: "https://www.instagram.com/shree_krishna_computer_7441",
      target: "_blank",
      rel: "noopener noreferrer",
    },
  ];

  // Helper for smooth scrolling in single-page navigation
  const handleScrollClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      if (targetId === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.pushState(null, "", "/");
      } else {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", `#${targetId}`);
        }
      }
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <footer className="relative overflow-hidden bg-[#0F172A] text-slate-400 border-t border-slate-800/80 py-12 md:py-16 z-15">
      {/* Background radial lines grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      
      {/* Soft Ambient glowing blurred blobs */}
      <div className="absolute -top-32 left-1/4 w-[380px] h-[380px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-[420px] h-[420px] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Animated Staggered Main Grid - Simplified and compact spacing */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 pb-8"
        >
          
          {/* Column 1: Company Branding */}
          <motion.div variants={itemVariants} className="space-y-4 flex flex-col items-start text-left">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white overflow-hidden shadow-sm border border-slate-200/50 transition-transform group-hover:scale-105 duration-300 shrink-0">
                <Image 
                  src="/logo.png" 
                  alt="Shree Krishna Computers Logo" 
                  width={44} 
                  height={44} 
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white leading-tight">
                  Shree Krishna Computers
                </span>
                <span className="text-[9px] text-blue-400 font-bold tracking-widest uppercase mt-0.5">
                  SALES • SERVICE • REPAIR
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Shree Krishna Computers is your trusted destination for mobile phones, laptops, printers, air conditioners, accessories, and professional repair services. We deliver genuine products and customer satisfaction.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1">
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                href="https://www.instagram.com/shree_krishna_computer_7441"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-300 hover:text-pink-500 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] transition-all duration-300"
                aria-label="Instagram"
              >
                <FaInstagram className="h-4 w-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Column 2: Quick Links */}
          <motion.div variants={itemVariants} className="space-y-4 flex flex-col items-start text-left">
            <h3 className="text-sm font-bold !text-slate-100 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm w-full">
              {quickLinks.map((link) => (
                <li key={link.name} className="flex justify-start">
                  <Link
                    href={link.href}
                    onClick={(e) => handleScrollClick(e, link.targetId)}
                    className="group flex items-center gap-1 text-slate-300 hover:text-blue-400 font-semibold transition-colors duration-300"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500 opacity-0 -ml-2.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 shrink-0" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
              <li className="flex justify-start">
                <Link
                  href="/login"
                  className="group flex items-center gap-1 text-slate-300 hover:text-blue-400 font-semibold transition-colors duration-300"
                >
                  <ChevronRight className="h-3 w-3 text-blue-500 opacity-0 -ml-2.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 shrink-0" />
                  <span>Owner Login</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Column 3: Our Services */}
          <motion.div variants={itemVariants} className="space-y-4 flex flex-col items-start text-left w-full">
            <h3 className="text-sm font-bold !text-slate-100 uppercase tracking-wider">
              Our Offerings
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2.5 w-full">
              {services.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href="/#services"
                    onClick={(e) => handleScrollClick(e, "services")}
                    className="group flex items-center justify-start gap-2.5 text-slate-300 hover:text-blue-400 transition-colors duration-300"
                  >
                    <Icon className="h-4 w-4 text-blue-500 group-hover:text-blue-400 transition-colors shrink-0" />
                    <span className="text-sm font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Column 4: Contact Information */}
          <motion.div variants={itemVariants} className="space-y-4 flex flex-col items-start text-left w-full">
            <h3 className="text-sm font-bold !text-slate-100 uppercase tracking-wider">
              Contact Details
            </h3>
            <div className="space-y-4 w-full">
              {contactInfo.map((item, idx) => {
                const Icon = item.icon;
                const isClickable = item.href !== undefined;
                return (
                  <div key={idx} className="flex items-start justify-start gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">
                        {item.label}
                      </span>
                      {isClickable ? (
                        <a
                          href={item.href}
                          target={item.target}
                          rel={item.rel}
                          className="text-sm text-slate-200 hover:text-blue-400 font-semibold mt-1 break-all leading-normal transition-colors duration-300"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-300 font-semibold mt-1 leading-normal">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

        </motion.div>

        {/* Premium glowing divider line */}
        <div className="relative w-full h-[1px] my-6 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent blur-[1.5px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        </div>

        {/* Footer Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-xs">
          
          {/* Copyright */}
          <div className="text-slate-500 font-medium">
            © 2026 Shree Krishna Computers. All Rights Reserved.
          </div>

          {/* Powered By VisionTechX */}
          <div className="flex items-center justify-center">
            <a
              href="https://www.visiontechx.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 font-semibold transition-colors duration-300"
            >
              <span>Powered by</span>
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent group-hover:underline group-hover:brightness-110 transition-all font-black flex items-center gap-0.5 tracking-wide drop-shadow-[0_0_8px_rgba(56,189,248,0.15)]">
                VisionTechX
                <ExternalLink className="h-3 w-3 text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            </a>
          </div>

          {/* Owner Login Link */}
          <div className="flex items-center justify-center">
            <Link href="/login">
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className="text-slate-500 hover:text-blue-400 font-bold transition-colors cursor-pointer"
              >
                Owner Panel
              </motion.span>
            </Link>
          </div>

        </div>

      </div>
    </footer>
  );
}
