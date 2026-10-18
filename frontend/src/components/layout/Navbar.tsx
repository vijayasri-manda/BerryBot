import React from 'react';
import { Bot, User as UserIcon, Shield, FileText, CheckCircle2, History, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, logout, loginAsDemo } = useAuth();
  const isHR = user?.role === 'recruiter' || user?.role === 'admin';
  const links = isHR ? [
    ['recruiter', 'Candidates'],
    ['policy', 'Interview Settings'],
    ['rubric', 'Rubric Weights'],
    ['audit', 'Audit Trail'],
  ] : [
    ['dashboard', 'Dashboard'],
    ['resume', 'My Resume'],
    ['config', 'Start Interview'],
    ['history', 'My Interviews'],
    ['settings', 'Account Settings'],
  ];
  const navigation = user ? (
    <div className="flex items-center gap-1 text-sm font-medium">
      {links.map(([tab, label]) => (
        <button key={tab} onClick={() => onNavigate(tab)} aria-current={currentTab === tab ? 'page' : undefined}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${currentTab === tab
            ? isHR ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
            : 'text-slate-300 hover:text-white hover:bg-slate-900'}`}>
          {label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate(user ? (isHR ? 'recruiter' : 'dashboard') : 'landing')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                  BERRI BOT
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-mono">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block">
                Intelligent Multilingual AI Interviewer
              </p>
            </div>
          </div>

          <div className="hidden lg:block">{navigation}</div>

          {/* Right Section: User Status or Login Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-200 leading-tight">{user.full_name}</p>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {isHR ? (user.role === 'admin' ? 'Admin' : 'HR Recruiter') : 'Candidate'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  aria-label="Logout"
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loginAsDemo('candidate')}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Demo Candidate</span>
                </button>
                <button
                  onClick={() => loginAsDemo('recruiter')}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span>Demo Recruiter</span>
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
        {user && <div className="lg:hidden overflow-x-auto pb-2" aria-label="Role navigation">{navigation}</div>}
      </div>
    </nav>
  );
};
