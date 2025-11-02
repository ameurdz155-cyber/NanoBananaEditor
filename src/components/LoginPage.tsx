import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight, Chrome } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import logoIcon from '../assets/AI-POD-Lite-icon.png';

export const LoginPage: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password.trim());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-[#101423] to-slate-900 flex items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xs sm:max-w-sm">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-900/30 overflow-hidden border border-white/30">
          <div className="px-6 py-6 flex flex-col">
            <div className="flex flex-col items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#f5ff3a] via-[#ffe348] to-[#facc15] flex items-center justify-center shadow-md shadow-[#facc15]/40">
                <img src={logoIcon} alt="AI POD" className="h-8 w-8 object-contain" />
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400">AI POD</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">Creative Studio Login</p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">Welcome back</h1>
              <p className="text-xs text-gray-500 mt-1.5">Sign in to continue building with AI POD Lite.</p>
            </div>

            <form className="mt-6 space-y-4 flex-1" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    id="email"
                    type="text"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-gray-200/80 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/60 outline-none transition"
                    placeholder="Email address"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-gray-200/80 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/60 outline-none transition"
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#f5ff3a] via-[#fede4d] to-[#facc15] text-gray-900 font-semibold py-2.5 rounded-lg shadow-lg shadow-[#facc15]/35 hover:shadow-xl hover:shadow-[#facc15]/45 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#facc15] disabled:opacity-70"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center space-x-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  <span className="text-sm">{isLoading ? 'Signing in…' : 'Continue'}</span>
                </span>
              </button>
            </form>

            <div className="flex items-center mt-6">
              <span className="flex-grow border-t border-gray-200" />
              <span className="mx-2.5 text-[10px] uppercase tracking-widest text-gray-400">Or</span>
              <span className="flex-grow border-t border-gray-200" />
            </div>

            <button
              type="button"
              className="mt-4 w-full border border-gray-200/90 rounded-lg py-2.5 flex items-center justify-center space-x-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              disabled
            >
              <Chrome className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Continue with Google</span>
            </button>

            <p className="text-center text-[10px] text-gray-400 mt-4">
              Use the default credentials <span className="font-semibold text-gray-700">admin / admin</span> to explore locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
