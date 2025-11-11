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
      <div className="w-full max-w-md max-h-[calc(100vh-3rem)] flex flex-col">
        <div className="bg-vis-panel backdrop-blur-sm rounded-3xl shadow-vis-glow-teal overflow-hidden border border-vis-border-light flex-1 flex flex-col">
          <div className="px-8 py-10 flex flex-col overflow-y-auto">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4" style={{ height: '3.5rem', width: '3.5rem' }}>
                <img src={logoIcon} alt="AI POD Works" className="object-contain" style={{ height: '3.5rem', width: '3.5rem' }} />
              </div>
              <h1 className="text-2xl font-bold text-vis-text-primary tracking-tight">AI POD Works</h1>
              <p className="text-sm text-vis-text-secondary mt-1">创建您的账户</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-vis-text-primary mb-2" htmlFor="email">
                  电子邮件地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vis-text-muted" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-vis-border bg-vis-surface py-3.5 pl-12 pr-4 text-base text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder="电子邮件地址"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-vis-text-primary mb-2" htmlFor="username">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vis-text-muted" />
                  <input
                    id="username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={50}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-xl border border-vis-border bg-vis-surface py-3.5 pl-12 pr-4 text-base text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder="用户名"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-vis-text-primary mb-2" htmlFor="fullName">
                  全名 (可选)
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vis-text-muted" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-xl border border-vis-border bg-vis-surface py-3.5 pl-12 pr-4 text-base text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder="输入全名"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-vis-text-primary mb-2" htmlFor="password">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vis-text-muted" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-vis-border bg-vis-surface py-3.5 pl-12 pr-4 text-base text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder="创建密码 (至少6位)"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-vis-text-primary mb-2" htmlFor="confirmPassword">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vis-text-muted" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-vis-border bg-vis-surface py-3.5 pl-12 pr-4 text-base text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 text-white font-semibold py-3.5 rounded-xl shadow-vis-glow-teal hover:shadow-vis-glow-cyan transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vis-teal-400 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
                <span className="text-base font-medium">{isLoading ? '创建账户中...' : '创建账户'}</span>
              </button>
            </form>

            {/* Footer */}
            {onBackToLogin && (
              <div className="mt-6 text-center">
                <p className="text-sm text-vis-text-secondary">
                  已有账号？{' '}
                  <button
                    onClick={onBackToLogin}
                    className="text-vis-teal-400 hover:text-vis-cyan-400 font-semibold transition-colors"
                  >
                    登录
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
