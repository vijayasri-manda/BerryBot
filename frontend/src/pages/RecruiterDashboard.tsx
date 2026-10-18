import React, { useEffect, useState } from 'react';
import {
  Shield, Users, Award, Search, Filter, Edit, CheckCircle2, AlertCircle,
  Sliders, History, FileText, ChevronRight, RefreshCw, X, Save
} from 'lucide-react';
import { api } from '../services/api';
import { RecruiterCandidateItem } from '../types';

interface RecruiterDashboardProps {
  onNavigate: (tab: string, sessionId?: number) => void;
  initialTab?: 'candidates' | 'policy' | 'rubric' | 'audit';
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ onNavigate, initialTab = 'candidates' }) => {
  const [candidates, setCandidates] = useState<RecruiterCandidateItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [recFilter, setRecFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const activeTab = initialTab;
  const setActiveTab = (tab: 'candidates' | 'policy' | 'rubric' | 'audit') => onNavigate(tab === 'candidates' ? 'recruiter' : tab);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyMessage, setPolicyMessage] = useState('');
  const [policyError, setPolicyError] = useState('');

  const loadPolicy = () => {
    setPolicyError('');
    api.getInterviewPolicy().then(policy => setQuestionCount(policy.question_count))
      .catch(err => setPolicyError(err.message));
  };
  useEffect(loadPolicy, []);

  const savePolicy = async () => {
    if (questionCount === null) return;
    setPolicySaving(true);
    setPolicyMessage('');
    setPolicyError('');
    try {
      const policy = await api.updateInterviewPolicy(questionCount);
      setQuestionCount(policy.question_count);
      setPolicyMessage(`Saved. New interviews will have ${policy.question_count} questions.`);
      loadAudit();
    } catch (err: any) {
      setPolicyError(err.message);
    } finally {
      setPolicySaving(false);
    }
  };

  // Rubric weights state
  const [rubric, setRubric] = useState({
    technical_weight: 0.30,
    relevance_weight: 0.20,
    depth_weight: 0.20,
    problem_solving_weight: 0.20,
    clarity_weight: 0.10,
  });
  const [rubricMsg, setRubricMsg] = useState('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Selected Candidate Modal for Human Review Override
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidateItem | null>(null);
  const [overrideScore, setOverrideScore] = useState<number | ''>('');
  const [overrideRec, setOverrideRec] = useState('');
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [overrideMsg, setOverrideMsg] = useState('');
  const [overrideError, setOverrideError] = useState('');

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRecruiterCandidates({
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        recommendation: recFilter || undefined,
      });
      setCandidates(data);
    } catch (e) {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  const loadRubric = async () => {
    try {
      const data = await api.getRubricConfig();
      if (data) setRubric(data);
    } catch (e) {}
  };

  const loadAudit = async () => {
    try {
      const data = await api.getAuditLogs();
      setAuditLogs(data);
    } catch (e) {}
  };

  useEffect(() => {
    loadCandidates();
    loadRubric();
    loadAudit();
  }, [searchTerm, roleFilter, recFilter]);

  const handleOpenOverride = (cand: RecruiterCandidateItem) => {
    setSelectedCandidate(cand);
    setOverrideScore(cand.effective_score);
    setOverrideRec(cand.effective_recommendation);
    setRecruiterNotes('');
    setOverrideMsg('');
    setOverrideError('');
  };

  const handleSaveOverride = async () => {
    if (!selectedCandidate) return;
    if (!recruiterNotes.trim()) {
      setOverrideError('Justification notes are required for an audit-logged human override.');
      return;
    }

    try {
      await api.overrideCandidateEvaluation(selectedCandidate.session_id, {
        override_score: typeof overrideScore === 'number' ? overrideScore : undefined,
        override_recommendation: overrideRec || undefined,
        recruiter_notes: recruiterNotes,
      });

      setOverrideMsg('Override recorded successfully in audit trail.');
      loadCandidates();
      loadAudit();
      setTimeout(() => setSelectedCandidate(null), 1200);
    } catch (err: any) {
      setOverrideError(err.message || 'Failed to apply override');
    }
  };

  const handleSaveRubric = async () => {
    setRubricMsg('');
    try {
      await api.updateRubricConfig(rubric);
      setRubricMsg('Evaluation rubric weights updated successfully!');
      loadAudit();
    } catch (err: any) {
      setRubricMsg(err.message || 'Weights must total exactly 1.0 (100%)');
    }
  };

  const totalRubricWeight =
    rubric.technical_weight +
    rubric.relevance_weight +
    rubric.depth_weight +
    rubric.problem_solving_weight +
    rubric.clarity_weight;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900/90 to-blue-950/70 border border-purple-500/30 shadow-2xl backdrop-blur-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/30">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Recruiter & Talent Operations Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Candidate Evaluation Hub</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Review candidate sessions, verify AI rubric decisions, apply human reviewer overrides, and configure competency weights.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button onClick={() => setActiveTab('policy')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${activeTab === 'policy' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            Interview Settings
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'candidates'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Candidates</span>
          </button>
          <button
            onClick={() => setActiveTab('rubric')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'rubric'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Rubric Weights</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {activeTab === 'policy' && (
        <div className="max-w-2xl p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
          <h2 className="text-lg font-bold text-white">Interview Settings</h2>
          <p className="text-sm text-slate-400">Decide how many questions candidates receive. This applies to all new interviews; existing sessions keep their original questions.</p>
          {policyError && <p role="alert" className="text-sm text-rose-300">{policyError}</p>}
          {policyMessage && <p role="status" className="text-sm text-emerald-300">{policyMessage}</p>}
          {questionCount === null ? (
            <button onClick={loadPolicy} className="text-sm text-purple-300">{policyError ? 'Retry loading settings' : 'Loading interview settings...'}</button>
          ) : (
            <>
              <label htmlFor="hr-question-count" className="block text-sm font-semibold text-slate-200">Number of questions</label>
              <select id="hr-question-count" value={questionCount} disabled={policySaving} onChange={e => { setQuestionCount(Number(e.target.value)); setPolicyMessage(''); }} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white">
                {[3, 4, 5, 6, 7, 8, 9, 10].map(count => <option key={count} value={count}>{count} questions</option>)}
              </select>
              <button onClick={savePolicy} disabled={policySaving} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm disabled:opacity-50">{policySaving ? 'Saving...' : 'Save Interview Settings'}</button>
            </>
          )}
        </div>
      )}

      {/* Tab Content 1: Candidates List */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidates by name, email, or role..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="">All Job Roles</option>
                <option value="Full Stack">Full Stack Developer</option>
                <option value="Software Development">Software Development Engineer</option>
                <option value="AI/ML">AI/ML Engineer</option>
                <option value="Java">Java Developer</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={recFilter}
                onChange={(e) => setRecFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="">All Recommendations</option>
                <option value="Strong Match">Strong Match</option>
                <option value="Potential Match">Potential Match</option>
                <option value="Further Assessment Recommended">Further Assessment</option>
                <option value="Does Not Yet Meet Defined Criteria">Not Meeting Criteria</option>
              </select>
            </div>
          </div>

          {/* Candidate Sessions Table */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading candidates...</div>
          ) : candidates.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800 text-center">
              <p className="text-xs text-slate-400">No candidates match the specified filter criteria.</p>
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Role & Level</th>
                      <th className="py-3.5 px-4">Lang</th>
                      <th className="py-3.5 px-4 text-center">Composite Score</th>
                      <th className="py-3.5 px-4">Recommendation</th>
                      <th className="py-3.5 px-4">Review Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {candidates.map((c) => {
                      const scoreColor =
                        c.effective_score >= 80
                          ? 'text-emerald-400'
                          : c.effective_score >= 65
                          ? 'text-blue-400'
                          : 'text-amber-400';

                      return (
                        <tr key={c.session_id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-white">{c.candidate_name}</p>
                            <p className="text-[11px] text-slate-500">{c.candidate_email}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-slate-200">{c.job_role}</p>
                            <span className="text-[10px] text-slate-500">{c.experience_level}</span>
                          </td>
                          <td className="py-4 px-4 font-mono uppercase text-slate-400">
                            {c.language}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`text-base font-extrabold font-mono ${scoreColor}`}>
                              {c.effective_score}%
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs font-semibold text-slate-300">
                              {c.effective_recommendation}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {c.is_reviewed ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40 font-mono">
                                Reviewed & Signed
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                AI Generated Only
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenOverride(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-medium transition-colors"
                            >
                              Human Override
                            </button>
                            <button
                              onClick={() => onNavigate('results', c.session_id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                            >
                              View Report
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Rubric Configuration */}
      {activeTab === 'rubric' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Scoring Rubric Weight Allocator</h3>
              <p className="text-xs text-slate-400">Configure weighting distribution across competencies</p>
            </div>
            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                Math.abs(totalRubricWeight - 1.0) < 0.01
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
              }`}
            >
              Total: {Math.round(totalRubricWeight * 100)}% / 100%
            </span>
          </div>

          {rubricMsg && (
            <p className="p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200">
              {rubricMsg}
            </p>
          )}

          <div className="space-y-4">
            {/* Technical */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Technical Correctness</span>
                <span className="font-mono text-purple-400 font-bold">
                  {Math.round(rubric.technical_weight * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(rubric.technical_weight * 100)}
                onChange={(e) =>
                  setRubric({ ...rubric, technical_weight: parseInt(e.target.value) / 100 })
                }
                className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Relevance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Relevance to Question</span>
                <span className="font-mono text-purple-400 font-bold">
                  {Math.round(rubric.relevance_weight * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(rubric.relevance_weight * 100)}
                onChange={(e) =>
                  setRubric({ ...rubric, relevance_weight: parseInt(e.target.value) / 100 })
                }
                className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Depth */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Depth of Understanding</span>
                <span className="font-mono text-purple-400 font-bold">
                  {Math.round(rubric.depth_weight * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(rubric.depth_weight * 100)}
                onChange={(e) =>
                  setRubric({ ...rubric, depth_weight: parseInt(e.target.value) / 100 })
                }
                className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Problem Solving */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Problem Solving & Design</span>
                <span className="font-mono text-purple-400 font-bold">
                  {Math.round(rubric.problem_solving_weight * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(rubric.problem_solving_weight * 100)}
                onChange={(e) =>
                  setRubric({ ...rubric, problem_solving_weight: parseInt(e.target.value) / 100 })
                }
                className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Clarity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Clarity of Explanation</span>
                <span className="font-mono text-purple-400 font-bold">
                  {Math.round(rubric.clarity_weight * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(rubric.clarity_weight * 100)}
                onChange={(e) =>
                  setRubric({ ...rubric, clarity_weight: parseInt(e.target.value) / 100 })
                }
                className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveRubric}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Rubric Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content 3: Audit Trail Log */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Evaluation Audit Log</h3>
            <p className="text-xs text-slate-400">
              Immutable log of all human reviewer score adjustments and rubric modifications.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No audit records logged yet.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Session ID</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/40">
                      <td className="py-3 px-4 font-mono text-purple-300 font-semibold">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-mono">{log.session_id ? `#${log.session_id}` : 'Global'}</td>
                      <td className="py-3 px-4">User #{log.performed_by_id}</td>
                      <td className="py-3 px-4 italic text-slate-400">{log.reason || 'None provided'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Human Reviewer Override Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Human Reviewer Override</h3>
                  <p className="text-xs text-slate-400">
                    Candidate: {selectedCandidate.candidate_name} ({selectedCandidate.job_role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {overrideError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {overrideError}
              </div>
            )}
            {overrideMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
                {overrideMsg}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Adjusted Composite Score (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Override Decision Recommendation
                </label>
                <select
                  value={overrideRec}
                  onChange={(e) => setOverrideRec(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Strong Match">Strong Match</option>
                  <option value="Potential Match">Potential Match</option>
                  <option value="Further Assessment Recommended">Further Assessment Recommended</option>
                  <option value="Does Not Yet Meet Defined Criteria">Does Not Yet Meet Defined Criteria</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Mandatory Recruiter Review Justification Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={recruiterNotes}
                  onChange={(e) => setRecruiterNotes(e.target.value)}
                  placeholder="Detail the human assessment rationale (e.g. validated code sample on GitHub, specific system architecture nuance demonstrated)..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-xs px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverride}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
              >
                Confirm & Log Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
