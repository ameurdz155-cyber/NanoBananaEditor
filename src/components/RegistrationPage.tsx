import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import logoIcon from '../assets/AI-POD-Lite-icon.png';

interface RegistrationPageProps {
  onBackToLogin?: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onBackToLogin }) => {
  const register = useAuthStore((state) => state.register);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(email.trim(), username.trim(), password.trim(), fullName.trim() || undefined);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to register. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-[#101423] to-slate-900 flex items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xs sm:max-w-sm h-[calc(100vh-3rem)] sm:h-auto sm:max-h-[90vh] flex flex-col">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-900/30 dark:shadow-black/50 border border-white/30 dark:border-gray-700/50 flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-6 flex flex-col flex-1 overflow-y-auto">
            <div className="flex flex-col items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#f5ff3a] via-[#ffe348] to-[#facc15] flex items-center justify-center shadow-md shadow-[#facc15]/40">
                <img src={logoIcon} alt="AI POD" className="h-8 w-8 object-contain" />
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">AI POD</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">Create Your Account</p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Get started</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Join AI POD Lite and start creating with AI.</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 py-2.5 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/60 outline-none transition"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={50}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-lg border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 py-2.5 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/60 outline-none transition"
                    placeholder="username"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="fullName">
                  Full name (optional)
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-lg border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 py-2.5 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/60 outline-none transition"
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 py-2.5 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/60 outline-none transition"
                    placeholder="Create password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-lg border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 py-2.5 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/60 outline-none transition"
                    placeholder="Confirm password"
                    autoComplete="new-password"
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
                  <span className="text-sm">{isLoading ? 'Creating account…' : 'Create account'}</span>
                </span>
              </button>
            </form>

          </div>
          
          {onBackToLogin && (
            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <button
                onClick={onBackToLogin}
                className="w-full text-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
