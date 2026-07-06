"use client";

import { motion } from "framer-motion";
import { 
  Smartphone, 
  Laptop, 
  Wind, 
  Printer, 
  Package, 
  Monitor, 
  Watch, 
  Headphones, 
  Wrench, 
  CreditCard,
  ShieldCheck,
  Tag,
  HeartHandshake,
  Smile
} from "lucide-react";

export default function Services() {
  const serviceList = [
    {
      title: "EMI Facility",
      description: "Offer easy EMI options on selected products, making it convenient for customers to purchase the latest technology without financial burden.",
      icon: CreditCard,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40",
    },
    {
      title: "Mobile Phones",
      description: "Latest smartphones from trusted brands with genuine warranty and competitive pricing.",
      icon: Smartphone,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40",
    },
    {
      title: "Laptops & Computers",
      description: "Laptops and desktop computers for students, professionals, businesses, and everyday use.",
      icon: Laptop,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40",
    },
    {
      title: "Air Conditioners",
      description: "Energy-efficient air conditioners from trusted brands with expert guidance for the right choice.",
      icon: Wind,
      color: "text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900/40",
    },
    {
      title: "Printers",
      description: "Inkjet, laser, and multifunction printers suitable for home, office, and business requirements.",
      icon: Printer,
      color: "text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900/40",
    },
    {
      title: "Mobile Accessories",
      description: "Chargers, cables, cases, tempered glass, power banks, adapters, memory cards, and more.",
      icon: Package,
      color: "text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-950/30 border-pink-100 dark:border-pink-900/40",
    },
    {
      title: "Computer Accessories",
      description: "Keyboards, mouse, webcams, storage devices, networking accessories, and other computer essentials.",
      icon: Monitor,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40",
    },
    {
      title: "Smart Watches",
      description: "Latest smart watches with modern features for fitness, productivity, and everyday convenience.",
      icon: Watch,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40",
    },
    {
      title: "Headphones & Speakers",
      description: "Wireless headphones, Bluetooth speakers, earphones, and quality audio accessories.",
      icon: Headphones,
      color: "text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40",
    },
    {
      title: "Mobile Repair Services",
      description: "Professional mobile phone repair with quick diagnosis, quality parts, and reliable workmanship.",
      icon: Wrench,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40",
    },
  ];

  const whyChooseUsData = [
    {
      title: "Genuine Products",
      description: "We offer original products from trusted brands for complete peace of mind.",
      icon: ShieldCheck,
      color: "text-blue-600 bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/45",
    },
    {
      title: "Affordable Pricing",
      description: "Competitive prices with excellent value for money.",
      icon: Tag,
      color: "text-green-600 bg-green-50/50 border-green-100 dark:bg-green-950/20 dark:border-green-900/45",
    },
    {
      title: "Expert Support",
      description: "Friendly guidance before and after every purchase.",
      icon: HeartHandshake,
      color: "text-purple-600 bg-purple-50/50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/45",
    },
    {
      title: "Trusted Local Store",
      description: "Serving customers with honesty, quality, and dependable service.",
      icon: Smile,
      color: "text-orange-600 bg-orange-50/50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/45",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-slate-50/30 dark:bg-slate-950">
      {/* Background blobs & patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 dark:opacity-35 pointer-events-none" />
      
      {/* Dynamic ambient blur spots */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 translate-x-1/4 w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Services Section */}
      <section id="services" className="py-24 relative z-10 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 rounded-full uppercase tracking-wider inline-block"
            >
              Our Services
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight"
            >
              Technology Solutions for Every Need
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
              Whether you&apos;re purchasing a new smartphone, upgrading your laptop, looking for accessories, or repairing your mobile device, Shree Krishna Computers offers reliable products and trusted services to meet your everyday technology needs.
            </motion.p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceList.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group relative bg-gradient-to-b from-slate-50/50 to-white/80 dark:from-slate-900/60 dark:to-slate-950/40 rounded-2xl p-7 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 border border-slate-200/60 dark:border-slate-800/80 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-500 flex flex-col justify-between hover:-translate-y-2 cursor-pointer overflow-hidden min-h-[220px]"
                >
                  {/* Top Light-up Line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl pointer-events-none" />

                  {/* Gradient reflection inside the card */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div>
                    {/* Icon wrapper */}
                    <div className={`p-3.5 rounded-2xl border transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 w-fit ${service.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>

                    {/* Card Info */}
                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                      {service.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-medium">
                      {service.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose-us" className="py-24 relative z-10 border-t border-slate-200/60 dark:border-slate-900/60 bg-white/20 dark:bg-slate-950/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 rounded-full uppercase tracking-wider inline-block">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Choose Shree Krishna Computers?
            </h2>
            <div className="h-1 w-20 bg-blue-600 rounded-full mx-auto" />
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-semibold text-base sm:text-lg">
              We offer original products from trusted brands, friendly expert support, and excellent value for money.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsData.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group relative bg-gradient-to-b from-slate-50/50 to-white/80 dark:from-slate-900/60 dark:to-slate-900/40 rounded-2xl p-7 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 border border-slate-200/60 dark:border-slate-800/80 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-500 flex flex-col items-center text-center hover:-translate-y-2 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className={`p-4 rounded-full border mb-5 transition-transform duration-500 group-hover:rotate-[10deg] ${item.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-semibold">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
}
