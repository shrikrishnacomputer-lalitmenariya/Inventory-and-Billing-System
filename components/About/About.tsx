"use client";

import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, Wrench, HeartHandshake, Laptop } from "lucide-react";

export default function About() {
  const specialties = [
    "Mobile Phones",
    "Laptops & Computers",
    "Air Conditioners",
    "Printers",
    "Mobile Accessories",
    "Computer Accessories",
    "Smart Watches",
    "Headphones & Speakers",
    "Mobile Repair Services",
    "Genuine Electronic Products",
  ];

  const coreValues = [
    {
      id: 1,
      title: "Wide Product Range",
      description: "Offer smartphones, laptops, printers, air conditioners, accessories, smart watches, headphones, speakers, and more—all under one roof.",
      icon: Laptop,
      color: "text-blue-600 bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/45",
    },
    {
      id: 2,
      title: "Genuine Products",
      description: "Provide genuine products from trusted brands with reliable quality and customer satisfaction.",
      icon: ShieldCheck,
      color: "text-green-600 bg-green-50/50 border-green-100 dark:bg-green-950/20 dark:border-green-900/45",
    },
    {
      id: 3,
      title: "Expert Mobile Repair",
      description: "Professional mobile phone repair with experienced technicians, quality workmanship, and affordable solutions.",
      icon: Wrench,
      color: "text-purple-600 bg-purple-50/50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/45",
    },
    {
      id: 4,
      title: "Customer First",
      description: "Focus on honest guidance, transparent pricing, friendly service, and dependable after-sales support.",
      icon: HeartHandshake,
      color: "text-orange-600 bg-orange-50/50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/45",
    },
  ];

  return (
    <section id="about" className="py-20 bg-slate-50/40 dark:bg-slate-900/20 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Story & Specializations */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              About Shree Krishna Computers
            </h2>
            <div className="h-1 w-20 bg-blue-600 rounded-full" />
            
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              At Shree Krishna Computers, we are committed to providing quality electronic products and reliable services for everyday technology needs. Whether you&apos;re looking for the latest smartphone, laptop, printer, air conditioner, or genuine accessories, we offer trusted products at competitive prices.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              We also provide professional mobile repair services and customer support to keep your essential devices running smoothly. Our focus is on offering honest advice, genuine products, and building long-term customer relationships based on trust and dependable care.
            </p>
            
            {/* Highlight Box */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white rounded-2xl p-6 shadow-md border border-blue-500/10 dark:border-blue-600/20">
              <h4 className="text-lg font-bold tracking-tight mb-2">
                Your Trusted Electronics Store
              </h4>
              <p className="text-sm text-blue-50/90 dark:text-blue-100/90 leading-relaxed font-medium">
                Whether you&apos;re purchasing a new smartphone, upgrading your laptop, buying an air conditioner, looking for genuine accessories, or repairing your mobile device, Shree Krishna Computers is committed to delivering quality products, expert service, and a shopping experience you can trust.
              </p>
            </div>

            {/* Specialties Grid */}
            <div className="pt-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
                What We Offer
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {specialties.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Genuine Core Values (Simplified and Genuine) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {coreValues.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <motion.div
                  key={value.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700/80 transition-all flex flex-col group hover:scale-[1.02]"
                >
                  <div className={`p-3 rounded-xl border w-fit ${value.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-5">
                    {value.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-semibold">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
