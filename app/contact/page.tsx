import Navbar from "@/components/Navbar/Navbar";
import Contact from "@/components/Contact/Contact";
import Footer from "@/components/Footer/Footer";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Banner */}
        <div className="bg-slate-900 text-white py-16 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Contact Shree Krishna Computers</h1>
            <p className="text-slate-400 text-sm mt-3 font-semibold uppercase tracking-wider">
              Get in touch for custom systems, sales support, or corporate queries
            </p>
          </div>
        </div>
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
