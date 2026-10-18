import React, { useEffect, useState } from 'react';
import { History, Calendar, Award, ChevronRight, Download, RefreshCw, Search, Play } from 'lucide-react';
import { api } from '../services/api';
import { InterviewSession } from '../types';

interface InterviewHistoryPageProps {
  onNavigate: (tab: string, sessionId?: number) => void;
}

export const InterviewHistoryPage: React.FC<InterviewHistoryPageProps> = ({ onNavigate }) => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInterviewHistory();
      setSessions(data);
    } catch (e) {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = sessions.filter(
    (s) =>
      s.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.recommendation && s.recommendation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Interview History</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track your performance progress across historical practice and assessment sessions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('config')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>New Interview</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role, language, or recommendation..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={loadHistory}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Session Cards Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading past sessions...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800 text-center space-y-3">
          <p className="text-xs text-slate-400">No matching interview sessions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const isComp = s.status === 'completed';
            const scoreColor =
              s.overall_score >= 80
                ? 'text-emerald-400'
                : s.overall_score >= 65
                ? 'text-blue-400'
                : 'text-amber-400';

            return (
              <div
                key={s.id}
                onClick={() => onNavigate(isComp ? 'results' : 'live', s.id)}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      {s.job_role}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {s.language.toUpperCase()}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40">
                      {s.experience_level}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{s.total_questions} Questions</span>
                    <span>•</span>
                    <span className="capitalize">{s.interview_type}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  {isComp ? (
                    <div className="text-right">
                      <span className={`text-xl font-extrabold font-mono ${scoreColor}`}>
                        {s.overall_score}%
                      </span>
                      <p className="text-[10px] text-slate-400">{s.recommendation}</p>
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
  );
};
