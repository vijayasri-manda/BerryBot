import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AvatarMood } from '../../types';
import { Mic, Volume2, Sparkles, BrainCircuit } from 'lucide-react';

interface InterviewAvatarProps {
  mood: AvatarMood;
  isSpeaking: boolean;
  isListening: boolean;
  subtitles?: string;
  interviewerName?: string;
}

export const InterviewAvatar: React.FC<InterviewAvatarProps> = ({
  mood,
  isSpeaking,
  isListening,
  subtitles,
  interviewerName = "Berri Bot (AI Senior Interviewer)",
}) => {
  // Blinking state
  const [isBlinking, setIsBlinking] = useState(false);
  // Mouth opening stage for lip sync (0: closed, 1: mid, 2: wide)
  const [mouthStage, setMouthStage] = useState(0);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Lip sync animation when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthStage(0);
      return;
    }

    const mouthInterval = setInterval(() => {
      // Cycle through natural phoneme mouth openings
      setMouthStage(Math.floor(Math.random() * 4));
    }, 110);

    return () => clearInterval(mouthInterval);
  }, [isSpeaking]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 select-none">
      {/* Outer Glow Halo */}
      <div
        className={`absolute inset-0 rounded-3xl filter blur-2xl transition-opacity duration-700 pointer-events-none ${
          isSpeaking
            ? 'bg-blue-600/30 opacity-80'
            : isListening
            ? 'bg-emerald-500/25 opacity-70'
            : mood === 'thinking'
            ? 'bg-purple-600/25 opacity-70'
            : 'bg-indigo-600/15 opacity-40'
        }`}
      />

      {/* Main Avatar Container */}
      <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col items-center justify-center backdrop-blur-md">
        {/* Subtle Tech Grid / Ambient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

        {/* Head Motion Wrapper */}
        <motion.div
          animate={
            isListening
              ? { rotate: [0, 2.5, 0], y: [0, 2, 0] }
              : isSpeaking
              ? { y: [0, -2, 0, -1, 0], rotate: [0, -1, 0, 1, 0] }
              : mood === 'thinking'
              ? { rotate: [0, -3, 0], y: [0, -3, 0] }
              : { y: [0, -1.5, 0] }
          }
          transition={{ repeat: Infinity, duration: isSpeaking ? 1.4 : 4, ease: "easeInOut" }}
          className="relative flex flex-col items-center"
        >
          {/* Head & Face SVG */}
          <svg
            viewBox="0 0 200 220"
            className="w-48 h-48 drop-shadow-lg"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Professional Hair Layer */}
            <path
              d="M50 85 C45 35, 155 35, 150 85 C165 105, 160 145, 155 155 C145 130, 140 100, 135 90 C100 65, 65 80, 50 85 Z"
              fill="#1E293B"
            />

            {/* Neck */}
            <rect x="85" y="145" width="30" height="30" rx="6" fill="#FBCFE8" opacity="0.9" />

            {/* Suit Collar & Tie */}
            <path d="M60 170 L85 145 L115 145 L140 170 L145 220 L55 220 Z" fill="#0F172A" />
            <path d="M85 145 L100 170 L115 145 L100 150 Z" fill="#F8FAFC" />
            <path d="M96 150 L104 150 L107 195 L100 205 L93 195 Z" fill="#2563EB" />
            <polygon points="90,145 100,165 85,165" fill="#3B82F6" />
            <polygon points="110,145 100,165 115,165" fill="#3B82F6" />

            {/* Face Shape */}
            <rect
              x="60"
              y="60"
              width="80"
              height="95"
              rx="40"
              fill="#FDE8E8"
              stroke="#FBCFE8"
              strokeWidth="2"
            />

            {/* Headset Band */}
            <path
              d="M56 85 C52 40, 148 40, 144 85"
              stroke="#64748B"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Headset Earcups */}
            <rect x="49" y="80" width="10" height="26" rx="4" fill="#334155" />
            <rect x="141" y="80" width="10" height="26" rx="4" fill="#334155" />

            {/* Headset Mic Boom & Tip */}
            <path
              d="M52 95 Q48 135, 76 138"
              stroke="#64748B"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Mic Glow tip (Cyan when listening/active) */}
            <circle
              cx="77"
              cy="138"
              r="4.5"
              fill={isListening ? "#10B981" : isSpeaking ? "#3B82F6" : "#64748B"}
              className={isListening || isSpeaking ? "animate-pulse" : ""}
            />

            {/* Eyebrows */}
            <motion.path
              d={
                mood === 'thinking'
                  ? "M70 82 Q80 78, 90 84"
                  : isListening
                  ? "M70 80 Q80 77, 90 80"
                  : "M70 82 Q80 80, 90 82"
              }
              stroke="#334155"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <motion.path
              d={
                mood === 'thinking'
                  ? "M110 84 Q120 78, 130 82"
                  : isListening
                  ? "M110 80 Q120 77, 130 80"
                  : "M110 82 Q120 80, 130 82"
              }
              stroke="#334155"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Left Eye */}
            {isBlinking ? (
              <line x1="72" y1="94" x2="88" y2="94" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <g>
                <ellipse cx="80" cy="94" rx="8" ry="7" fill="#FFFFFF" />
                <motion.circle
                  cx={mood === 'thinking' ? "82" : isListening ? "80" : "80"}
                  cy={mood === 'thinking' ? "91" : "94"}
                  r="4"
                  fill="#1E3A8A"
                />
                <circle cx="78.5" cy="92.5" r="1.5" fill="#FFFFFF" />
              </g>
            )}

            {/* Right Eye */}
            {isBlinking ? (
              <line x1="112" y1="94" x2="128" y2="94" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <g>
                <ellipse cx="120" cy="94" rx="8" ry="7" fill="#FFFFFF" />
                <motion.circle
                  cx={mood === 'thinking' ? "122" : isListening ? "120" : "120"}
                  cy={mood === 'thinking' ? "91" : "94"}
                  r="4"
                  fill="#1E3A8A"
                />
                <circle cx="118.5" cy="92.5" r="1.5" fill="#FFFFFF" />
              </g>
            )}

            {/* Nose */}
            <path d="M98 102 L101 112 L96 114" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />

            {/* Cheeks / Warmth */}
            <circle cx="71" cy="112" r="4.5" fill="#FB7185" opacity="0.35" />
            <circle cx="129" cy="112" r="4.5" fill="#FB7185" opacity="0.35" />

            {/* Dynamic Mouth (Phoneme & Emotion aware) */}
            {isSpeaking ? (
              mouthStage === 1 ? (
                // Mid open
                <ellipse cx="100" cy="128" rx="8" ry="5" fill="#881337" />
              ) : mouthStage === 2 ? (
                // Wide open (vowel sound)
                <ellipse cx="100" cy="129" rx="10" ry="8" fill="#881337" />
              ) : mouthStage === 3 ? (
                // Round 'O'
                <circle cx="100" cy="128" r="6" fill="#881337" />
              ) : (
                // Closed speech smile
                <path d="M91 127 Q100 133, 109 127" stroke="#9F1239" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              )
            ) : isListening ? (
              // Attentive receptive mouth
              <path d="M92 128 Q100 133, 108 128" stroke="#9F1239" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            ) : mood === 'thinking' ? (
              // Pensive neutral mouth
              <path d="M93 129 L107 127" stroke="#9F1239" strokeWidth="2" strokeLinecap="round" fill="none" />
            ) : (
              // Friendly calm smile
              <path d="M91 126 Q100 133, 109 126" stroke="#9F1239" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}
          </svg>
        </motion.div>

        {/* Live Status Badge */}
        <div className="absolute bottom-3 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-medium text-slate-300 backdrop-blur-md shadow-lg">
          {isSpeaking ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="text-blue-300">Berri Bot is speaking...</span>
            </>
          ) : isListening ? (
            <>
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span className="text-emerald-300">Listening to your response...</span>
            </>
          ) : mood === 'thinking' ? (
            <>
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span className="text-purple-300">Evaluating response...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Interviewer Identity Tag */}
      <div className="mt-3 text-center">
        <h4 className="text-sm font-semibold text-slate-200">{interviewerName}</h4>
        <p className="text-xs text-slate-400">Adaptive Multilingual Interview Orchestrator</p>
      </div>

      {/* Live Captions Subtitle Box */}
      {subtitles && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 w-full max-w-sm px-4 py-2 rounded-xl bg-slate-900/90 border border-blue-500/30 text-center shadow-lg backdrop-blur-md"
        >
          <p className="text-xs text-slate-400 font-mono tracking-wider uppercase mb-0.5">Live Captions</p>
          <p className="text-xs sm:text-sm text-slate-200 italic leading-snug line-clamp-3">
            "{subtitles}"
          </p>
        </motion.div>
      )}
    </div>
  );
};
