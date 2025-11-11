import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import logoIcon from '../assets/AI-POD-Lite-icon.png';

interface LoginPageProps {
  onRegisterClick?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onRegisterClick }) => {
  const login = useAuthStore((state) => state.login);
  const language = useAppStore((state) => state.language);
  const t = getTranslation(language);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved credentials on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password.trim());
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email.trim());
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberEmail');
        localStorage.removeItem('rememberMe');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t.unableToSignIn);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="bg-vis-panel backdrop-blur-sm rounded-3xl shadow-vis-glow-teal overflow-hidden border border-vis-border-light">
          <div className="px-8 py-10 flex flex-col">
            {/* Logo with gradient circle */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4" style={{ height: '3.5rem', width: '3.5rem' }}>
                {/* Logo only - no background */}
                <img src={logoIcon} alt="AI POD Works" className="object-contain" style={{ height: '3.5rem', width: '3.5rem' }} />
              </div>
              <h1 className="text-2xl font-bold text-vis-text-primary tracking-tight">AI POD Works</h1>
              <p className="text-sm text-vis-text-secondary mt-1">你好，欢迎您使用星星云创</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email input */}
              <div>
                <label className="block text-sm font-medium text-vis-text-primary mb-2" htmlFor="email">
                  电子邮件地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vis-text-muted" />
                  <input
                    id="email"
                    type="text"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-vis-border bg-vis-surface py-3.5 pl-12 pr-4 text-base text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder="电子邮件地址"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password input */}
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
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-vis-border bg-vis-surface py-3.5 pl-12 pr-4 text-base text-vis-text-primary placeholder:text-vis-text-muted focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-500/30 outline-none transition-all duration-200"
                    placeholder="输入密码"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-vis-border bg-vis-surface text-vis-teal-500 focus:ring-2 focus:ring-vis-teal-500/30 focus:ring-offset-0 transition-colors cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-vis-text-secondary cursor-pointer">
                  记住我
                </label>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Login button */}
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
                <span className="text-base font-medium">{isLoading ? '登录中...' : '继续'}</span>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 space-y-3 text-center">
              <p className="text-xs text-vis-text-muted">
                默认: admin / admin123
              </p>
              {onRegisterClick && (
                <p className="text-sm text-vis-text-secondary">
                  还没有账号？{' '}
                  <button
                    onClick={onRegisterClick}
                    className="text-vis-teal-400 hover:text-vis-cyan-400 font-semibold transition-colors"
                  >
                    注册
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
