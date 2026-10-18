import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Download, Award, CheckCircle2, AlertTriangle, BookOpen, User, Calendar,
  ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Share2, ArrowRight, BarChart2
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { FullInterviewReport, QuestionOut } from '../types';

interface InterviewResultsPageProps {
  sessionId: number;
  onNavigate: (tab: string, sessionId?: number) => void;
}

export const InterviewResultsPage: React.FC<InterviewResultsPageProps> = ({
  sessionId,
  onNavigate,
}) => {
  const [report, setReport] = useState<FullInterviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQIndex, setExpandedQIndex] = useState<number | null>(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      try {
        const data = await api.getInterviewReport(sessionId);
        setReport(data);

        // Fire celebratory confetti if Strong Match or Potential Match
        if (data.overall_score >= 65) {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [sessionId]);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const token = localStorage.getItem('berry_bot_token');
      const response = await fetch(`/api/interviews/${sessionId}/report/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('PDF download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BerriBot_Report_Session_${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download report PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">Synthesizing comprehensive assessment report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-4">
        <p className="text-xs text-rose-300">{error || 'Report not found'}</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-white"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Competency data for Radar Chart
  const radarData = [
    { subject: 'Technical', score: report.technical_score, fullMark: 100 },
    { subject: 'Relevance', score: report.relevance_score, fullMark: 100 },
    { subject: 'Depth', score: report.depth_score, fullMark: 100 },
    { subject: 'Problem Solving', score: report.problem_solving_score, fullMark: 100 },
    { subject: 'Clarity', score: report.clarity_score, fullMark: 100 },
  ];

  // Bar Chart data for Question by Question breakdown
  const barData = report.questions.map((q) => ({
    name: `Q${q.order_index}`,
    score: q.score_overall,
    category: q.category,
  }));

  const effectiveScore = report.recruiter_override_score ?? report.overall_score;
  const effectiveRec = report.recruiter_override_recommendation || report.recommendation;

  const recColor =
    effectiveScore >= 80
      ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
      : effectiveScore >= 65
      ? 'border-blue-500/60 bg-blue-950/40 text-blue-300'
      : effectiveScore >= 50
      ? 'border-amber-500/60 bg-amber-950/40 text-amber-300'
      : 'border-rose-500/60 bg-rose-950/40 text-rose-300';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-blue-400 font-semibold">
            Confidential Assessment Audit
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Interview Performance Report</h1>
          <p className="text-xs text-slate-400">
            Session #{report.session_id} • Completed on {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('config')}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-semibold transition-colors"
          >
            Practice Again
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
          </button>
        </div>
      </div>

      {/* Outcome Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${recColor} shadow-2xl backdrop-blur-md space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold opacity-80">
              AI Decision-Support Recommendation
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{effectiveRec}</h2>
            {report.recruiter_override_score !== null && report.recruiter_override_score !== undefined && (
              <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/50">
                Verified by Human Recruiter
              </span>
            )}
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[11px] uppercase font-mono tracking-wider opacity-80">Composite Score</p>
            <h3 className="text-4xl sm:text-5xl font-black">{effectiveScore}%</h3>
            <span className="text-[10px] opacity-75">Configurable Rubric Weights</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 text-xs sm:text-sm leading-relaxed opacity-95">
          <p>{report.recommendation_justification}</p>
        </div>
      </div>

      {/* Candidate & Session Details Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono">Candidate</span>
          <span className="font-bold text-slate-200">{report.candidate_name}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono">Target Role</span>
          <span className="font-bold text-slate-200">{report.job_role}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono">Experience Tier</span>
          <span className="font-bold text-slate-200">{report.experience_level}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono">Language</span>
          <span className="font-bold text-slate-200 uppercase">{report.language}</span>
        </div>
      </div>

      {/* Visual Analytics Grid (Radar Chart & Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Competency Radar Chart */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Competency Radar</h3>
              <p className="text-xs text-slate-400">5-Point Rubric Breakdown</p>
            </div>
            <span className="text-xs font-mono text-blue-400 font-bold">100 Max</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Question by Question Bar Chart */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Question Score Trajectory</h3>
              <p className="text-xs text-slate-400">Progression across interview sequence</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">{report.questions.length} Questions</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="score" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Knowledge Gaps Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Validated Technical Strengths</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {report.strengths_summary}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Key Areas for Improvement & Gaps</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {report.knowledge_gaps_summary}
          </p>
        </div>
      </div>

      {/* Question-By-Question Detailed Accordion */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Question-by-Question Evaluation Audit</h3>
          <p className="text-xs text-slate-400">Inspect candidate response, scores, and missing concepts</p>
        </div>

        <div className="space-y-3">
          {report.questions.map((q, idx) => {
            const isExpanded = expandedQIndex === idx;
            return (
              <div
                key={q.id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedQIndex(isExpanded ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                      Q{q.order_index}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 line-clamp-1">{q.question_text}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{q.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-extrabold text-blue-400 font-mono">
                      {q.score_overall}%
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 bg-slate-950/40 space-y-4 text-xs animate-in fade-in duration-200">
                    {/* Prompt */}
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">
                        Question Prompt
                      </span>
                      <p className="text-slate-200">{q.question_text}</p>
                    </div>

                    {/* Candidate Answer */}
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">
                        Candidate's Answer ({q.answer_input_type})
                      </span>
                      <p className="text-slate-300 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
                        "{q.candidate_answer || 'No answer recorded'}"
                      </p>
                    </div>

                    {/* Rubric Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Technical (30%)</span>
                        <p className="font-bold text-slate-200">{q.score_technical}%</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Relevance (20%)</span>
                        <p className="font-bold text-slate-200">{q.score_relevance}%</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Depth (20%)</span>
                        <p className="font-bold text-slate-200">{q.score_depth}%</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Problem Solving (20%)</span>
                        <p className="font-bold text-slate-200">{q.score_problem_solving}%</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Clarity (10%)</span>
                        <p className="font-bold text-slate-200">{q.score_clarity}%</p>
                      </div>
                    </div>

                    {/* Justification */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="font-semibold text-slate-200">AI Evaluator Justification:</span>
                      <p className="text-slate-300 leading-relaxed">{q.feedback_justification}</p>
                    </div>

                    {/* Strengths & Missing Concepts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                        <span className="font-bold block mb-0.5">Strengths:</span>
                        <p className="text-[11px] text-slate-300">{q.strengths}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-300">
                        <span className="font-bold block mb-0.5">Missing Concepts / Gaps:</span>
                        <p className="text-[11px] text-slate-300">{q.missing_concepts}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Personalized Learning Roadmap */}
      {report.learning_recommendations && report.learning_recommendations.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Personalized Learning & Growth Roadmap</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.learning_recommendations.map((rec, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{rec.topic}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    rec.priority === 'High' ? 'bg-rose-950/60 text-rose-300' : 'bg-blue-950/60 text-blue-300'
                  }`}>
                    {rec.priority} Priority
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                {rec.resources && (
                  <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-500">
                    <span className="block font-semibold text-slate-400 mb-0.5">Recommended:</span>
                    {rec.resources.map((r, ri) => (
                      <p key={ri}>• {r}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Reviewer Sign-Off Status */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            {report.recruiter_notes ? (
              <span>
                Human Reviewer Signed Off: <b className="text-slate-200">"{report.recruiter_notes}"</b>
              </span>
            ) : (
              <span>
                Pending Recruiter Sign-Off. AI scores serve as decision support and do not represent an automated hiring denial.
              </span>
            )}
          </span>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-xs px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium whitespace-nowrap"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
