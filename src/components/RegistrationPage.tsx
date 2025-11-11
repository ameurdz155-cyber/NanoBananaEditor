import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import logoIcon from '../assets/AI-POD-Lite-icon.png';

interface RegistrationPageProps {
  onBackToLogin?: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onBackToLogin }) => {
  const register = useAuthStore((state) => state.register);
  const language = useAppStore((state) => state.language);
  const t = getTranslation(language);
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
      setError(t.passwordsDoNotMatch);
      return;
    }

    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    setIsLoading(true);

    try {
      await register(email.trim(), username.trim(), password.trim(), fullName.trim() || undefined);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t.unableToRegister);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xs sm:max-w-sm h-[calc(100vh-3rem)] sm:h-auto sm:max-h-[90vh] flex flex-col">
        <div className="bg-vis-panel backdrop-blur-sm rounded-2xl shadow-vis-glow-teal border border-vis-border-light flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-6 flex flex-col flex-1 overflow-y-auto">
            <div className="flex flex-col items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-vis-teal-400 via-vis-cyan-400 to-vis-teal-500 flex items-center justify-center shadow-vis-glow-teal">
                <img src={logoIcon} alt="AI POD" className="h-8 w-8 object-contain" />
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.35em] text-vis-text-muted">AI POD</p>
                <p className="mt-0.5 text-sm font-semibold text-vis-text-primary">Create Your Account</p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-vis-text-primary">{t.registrationTitle}</h1>
              <p className="text-xs text-vis-text-secondary mt-1.5">{t.registrationSubtitle}</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-vis-text-primary mb-1.5" htmlFor="email">
                  {t.emailAddress}
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-vis-text-muted" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-vis-border bg-gray-800/50 py-2.5 pl-9 pr-3 text-sm text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder={t.emailAddress}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-vis-text-primary mb-1.5" htmlFor="username">
                  {t.username}
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-vis-text-muted" />
                  <input
                    id="username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={50}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-lg border border-vis-border bg-gray-800/50 py-2.5 pl-9 pr-3 text-sm text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder={t.username}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-vis-text-primary mb-1.5" htmlFor="fullName">
                  {t.fullName}
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-vis-text-muted" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-lg border border-vis-border bg-gray-800/50 py-2.5 pl-9 pr-3 text-sm text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder={t.fullNamePlaceholder}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-vis-text-primary mb-1.5" htmlFor="password">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-vis-text-muted" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-vis-border bg-gray-800/50 py-2.5 pl-9 pr-3 text-sm text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder={t.createPassword}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-vis-text-primary mb-1.5" htmlFor="confirmPassword">
                  {t.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-vis-text-muted" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-lg border border-vis-border bg-gray-800/50 py-2.5 pl-9 pr-3 text-sm text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder={t.confirmPasswordPlaceholder}
                    autoComplete="new-password"
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
                  <span className="text-sm">{isLoading ? t.creatingAccount : t.createAccount}</span>
                </span>
              </button>
            </form>

          </div>
          
          {onBackToLogin && (
            <div className="px-6 py-4 border-t border-vis-border bg-gray-800/30">
              <button
                onClick={onBackToLogin}
                className="w-full text-center text-xs text-vis-text-secondary hover:text-vis-teal-300 transition-colors flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>{t.backToLogin}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
