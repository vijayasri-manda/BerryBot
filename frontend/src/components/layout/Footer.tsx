import React from 'react';
import { ShieldCheck, Cpu, Heart, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950/90 text-slate-400 text-xs py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Column: Mission & Compliance */}
        <div className="space-y-1 text-center md:text-left max-w-xl">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-slate-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ethical, Explainable & Unbiased AI Hiring Platform</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Inspired by HCL Berri Bot. AI evaluations serve as transparent decision-support recommendations.
            Candidates are scored solely on practical competency and conceptual depth without dialect, regional accent, or grammatical penalty.
          </p>
        </div>

        {/* Right Column: Capabilities */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Multilingual Speech & Audio</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Dynamic Resume Rooting</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
