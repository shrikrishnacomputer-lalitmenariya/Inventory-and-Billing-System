"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  Check, 
  User, 
  MessageSquare,
  ExternalLink,
  MapPinned
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";

// Stable confetti particle coordinates to satisfy React purity rules (no Math.random in render)
const CONFETTI_PARTICLES = Array.from({ length: 15 }, (_, i) => {
  const angle = (i / 15) * Math.PI * 2;
  const distance = 80 + (i % 3) * 40;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 40,
    scale: 0.6 + (i % 3) * 0.4,
    delay: (i % 5) * 0.12,
  };
});

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Owner's WhatsApp Number: +91 99282 03203
    const whatsappNumber = "919928203203";
    const messageTemplate = 
`👋 Hello Shree Krishna Computers,

I have a new inquiry from your website:
👤 *Name:* ${formData.name}
📞 *Phone:* ${formData.phone}
✉️ *Email:* ${formData.email}

💬 *Message:*
${formData.message}`;

    const encodedText = encodeURIComponent(messageTemplate);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      
      // Open WhatsApp in a new tab (works on iOS, Android, and Web/Desktop)
      window.open(whatsappUrl, "_blank");
      
      setFormData({ name: "", phone: "", email: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    }, 800);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const phoneCard = {
    title: "Call Us",
    value: "+91  9928203203",
    href: "tel:+91 9928203203",
    icon: Phone,
    description: "Direct business line for orders and support.",
  };

  const emailCard = {
    title: "Email Us",
    value: "info@shreekrishnacomputers.com",
    href: "mailto:info@shreekrishnacomputers.com",
    icon: Mail,
    description: "Email us for corporate quotes and setups.",
  };

  const addressCard = {
    title: "Store Location",
    value: "Main Bus Stand, Kanore, Udaipur, Rajasthan, 313604",
    href: "https://www.google.com/maps/place/Shri+Krishna+Computers/@24.4367468,74.2538814,16z/data=!4m6!3m5!1s0x39664a8873356425:0x22a4741aa6db2df9!8m2!3d24.4367468!4d74.2538814!16s%2Fg%2F11w12r_fpt",
    icon: MapPin,
    description: "Click to view location and directions on Google Maps.",
  };

  const hoursCard = {
    title: "Business Hours",
    value: "09:00 AM - 08:00 PM",
    labelSuffix: "Monday to Saturday (Sunday Closed)",
    icon: Clock,
    description: "Visit our store during these hours.",
  };

  return (
    <section id="contact" className="relative py-24 bg-slate-50/30 dark:bg-slate-955 scroll-mt-16 overflow-hidden">
      {/* Background Grid & Blur Blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)] opacity-60 dark:opacity-35 pointer-events-none" />

      {/* Floating blurred blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-[450px] h-[450px] bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 rounded-full uppercase tracking-wider inline-block"
          >
            Contact Us
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            Let&apos;s Connect With You
          </motion.h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-1 w-20 bg-blue-600 rounded-full mx-auto" 
          />
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-slate-500 dark:text-slate-400 leading-relaxed font-semibold text-base sm:text-lg"
          >
            Whether you&apos;re looking for a new smartphone, laptop, printer, air conditioner, accessories, or need professional mobile repair services, our team is here to help. Get in touch with us today.
          </motion.p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Asymmetric Contact Panel & Map */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Store Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="backdrop-blur-md bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-3 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-120 transition-transform duration-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Our Store
              </span>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                Shree Krishna Computers
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                Your trusted local computer and electronics destination. We supply authentic brands, provide smart EMI setups, and offer professional repair and installation services.
              </p>
            </motion.div>

            {/* Asymmetric Contact Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Column 1 */}
              <div className="space-y-6">
                {/* Phone Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="group relative backdrop-blur-md bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-fit transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[5deg]">
                      <Phone className="h-5 w-5" />
                    </div>
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-widest">
                      {phoneCard.title}
                    </h3>
                    <a
                      href={phoneCard.href}
                      className="block text-base font-extrabold text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-2 break-words"
                    >
                      {phoneCard.value}
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-455 mt-4 font-semibold leading-relaxed">{phoneCard.description}</p>
                </motion.div>

                {/* Location Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="group relative backdrop-blur-md bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-fit transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[5deg]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-widest">
                      {addressCard.title}
                    </h3>
                    <a
                      href={addressCard.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-extrabold text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-2 break-words"
                    >
                      {addressCard.value}
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-455 mt-4 font-semibold leading-relaxed">{addressCard.description}</p>
                </motion.div>
              </div>

              {/* Column 2 */}
              <div className="space-y-6 sm:mt-6">
                {/* Email Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="group relative backdrop-blur-md bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-fit transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[5deg]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-widest">
                      {emailCard.title}
                    </h3>
                    <a
                      href={emailCard.href}
                      className="block text-sm font-extrabold text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-2 break-words"
                    >
                      {emailCard.value}
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-455 mt-4 font-semibold leading-relaxed">{emailCard.description}</p>
                </motion.div>

                {/* Hours Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="group relative backdrop-blur-md bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-fit transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[5deg]">
                      <Clock className="h-5 w-5" />
                    </div>
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-widest">
                      {hoursCard.title}
                    </h3>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-2">{hoursCard.value}</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{hoursCard.labelSuffix}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-4 font-semibold leading-relaxed">{hoursCard.description}</p>
                </motion.div>
              </div>

            </div>


          </div>

          {/* Right Column: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden"
          >
            {/* Subtle glow blob behind the form */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Send Us a Message
            </h3>
            <p className="text-sm text-slate-555 dark:text-slate-400 mt-2 mb-8 font-semibold">
              Fill out the form and we&apos;ll connect with you on WhatsApp.
            </p>
            
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center text-center py-16 space-y-6 relative overflow-hidden"
                >
                  {/* Confetti-like floating particles */}
                  {CONFETTI_PARTICLES.map((particle, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-2 h-2 rounded-full ${
                        i % 3 === 0 
                          ? "bg-blue-500" 
                          : i % 3 === 1 
                          ? "bg-cyan-400" 
                          : "bg-indigo-500"
                      }`}
                      initial={{ 
                        x: 0, 
                        y: 0, 
                        scale: 0,
                        opacity: 0.8
                      }}
                      animate={{ 
                        x: particle.x, 
                        y: particle.y, 
                        scale: particle.scale,
                        opacity: 0
                      }}
                      transition={{ 
                        duration: 2.2, 
                        delay: particle.delay,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    />
                  ))}

                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="h-20 w-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-green-500/20"
                  >
                    <Check className="h-10 w-10 stroke-[3]" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <motion.h4 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-extrabold text-slate-800 dark:text-white"
                    >
                      Thank You!
                    </motion.h4>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-slate-500 dark:text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed"
                    >
                      Your message is ready. WhatsApp has opened in a new tab. Simply tap Send to reach our team.
                    </motion.p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-7">
                  
                  {/* Row 1: Name and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div className="relative group/field">
                      <div className="absolute left-4 top-3.5 text-slate-450 dark:text-slate-500 group-focus-within/field:text-blue-500 transition-colors pointer-events-none">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder=" "
                        className="peer w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 pl-12 pr-4 py-3.5 text-sm text-slate-800 dark:text-white placeholder-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/5 transition-all"
                      />
                      <label
                        htmlFor="name"
                        className={`absolute left-12 duration-300 pointer-events-none font-semibold origin-[0] transition-all
                          ${formData.name 
                            ? "scale-75 -translate-y-7 text-blue-600 dark:text-blue-400" 
                            : "scale-100 translate-y-3.5 text-slate-450 dark:text-slate-550"
                          } 
                          peer-focus:scale-75 peer-focus:-translate-y-7 peer-focus:text-blue-600 dark:peer-focus:text-blue-400
                        `}
                      >
                        Your Name
                      </label>
                    </div>

                    {/* Phone Field */}
                    <div className="relative group/field">
                      <div className="absolute left-4 top-3.5 text-slate-450 dark:text-slate-500 group-focus-within/field:text-blue-500 transition-colors pointer-events-none">
                        <Phone className="h-5 w-5" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder=" "
                        className="peer w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 pl-12 pr-4 py-3.5 text-sm text-slate-800 dark:text-white placeholder-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/5 transition-all"
                      />
                      <label
                        htmlFor="phone"
                        className={`absolute left-12 duration-300 pointer-events-none font-semibold origin-[0] transition-all
                          ${formData.phone 
                            ? "scale-75 -translate-y-7 text-blue-600 dark:text-blue-400" 
                            : "scale-100 translate-y-3.5 text-slate-450 dark:text-slate-555"
                          } 
                          peer-focus:scale-75 peer-focus:-translate-y-7 peer-focus:text-blue-600 dark:peer-focus:text-blue-400
                        `}
                      >
                        Phone Number
                      </label>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="relative group/field">
                    <div className="absolute left-4 top-3.5 text-slate-450 dark:text-slate-500 group-focus-within/field:text-blue-550 transition-colors pointer-events-none">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder=" "
                      className="peer w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 pl-12 pr-4 py-3.5 text-sm text-slate-800 dark:text-white placeholder-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/5 transition-all"
                    />
                    <label
                      htmlFor="email"
                      className={`absolute left-12 duration-300 pointer-events-none font-semibold origin-[0] transition-all
                        ${formData.email 
                          ? "scale-75 -translate-y-7 text-blue-600 dark:text-blue-400" 
                          : "scale-100 translate-y-3.5 text-slate-450 dark:text-slate-555"
                        } 
                        peer-focus:scale-75 peer-focus:-translate-y-7 peer-focus:text-blue-600 dark:peer-focus:text-blue-400
                      `}
                    >
                      Email Address
                    </label>
                  </div>

                  {/* Message Field */}
                  <div className="relative group/field">
                    <div className="absolute left-4 top-4 text-slate-450 dark:text-slate-500 group-focus-within/field:text-blue-500 transition-colors pointer-events-none">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder=" "
                      className="peer w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 pl-12 pr-4 py-3.5 text-sm text-slate-800 dark:text-white placeholder-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/5 transition-all resize-none"
                    />
                    <label
                      htmlFor="message"
                      className={`absolute left-12 duration-300 pointer-events-none font-semibold origin-[0] transition-all
                        ${formData.message 
                          ? "scale-75 -translate-y-7 text-blue-600 dark:text-blue-400" 
                          : "scale-100 translate-y-3.5 text-slate-450 dark:text-slate-555"
                        } 
                        peer-focus:scale-75 peer-focus:-translate-y-7 peer-focus:text-blue-600 dark:peer-focus:text-blue-400
                      `}
                    >
                      Your Message
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-4 text-sm font-bold shadow-md hover:shadow-xl hover:shadow-blue-500/25 dark:hover:shadow-blue-500/10 disabled:opacity-50 gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shrink-0 overflow-hidden"
                  >
                    {/* Subtle shine swipe effect on hover */}
                    <motion.div 
                      className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />

                    {loading ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Preparing WhatsApp Message...
                      </div>
                    ) : (
                      <>
                        Send via WhatsApp
                        <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                      </>
                    )}
                  </button>

                </form>
              )}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* Bottom Row: Instagram Social Card & Google Map Embed Card side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
          
          {/* Instagram Social Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5 group relative bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-indigo-500/5 dark:from-pink-950/20 dark:via-purple-950/10 dark:to-indigo-950/10 border border-pink-100/50 dark:border-pink-900/20 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-pink-500/10 dark:hover:shadow-pink-500/5 hover:border-pink-500/30 dark:hover:border-pink-500/20 transition-all duration-300 flex flex-col justify-between items-center text-center h-[400px] overflow-hidden"
          >
            {/* Instagram Brand Highlight Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-650 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="flex flex-col items-center mt-4">
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white shadow-lg transition-transform duration-500 group-hover:rotate-[15deg] group-hover:scale-110">
                <FaInstagram className="h-10 w-10" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400 mt-6">
                Follow Us
              </span>
              <h4 className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
                Instagram Community
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-3 max-w-[280px] leading-relaxed">
                See latest arrivals, announcements, and tech store life. Join our community online!
              </p>
            </div>
            
            <a
              href="https://www.instagram.com/shree_krishna_computer_7441"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 via-pink-555 to-purple-655 hover:from-yellow-500 hover:to-purple-700 text-white font-bold text-sm py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer mb-2"
            >
              Visit Profile
              <ExternalLink className="h-4 w-4" />
            </a>
          </motion.div>

          {/* Google Map Embed Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-7 group relative flex flex-col rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-500 h-[400px] bg-slate-50 dark:bg-slate-900"
          >
            {/* Header with Title and Directions Button */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/80 backdrop-blur-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-blue-500" />
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
                    Visit Our Store
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Main Bus Stand, Kanore, Udaipur, Rajasthan 313604
                </p>
              </div>
              <a
                href="https://www.google.com/maps/place/Shri+Krishna+Computers/@24.4367468,74.2538814,16z/data=!4m6!3m5!1s0x39664a8873356425:0x22a4741aa6db2df9!8m2!3d24.4367468!4d74.2538814!16s%2Fg%2F11w12r_fpt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs py-2 px-4 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                Open in Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Clean Interactive Map */}
            <div className="flex-grow w-full relative overflow-hidden bg-slate-100 dark:bg-slate-950">
              <iframe
                title="Shree Krishna Computers Location Map"
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7264.809043642447!2d74.2538814!3d24.4367468!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39664a8873356425%3A0x22a4741aa6db2df9!2sShri%20Krishna%20Computers!5e0!3m2!1sen!2sin!4v1783234530970!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
