import React, { useState } from 'react';
import { Bot, Sparkles, Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoCandidate = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginAsDemo('candidate');
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoRecruiter = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginAsDemo('recruiter');
      onNavigate('recruiter');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 mb-2">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sign In to Berri Bot</h2>
          <p className="text-xs text-slate-400">Access your candidate dashboard or recruiter portal</p>
        </div>

        {/* Demo Fast-Login Cards */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-blue-500/30 space-y-2.5 backdrop-blur-md">
          <p className="text-[11px] font-mono uppercase tracking-wider text-blue-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant One-Click Demonstration Logins</span>
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDemoCandidate}
              className="p-3 rounded-xl bg-slate-950/80 border border-slate-700/80 hover:border-blue-500 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-blue-400 mb-1">
                <span className="text-xs font-bold">Candidate</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 font-medium">Priya Sharma</p>
              <p className="text-[10px] text-slate-500">Full Stack Engineer</p>
            </button>

            <button
              type="button"
              onClick={handleDemoRecruiter}
              className="p-3 rounded-xl bg-slate-950/80 border border-slate-700/80 hover:border-purple-500 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-purple-400 mb-1">
                <span className="text-xs font-bold">Recruiter</span>
                <Shield className="w-3 h-3 text-purple-400" />
              </div>
              <p className="text-[11px] text-slate-300 font-medium">Alex Morgan</p>
              <p className="text-[10px] text-slate-500">Talent Acquisition</p>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-xl space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-blue-400 hover:underline font-medium"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
