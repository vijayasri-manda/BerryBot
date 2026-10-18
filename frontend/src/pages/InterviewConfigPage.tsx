import React, { useEffect, useState } from 'react';
import { Play, Settings, Clock, Layers, Sparkles, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { AudioConsentModal } from '../components/interview/AudioConsentModal';
import { api } from '../services/api';

interface InterviewConfigPageProps {
  onNavigate: (tab: string, sessionId?: number, resumeId?: number) => void;
  selectedResumeId?: number;
}

const PRESET_ROLES = [
  'Full Stack Developer',
  'Software Development Engineer',
  'Java Developer',
  'Python Developer',
  'AI/ML Engineer',
  'Data Analyst',
  'Graduate Engineer Trainee',
];

export const InterviewConfigPage: React.FC<InterviewConfigPageProps> = ({
  onNavigate,
  selectedResumeId,
}) => {
  const [jobRole, setJobRole] = useState('Full Stack Developer');
  const [customRole, setCustomRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [interviewType, setInterviewType] = useState('Mixed');
  const [language, setLanguage] = useState('en');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getInterviewPolicy()
      .then(policy => { if (active) setTotalQuestions(policy.question_count); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const finalJobRole = jobRole === 'Custom' ? customRole || 'Software Engineer' : jobRole;

  const handleStartClicked = () => {
    setShowConsentModal(true);
  };

  const handleConsentConfirmed = async () => {
    setShowConsentModal(false);
    setIsSubmitting(true);
    setError('');

    try {
      const session = await api.createInterview({
        job_role: finalJobRole,
        experience_level: experienceLevel,
        interview_type: interviewType,
        language,
        duration_minutes: durationMinutes,
        resume_id: selectedResumeId,
        job_description: jobDescription || undefined,
      });

      // Navigate to live interview room with created session ID
      onNavigate('live', session.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create interview session');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Configure Interview Session</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Personalize your interview role, language, difficulty, and duration before meeting Berri Bot.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6 shadow-xl backdrop-blur-md">
        {/* Job Role Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            1. Select Target Job Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setJobRole(r)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-left transition-all ${
                  jobRole === r
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setJobRole('Custom')}
              className={`py-2 px-3 rounded-xl border text-xs font-medium text-left transition-all ${
                jobRole === 'Custom'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                  : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              + Custom Role...
            </button>
          </div>

          {jobRole === 'Custom' && (
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g. Cloud Security Architect, DevOps Lead..."
              className="w-full mt-2 p-2.5 rounded-xl bg-slate-950 border border-blue-500/60 text-xs text-white focus:outline-none"
            />
          )}
        </div>

        {/* Experience Level & Interview Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          {/* Experience Level */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              2. Candidate Experience Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Fresher', 'Intermediate', 'Experienced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setExperienceLevel(lvl)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                    experienceLevel === lvl
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              {experienceLevel === 'Fresher'
                ? 'Focus on fundamentals, core OOP, and college projects.'
                : experienceLevel === 'Intermediate'
                ? 'Evaluates design patterns, database indexing, and API concurrency.'
                : 'Deep dive into distributed systems, scale, and architectural trade-offs.'}
            </p>
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              3. Interview Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Technical', 'HR', 'Behavioral', 'Mixed'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInterviewType(t)}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium text-center transition-all ${
                    interviewType === t
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              {interviewType === 'Mixed'
                ? 'Balanced blend of project deep dives, technical knowledge, and situational HR questions.'
                : `Focuses strictly on ${interviewType} assessment criteria.`}
            </p>
          </div>
        </div>

        {/* Multilingual Selector */}
        <div className="pt-4 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 block">
            4. Interview Language
          </label>
          <LanguageSelector
            selectedLanguage={language}
            onSelectLanguage={(l) => setLanguage(l)}
          />
          <p className="text-[11px] text-slate-500 mt-2">
            Berri Bot speaks and listens in your chosen language. Technical programming terms and framework names are preserved for natural fluency.
          </p>
        </div>

        {/* Duration & Question Count Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider">
              <span>5. Duration</span>
              <span className="text-blue-400 font-mono">{durationMinutes} Minutes</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[10, 20, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                    durationMinutes === m
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950/60 border-slate-700/80 text-slate-400'
                  }`}
                >
                  {m} Min
                </button>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider">
              <span>6. Interview Questions</span>
              <span className="text-blue-400 font-mono">{totalQuestions === null ? 'Loading...' : `${totalQuestions} Questions`}</span>
            </div>
            <p className="text-xs text-slate-400">Set by HR. The latest HR question count applies when you start your interview.</p>
          </div>
        </div>

        {/* Optional Job Description */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>7. Optional Job Description (For Job-Specific Alignment)</span>
          </label>
          <textarea
            rows={3}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job description or requirements here to customize the interview questions and measure resume-to-job match..."
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Launch Button */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>Audio & Mic verified before launch</span>
          </div>
          <button
            onClick={handleStartClicked}
            disabled={isSubmitting || totalQuestions === null}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isSubmitting ? 'Initializing Interview Room...' : 'Enter Live AI Interview'}</span>
          </button>
        </div>
      </div>

      {/* Audio Consent Modal */}
      {showConsentModal && (
        <AudioConsentModal
          language={language}
          onConsentGiven={handleConsentConfirmed}
          onCancel={() => setShowConsentModal(false)}
        />
      )}
    </div>
  );
};
