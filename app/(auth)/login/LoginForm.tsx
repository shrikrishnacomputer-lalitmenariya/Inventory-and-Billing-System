"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 glass-card p-10 z-10">
      <div>
        <h2 className="mt-2 text-center text-3xl font-medium text-white tracking-wide">
          Shree Krishna Computer
        </h2>
        <p className="mt-3 text-center text-xs text-white/60 font-semibold uppercase tracking-widest">
          Owner: Lalit Menariya
        </p>
        <p className="mt-6 text-center text-xl text-white/90 font-light">
          Welcome Back, Owner
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-light text-white/80 mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/30 placeholder-white/40 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/10 transition-all sm:text-sm shadow-inner"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-light text-white/80 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/30 placeholder-white/40 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/10 transition-all sm:text-sm shadow-inner"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center justify-start mt-2">
          <div className="text-sm">
            <a href="/forgot-password" className="font-light text-white/70 hover:text-white transition-colors">
              Forget Password ?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3.5 px-4 mt-4 border border-white/20 text-lg font-medium rounded-xl text-white bg-gradient-to-r from-[#9b66ff]/80 to-[#7848ff]/80 hover:from-[#9b66ff] hover:to-[#7848ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2d1b54] focus:ring-purple-400 disabled:opacity-50 transition-all shadow-[0_4px_14px_0_rgba(120,72,255,0.39)]"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}
