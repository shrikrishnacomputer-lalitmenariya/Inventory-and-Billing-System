"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Failed to request password reset' });
      } else {
        setStatus({ 
          type: 'success', 
          message: `Reset link sent successfully via ${data.method === 'whatsapp' ? 'WhatsApp' : 'Email'}. Please check your messages.` 
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans bg-no-repeat"
      style={{ backgroundImage: "url('/bg1.jpg')", backgroundSize: "100vw 100vh" }}
    >
      <div className="max-w-md w-full space-y-8 glass-card p-10 z-10">
        <div>
          <h2 className="mt-2 text-center text-3xl font-medium text-white tracking-wide">
            Forgot Password
          </h2>
          <p className="mt-6 text-center text-sm font-light text-white/80">
            Enter your owner username and email to receive a reset link.
          </p>
        </div>
        
        {status?.type === 'success' ? (
          <div className="mt-8 space-y-6">
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl backdrop-blur-md">
              <p className="text-green-300 text-sm font-light text-center">{status.message}</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full flex justify-center py-3.5 px-4 border border-white/20 text-lg font-medium rounded-xl text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2d1b54] focus:ring-purple-400 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)]"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-light text-white/80 mb-2">Owner Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/30 placeholder-white/40 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/10 transition-all sm:text-sm shadow-inner"
                  placeholder="Owner Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-light text-white/80 mb-2">Owner Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/30 placeholder-white/40 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/10 transition-all sm:text-sm shadow-inner"
                  placeholder="Owner Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {status?.type === 'error' && (
              <div className="text-red-300 text-sm text-center font-light bg-red-900/40 p-3 rounded-xl border border-red-500/50 backdrop-blur-sm">
                {status.message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 mt-6 border border-white/20 text-lg font-medium rounded-xl text-white bg-gradient-to-r from-[#9b66ff]/80 to-[#7848ff]/80 hover:from-[#9b66ff] hover:to-[#7848ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2d1b54] focus:ring-purple-400 disabled:opacity-50 transition-all shadow-[0_4px_14px_0_rgba(120,72,255,0.39)]"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
            
            <div className="text-center mt-6">
              <a href="/login" className="text-sm font-light text-white/70 hover:text-white transition-colors">
                Cancel
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
