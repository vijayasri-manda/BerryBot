import React, { useEffect, useState } from 'react';
import { Play, FileText, CheckCircle2, AlertTriangle, TrendingUp, Award, Calendar, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { InterviewSession } from '../types';

interface CandidateDashboardProps {
  onNavigate: (tab: string, sessionId?: number) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getInterviewHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load interview history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const completedSessions = history.filter((s) => s.status === 'completed');
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, curr) => acc + curr.overall_score, 0) /
            completedSessions.length
        )
      : 0;

  const latestSession = completedSessions[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Launch Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-indigo-950/70 border border-blue-500/30 shadow-2xl backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Candidate Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.full_name || 'Candidate'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Ready to elevate your skills? Practice with our adaptive AI interviewer in English, Telugu, Hindi, Tamil, or Kannada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('resume')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Resume Analysis</span>
            </button>
            <button
              onClick={() => onNavigate('config')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start New Interview</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Total Interviews Taken</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-white">{history.length}</h3>
            <span className="text-[11px] font-mono text-emerald-400">{completedSessions.length} completed</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Average Composite Score</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-blue-400">{avgScore}%</h3>
            <span className="text-[11px] font-mono text-blue-300">Weighted Rubric</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Latest Recommendation</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-bold text-teal-300 truncate">
              {latestSession?.recommendation || 'No tests yet'}
            </h3>
            <Award className="w-4 h-4 text-teal-400 shrink-0" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Target Role Profile</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-bold text-indigo-300 truncate">
              {latestSession?.job_role || 'Full Stack Developer'}
            </h3>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {latestSession?.experience_level || 'Intermediate'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Past Sessions & Learning Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Previous Interview Sessions Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Interview History & Detailed Reports</h2>
              <p className="text-xs text-slate-400">Review your past performance, rubrics, and feedback</p>
            </div>
            <button
              onClick={loadHistory}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading sessions...</div>
          ) : history.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center space-y-3">
              <p className="text-xs text-slate-400">No interviews completed yet.</p>
              <button
                onClick={() => onNavigate('config')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
              >
                Take Your First Interview
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((sess) => {
                const isComp = sess.status === 'completed';
                const scoreColor =
                  sess.overall_score >= 80
                    ? 'text-emerald-400'
                    : sess.overall_score >= 65
                    ? 'text-blue-400'
                    : 'text-amber-400';

                return (
                  <div
                    key={sess.id}
                    onClick={() => onNavigate(isComp ? 'results' : 'live', sess.id)}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                          {sess.job_role}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {sess.language.toUpperCase()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40">
                          {sess.experience_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(sess.created_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{sess.total_questions} Questions</span>
                        <span>•</span>
                        <span className="capitalize">{sess.interview_type}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {isComp ? (
                        <div className="text-right">
                          <p className={`text-base font-extrabold ${scoreColor}`}>
                            {sess.overall_score}%
                          </p>
                          <p className="text-[10px] text-slate-400">{sess.recommendation}</p>
                        </div>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950/50 border border-amber-600/30 text-amber-300">
                          In Progress
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Key Gaps & Learning Recommendations */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-base font-bold text-white">Targeted Knowledge Improvement</h2>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            {latestSession ? (
              <>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">
                    Demonstrated Strengths
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {latestSession.strengths_summary || 'Strong grounding in component lifecycle and REST APIs.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                    Identified Knowledge Gaps
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {latestSession.knowledge_gaps_summary || 'Deepen understanding of distributed cache stampedes and database locking.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onNavigate('results', latestSession.id)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Latest Full Audit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Complete an interview to reveal tailored learning recommendations and knowledge gap analytics.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
