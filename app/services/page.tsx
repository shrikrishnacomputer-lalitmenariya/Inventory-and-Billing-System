import Navbar from "@/components/Navbar/Navbar";
import Services from "@/components/Services/Services";
import Footer from "@/components/Footer/Footer";

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Banner */}
        <div className="bg-slate-900 text-white py-16 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Our Services & Solutions</h1>
            <p className="text-slate-400 text-sm mt-3 font-semibold uppercase tracking-wider">
              From individual computer hardware to wholesale billing installations
            </p>
          </div>
        </div>
        <Services />
      </main>
      <Footer />
    </div>
  );
}
