import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import logoIcon from '../assets/AI-POD-Lite-icon.png';

interface LoginPageProps {
  onRegisterClick?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onRegisterClick }) => {
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
    <div className="h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xs sm:max-w-sm">
        <div className="bg-vis-panel backdrop-blur-sm rounded-2xl shadow-vis-glow-teal overflow-hidden border border-vis-border-light">
          <div className="px-6 py-6 flex flex-col">
            <div className="flex flex-col items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-vis-teal-400 via-vis-cyan-400 to-vis-teal-500 flex items-center justify-center shadow-vis-glow-teal">
                <img src={logoIcon} alt="AI POD" className="h-8 w-8 object-contain" />
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.35em] text-vis-text-muted">AI POD</p>
                <p className="mt-0.5 text-sm font-semibold text-vis-text-primary">Creative Studio Login</p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-vis-text-primary">Welcome back</h1>
              <p className="text-xs text-vis-text-secondary mt-1.5">Sign in to continue building with AI POD Lite.</p>
            </div>

            <form className="mt-6 space-y-4 flex-1" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-vis-text-primary mb-1.5" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-vis-text-muted" />
                  <input
                    id="email"
                    type="text"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-vis-border bg-gray-800/50 py-2.5 pl-9 pr-3 text-sm text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder="Email address"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-vis-text-primary mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-vis-text-muted" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-vis-border bg-gray-800/50 py-2.5 pl-9 pr-3 text-sm text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 text-white font-semibold py-2.5 rounded-lg shadow-vis-glow-teal hover:shadow-vis-glow-cyan transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vis-teal-400 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center space-x-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  <span className="text-sm">{isLoading ? 'Signing in…' : 'Continue'}</span>
                </span>
              </button>
            </form>

            <div className="mt-4 space-y-2">
              <p className="text-center text-[10px] text-vis-text-muted">
                Default: <span className="font-semibold text-vis-text-secondary">admin / admin123</span>
              </p>
              {onRegisterClick && (
                <p className="text-center text-xs text-vis-text-secondary">
                  Don't have an account?{' '}
                  <button
                    onClick={onRegisterClick}
                    className="text-vis-teal-400 hover:text-vis-cyan-400 font-semibold transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
