import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { ResumeUploadPage } from './pages/ResumeUploadPage';
import { InterviewConfigPage } from './pages/InterviewConfigPage';
import { LiveInterviewPage } from './pages/LiveInterviewPage';
import { InterviewResultsPage } from './pages/InterviewResultsPage';
import { InterviewHistoryPage } from './pages/InterviewHistoryPage';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activeSessionId, setActiveSessionId] = useState<number | undefined>(undefined);
  const [selectedResumeId, setSelectedResumeId] = useState<number | undefined>(undefined);
  const isHR = user?.role === 'recruiter' || user?.role === 'admin';
  const hrTabs = ['recruiter', 'policy', 'rubric', 'audit'];

  // If user logs in while on landing or login, navigate to appropriate role home
  useEffect(() => {
    setCurrentTab(user ? (isHR ? 'recruiter' : 'dashboard') : 'landing');
    setActiveSessionId(undefined);
    setSelectedResumeId(undefined);
  }, [user]);

  const handleNavigate = (tab: string, sessionId?: number, resumeId?: number) => {
    if (!user && !['landing', 'login', 'register'].includes(tab)) tab = 'login';
    if (user && !isHR && hrTabs.includes(tab)) tab = 'dashboard';
    if (isHR && ['landing', 'dashboard', 'resume', 'config', 'live', 'history'].includes(tab)) tab = 'recruiter';
    if (sessionId) setActiveSessionId(sessionId);
    if (resumeId) setSelectedResumeId(resumeId);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span>Starting Berri Bot AI Platform...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar currentTab={currentTab} onNavigate={handleNavigate} />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentTab === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentTab === 'register' && <RegisterPage onNavigate={handleNavigate} />}
        {currentTab === 'dashboard' && <CandidateDashboard onNavigate={handleNavigate} />}
        {currentTab === 'resume' && (
          <ResumeUploadPage onNavigate={handleNavigate} selectedResumeId={selectedResumeId} />
        )}
        {currentTab === 'config' && (
          <InterviewConfigPage onNavigate={handleNavigate} selectedResumeId={selectedResumeId} />
        )}
        {currentTab === 'live' && (
          <LiveInterviewPage
            sessionId={activeSessionId || 1}
            onNavigate={handleNavigate}
          />
        )}
        {currentTab === 'results' && (
          <InterviewResultsPage
            sessionId={activeSessionId || 1}
            onNavigate={handleNavigate}
          />
        )}
        {currentTab === 'history' && <InterviewHistoryPage onNavigate={handleNavigate} />}
        {isHR && hrTabs.includes(currentTab) && (
          <RecruiterDashboard
            onNavigate={handleNavigate}
            initialTab={currentTab === 'recruiter' ? 'candidates' : currentTab as 'policy' | 'rubric' | 'audit'}
          />
        )}
        {currentTab === 'settings' && <SettingsPage />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
