import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Edit3, Trash2, Code, Briefcase, GraduationCap, Award } from 'lucide-react';
import { api } from '../services/api';
import { ResumeOut, ParsedResumeData } from '../types';

interface ResumeUploadPageProps {
  onNavigate: (tab: string, sessionId?: number, resumeId?: number) => void;
  selectedResumeId?: number;
}

export const ResumeUploadPage: React.FC<ResumeUploadPageProps> = ({ onNavigate, selectedResumeId }) => {
  const [resume, setResume] = useState<ResumeOut | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');

  useEffect(() => {
    // If a resume ID was passed or try to load latest
    async function fetchInitial() {
      try {
        if (selectedResumeId) {
          const data = await api.getResume(selectedResumeId);
          setResume(data);
          setEditedSummary(data.summary || '');
        } else {
          // Default load sample fullstack to provide an instant rich preview
          const data = await api.loadSampleResume('fullstack');
          setResume(data);
          setEditedSummary(data.summary || '');
        }
      } catch (e) {
        // Ignore if none
      }
    }
    fetchInitial();
  }, [selectedResumeId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');
    setIsUploading(true);

    try {
      const data = await api.uploadResume(file);
      setResume(data);
      setEditedSummary(data.summary || '');
      setSuccessMsg(`Successfully extracted and parsed ${file.name}`);
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = async (key: string) => {
    setError('');
    setSuccessMsg('');
    setIsUploading(true);
    try {
      const data = await api.loadSampleResume(key);
      setResume(data);
      setEditedSummary(data.summary || '');
      setSuccessMsg(`Loaded sample ${key} developer profile`);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!resume) return;
    try {
      const updated = await api.updateResume(resume.id, { summary: editedSummary });
      setResume(updated);
      setIsEditing(false);
      setSuccessMsg('Summary updated successfully');
    } catch (err: any) {
      setError('Failed to update summary');
    }
  };

  const handleProceedToInterview = () => {
    if (resume) {
      onNavigate('config', undefined, resume.id);
    } else {
      onNavigate('config');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Intelligent Resume Parser</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Upload your resume to generate dynamic, grounded interview questions tailored strictly to your actual projects.
          </p>
        </div>

        {resume && (
          <button
            onClick={handleProceedToInterview}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <span>Proceed to Interview Config</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Zone & Sample Pickers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Dropzone */}
        <div className="lg:col-span-7">
          <label className="relative flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/60 border-2 border-dashed border-slate-700 hover:border-blue-500/60 cursor-pointer transition-all group backdrop-blur-sm">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="sr-only"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {isUploading ? 'Extracting and structuring resume content...' : 'Upload your Resume'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF or DOCX documents up to 10MB</p>
            <span className="mt-3 text-[11px] px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Select file from computer
            </span>
          </label>
        </div>

        {/* Quick Sample Selector */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Test Resumes</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Don't have a resume handy? Click to load a verified technical profile with real-world projects and skills:
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleLoadSample('fullstack')}
              className="w-full text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-200">Full Stack: Priya Sharma</p>
                <p className="text-[10px] text-slate-400">React, Node.js, TypeScript, PostgreSQL</p>
              </div>
              <span className="text-[10px] text-blue-400 font-medium">Load</span>
            </button>

            <button
              onClick={() => handleLoadSample('aiml')}
              className="w-full text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-200">AI/ML: Rahul Varma</p>
                <p className="text-[10px] text-slate-400">Python, PyTorch, Transformers, FastAPI</p>
              </div>
              <span className="text-[10px] text-teal-400 font-medium">Load</span>
            </button>

            <button
              onClick={() => handleLoadSample('javadeveloper')}
              className="w-full text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-200">Java: Ananya Reddy</p>
                <p className="text-[10px] text-slate-400">Java 17, Spring Boot, Kafka, MySQL</p>
              </div>
              <span className="text-[10px] text-indigo-400 font-medium">Load</span>
            </button>
          </div>
        </div>
      </div>

      {/* Structured Resume Inspection & Review */}
      {resume && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Extracted Candidate Information</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  Parsed & Verified
                </span>
              </h2>
              <p className="text-xs text-slate-400">Review structured attributes prior to interview generation</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Summary'}</span>
            </button>
          </div>

          {/* Profile Overview Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">{resume.candidate_name || 'Candidate Name'}</h3>
                <p className="text-xs text-slate-400">
                  {resume.candidate_email} • {resume.candidate_phone}
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">{resume.filename}</span>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-blue-500 text-xs text-slate-200 focus:outline-none"
                />
                <button
                  onClick={handleSaveSummary}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
                >
                  Save Summary
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                "{resume.summary || 'Summary not provided'}"
              </p>
            )}
          </div>

          {/* Categorized Skills Grid */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Code className="w-4 h-4 text-blue-400" />
              <span>Technical Skills Inventory</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Languages */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400">Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {resume.parsed_data.skills.languages?.map((s, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-300 border border-blue-800/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Frameworks */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400">Frameworks & Libraries</p>
                <div className="flex flex-wrap gap-1.5">
                  {resume.parsed_data.skills.frameworks?.map((s, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-teal-950/60 text-teal-300 border border-teal-800/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Databases */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400">Databases & Caching</p>
                <div className="flex flex-wrap gap-1.5">
                  {resume.parsed_data.skills.databases?.map((s, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400">DevOps & Cloud Tools</p>
                <div className="flex flex-wrap gap-1.5">
                  {resume.parsed_data.skills.tools_and_platforms?.map((s, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Projects */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Projects to be Evaluated</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resume.parsed_data.projects?.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies?.map((t, ti) => (
                      <span key={ti} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-300">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Planned Topics to Explore */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Interview Question Blueprint</span>
            </h3>
            <p className="text-xs text-slate-400">
              The AI interviewer will ask targeted questions based on the following topics:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {resume.parsed_data.topics_to_explore?.map((top, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{top}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
