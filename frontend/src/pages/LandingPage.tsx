import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Mic, FileText, CheckCircle2, Globe2, ShieldCheck, Sparkles, Award, ArrowRight, Play, BarChart3 } from 'lucide-react';
import { InterviewAvatar } from '../components/avatar/InterviewAvatar';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user, loginAsDemo } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      onNavigate('dashboard');
    } else {
      loginAsDemo('candidate').then(() => onNavigate('dashboard'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Call-To-Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Pill Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/40 text-blue-300 text-xs font-medium backdrop-blur-md shadow-inner"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Inspired by HCL Berri Bot • Next-Gen AI Talent Assessment</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]"
              >
                Master Your Tech Interviews with an{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                  Intelligent Multilingual AI Avatar
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light"
              >
                Experience realistic, interactive voice interviews in <b className="text-white">English, Telugu, Hindi, Tamil, and Kannada</b>. Questions dynamically rooted in your uploaded resume, evaluated using a transparent 5-point explainable rubric.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <button
                  onClick={handleGetStarted}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-blue-600/30 flex items-center gap-2 group transition-all transform hover:-translate-y-0.5"
                >
                  <span>Start Practice Interview</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => loginAsDemo('recruiter').then(() => onNavigate('recruiter'))}
                  className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold flex items-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Recruiter Portal</span>
                </button>
              </motion.div>

              {/* Quick Trust Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-left max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl font-bold text-blue-400">5</p>
                  <p className="text-xs text-slate-400">Languages Supported</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-400">100%</p>
                  <p className="text-xs text-slate-400">Resume-Rooted Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">5-Point</p>
                  <p className="text-xs text-slate-400">Transparent Rubric</p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Animated Avatar Showcase */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl relative">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Interactive Avatar</span>
                </div>

                <InterviewAvatar
                  mood="greeting"
                  isSpeaking={false}
                  isListening={false}
                  subtitles="Hello Priya! I've analyzed your resume and will be conducting your technical interview today."
                />

                <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    Speech synthesis, audio visualizers, and phoneme-level lip syncing in 5 languages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs uppercase font-mono tracking-widest text-blue-400 mb-2">Core Architecture</h2>
            <p className="text-3xl font-bold tracking-tight">Built for Realistic, Enterprise-Grade Assessment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Intelligent Resume Parsing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracts projects, skills, education, and work history from PDF and DOCX documents. Questions are generated from your actual contributions—never hallucinated.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Multilingual Voice Dialogue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless real-time speech interaction in English, Telugu, Hindi, Tamil, and Kannada. Evaluates semantic meaning without penalizing accents or minor grammar.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Explainable 5-Point Rubric</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Weighted scoring across Technical Correctness (30%), Relevance (20%), Depth (20%), Problem-Solving (20%), and Clarity (10%) with audit trail and human recruiter override.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-teal-400 mb-2">Step-by-Step Flow</h2>
          <p className="text-3xl font-bold tracking-tight">How an AI Interview Unfolds</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Upload Resume',
              desc: 'Upload your PDF or DOCX file or load one of our pre-configured developer resumes.',
            },
            {
              step: '02',
              title: 'Configure Role & Language',
              desc: 'Select job role, experience tier, and interview language (English, Telugu, Hindi, Tamil, Kannada).',
            },
            {
              step: '03',
              title: 'Live Voice Interview',
              desc: 'Speak with Berri Bot with animated lip-sync, live captions, audio waveforms, and dynamic follow-ups.',
            },
            {
              step: '04',
              title: 'Detailed Performance Audit',
              desc: 'Receive comprehensive score charts, topic strengths, knowledge gaps, and downloadable PDF report.',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2 relative">
              <span className="text-3xl font-extrabold font-mono text-blue-500/40">{item.step}</span>
              <h4 className="text-base font-bold text-slate-200">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-950/60 to-slate-900/80 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">Ready to test your technical competency?</h3>
            <p className="text-xs text-slate-300 mt-1">
              Start an interview immediately with our pre-loaded candidate profiles or upload your own resume.
            </p>
          </div>
          <button
            onClick={handleGetStarted}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 whitespace-nowrap"
          >
            Launch Interview Now
          </button>
        </div>
      </section>
    </div>
  );
};
