import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  disabled?: boolean;
}

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <Globe className="w-3.5 h-3.5 text-blue-400" />
        <span>Interview Language</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              disabled={disabled}
              onClick={() => onSelectLanguage(lang.code)}
              className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-xs font-medium">{lang.label}</span>
              <span className="text-[11px] font-sans font-normal opacity-80 mt-0.5">{lang.native}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
