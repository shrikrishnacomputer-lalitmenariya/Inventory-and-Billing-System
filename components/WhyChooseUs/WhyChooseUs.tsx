"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Tag, HelpCircle, Zap, Users, Smile } from "lucide-react";

export default function WhyChooseUs() {
  const features = [
    {
      title: "Genuine Products",
      description: "We supply only 100% original systems, computer components, laptops, and peripheral accessories backed by manufacturer warranty.",
      icon: ShieldCheck,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      title: "Affordable Pricing",
      description: "Enjoy transparent, market-competitive pricing on all sales, repairs, software solutions, and GST hardware purchases.",
      icon: Tag,
      color: "bg-green-50 text-green-600 border-green-100",
    },
    {
      title: "Professional Support",
      description: "Receive fast guidance from our certified tech professionals who offer support, configuration help, and remote diagnostics.",
      icon: HelpCircle,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      title: "Fast Service",
      description: "Get prompt response times and speed-focused turnarounds on custom PC builds, formatting, and printer repairs.",
      icon: Zap,
      color: "bg-orange-50 text-orange-600 border-orange-100",
    },
    {
      title: "Experienced Team",
      description: "Leverage over 15 years of industry experience resolving complex computer errors, software bugs, and networking limits.",
      icon: Users,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      title: "Customer Satisfaction",
      description: "Count on our client-first dedication which has earned us the trust of thousands of local shoppers, shops, and offices.",
      icon: Smile,
      color: "bg-pink-50 text-pink-600 border-pink-100",
    },
  ];

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why Choose Shree Krishna Computers?
          </h2>
          <div className="h-1 w-20 bg-blue-600 rounded-full mx-auto" />
          <p className="text-slate-550 leading-relaxed font-medium text-base">
            We are committed to delivering unmatched hardware quality and stellar customer service to power your technology.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex gap-4 hover:shadow-md hover:border-slate-200 transition-all group"
              >
                {/* Icon wrapper */}
                <div className={`p-3 rounded-xl border h-fit shrink-0 ${feature.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                {/* Feature info */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
