"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar/Navbar";
import Hero from "@/components/Hero/Hero";
import About from "@/components/About/About";
import Services from "@/components/Services/Services";
import Contact from "@/components/Contact/Contact";
import Footer from "@/components/Footer/Footer";
import PageLoader from "@/components/PageLoader/PageLoader";

export default function Home() {
  const [loading, setLoading] = useState(true);

  // Stop body scrolling when loader is active
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <PageLoader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {!loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col min-h-screen"
          >
            <Navbar />
            <main className="flex-grow">
              <Hero />
              <About />
              <Services />
              <Contact />
            </main>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
