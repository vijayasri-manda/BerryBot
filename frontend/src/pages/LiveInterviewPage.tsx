import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Mic, MicOff, Volume2, VolumeX, Play, Pause, Square, SkipForward, Send,
  RefreshCw, CheckCircle2, AlertCircle, HelpCircle, Globe, Clock, Sparkles, MessageSquare
} from 'lucide-react';
import { InterviewAvatar } from '../components/avatar/InterviewAvatar';
import { AudioVisualizer } from '../components/avatar/AudioVisualizer';
import { speechService } from '../services/speech';
import { api } from '../services/api';
import { InterviewSession, QuestionOut, AvatarMood } from '../types';

interface LiveInterviewPageProps {
  sessionId: number;
  onNavigate: (tab: string, sessionId?: number) => void;
}

export const LiveInterviewPage: React.FC<LiveInterviewPageProps> = ({ sessionId, onNavigate }) => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionOut | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  
  // Audio & State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [avatarMood, setAvatarMood] = useState<AvatarMood>('greeting');
  
  // Timer countdown
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60);

  // Input mode tab: 'voice' | 'text'
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [subtitles, setSubtitles] = useState('');
  const [showEnglishRef, setShowEnglishRef] = useState(false);

  // Evaluation Feedback Drawer/Modal
  const [evaluating, setEvaluating] = useState(false);
  const [latestEval, setLatestEval] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Initial Load of Session
  useEffect(() => {
    async function loadSession() {
      try {
        const data = await api.getInterview(sessionId);
        setSession(data);
        setTimeLeftSeconds(data.duration_minutes * 60);

        if (data.status === 'configured') {
          await api.startInterview(sessionId);
        }

        const currQ = data.questions[data.current_question_index] || data.questions[0];
        setCurrentQuestion(currQ);

        // Greet and speak question
        setTimeout(() => {
          speakQuestion(currQ, data.language);
        }, 600);
      } catch (err: any) {
        setErrorMsg('Failed to load interview session');
      }
    }
    loadSession();

    return () => {
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, [sessionId]);

  // 2. Timer Countdown
  useEffect(() => {
    if (isPaused || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, timeLeftSeconds]);

  // Helper to Speak Avatar Question
  const speakQuestion = (q: QuestionOut, lang: string) => {
    if (!q || isMuted) return;

    setIsSpeaking(true);
    setAvatarMood('speaking');
    setSubtitles(q.question_text);

    speechService.speak(q.question_text, lang, {
      onStart: () => {
        setIsSpeaking(true);
        setAvatarMood('speaking');
      },
      onEnd: () => {
        setIsSpeaking(false);
        setAvatarMood('listening');
        // Once question finishes speaking, auto-start microphone if in voice mode
        if (inputMode === 'voice') {
          startVoiceRecognition(lang);
        }
      },
      onError: () => {
        setIsSpeaking(false);
        setAvatarMood('listening');
      },
    });
  };

  // Replay Question
  const handleReplayQuestion = () => {
    if (currentQuestion && session) {
      speechService.stopListening();
      setIsListening(false);
      speakQuestion(currentQuestion, session.language);
    }
  };

  // Start Mic Voice Recognition
  const startVoiceRecognition = (lang: string) => {
    if (isListening) return;
    setErrorMsg('');
    setIsListening(true);
    setAvatarMood('listening');

    speechService.startListening(lang, {
      onResult: (transcript, isFinal) => {
        setCandidateAnswer(transcript);
      },
      onError: (err) => {
        setIsListening(false);
        setAvatarMood('neutral');
        // Do not block candidate: show helpful guidance and enable text mode
        setErrorMsg(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  // Toggle Microphone
  const toggleListening = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setAvatarMood('neutral');
    } else if (session) {
      startVoiceRecognition(session.language);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim() || !session || !currentQuestion) return;

    speechService.stopListening();
    speechService.stopSpeaking();
    setIsListening(false);
    setIsSpeaking(false);
    setEvaluating(true);
    setAvatarMood('thinking');
    setErrorMsg('');

    try {
      const evalResult = await api.submitAnswer(session.id, {
        answer_text: candidateAnswer,
        input_type: inputMode,
        audio_duration_seconds: 30.0,
      });

      setLatestEval(evalResult);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evaluation error');
    } finally {
      setEvaluating(false);
    }
  };

  // Advance to Next Question
  const handleProceedNextQuestion = async () => {
    if (!session) return;
    setLatestEval(null);
    setCandidateAnswer('');
    setErrorMsg('');
    setEvaluating(true);

    try {
      const resp = await api.nextQuestion(session.id);
      if (resp.is_completed) {
        onNavigate('results', session.id);
      } else if (resp.next_question) {
        setCurrentQuestion(resp.next_question);
        setSession({
          ...session,
          current_question_index: resp.current_question_index,
        });

        // Speak the new question
        setTimeout(() => {
          speakQuestion(resp.next_question!, session.language);
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg('Failed to fetch next question');
    } finally {
      setEvaluating(false);
    }
  };

  // Pause / Resume
  const togglePause = async () => {
    if (!session) return;
    if (isPaused) {
      await api.resumeInterview(session.id);
      setIsPaused(false);
      if (currentQuestion) speakQuestion(currentQuestion, session.language);
    } else {
      await api.pauseInterview(session.id);
      speechService.stopSpeaking();
      speechService.stopListening();
      setIsSpeaking(false);
      setIsListening(false);
      setIsPaused(true);
      setAvatarMood('neutral');
    }
  };

  // Conclude Early
  const handleEndEarly = async () => {
    if (!session) return;
    if (window.confirm('Are you sure you want to conclude the interview now? Your answered questions will be evaluated.')) {
      speechService.stopSpeaking();
      speechService.stopListening();
      await api.endInterview(session.id);
      onNavigate('results', session.id);
    }
  };

  // Format Time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[90vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Session Progress Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg">
        {/* Left: Role & Category */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            {session?.job_role || 'Live Interview'}
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Lang: {session?.language.toUpperCase()}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">•</span>
          <span className="text-xs text-slate-400 font-medium">
            Level: {session?.experience_level}
          </span>
        </div>

        {/* Center: Question Progress */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-200">
            Question {(session?.current_question_index ?? 0) + 1} of {session?.total_questions ?? 5}
          </span>
          <div className="w-24 sm:w-36 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
              style={{
                width: `${
                  (((session?.current_question_index ?? 0) + 1) /
                    (session?.total_questions ?? 5)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Right: Timer & Global Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={togglePause}
            title={isPaused ? 'Resume Interview' : 'Pause Interview'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={handleEndEarly}
            title="End Interview & See Report"
            className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-rose-300" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Dual-Stage Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stage: Animated Avatar & Speech Waveform */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          <div className="w-full rounded-3xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col items-center backdrop-blur-md shadow-2xl relative">
            <InterviewAvatar
              mood={avatarMood}
              isSpeaking={isSpeaking}
              isListening={isListening}
              subtitles={subtitles}
              interviewerName="Berri Bot • Lead AI Interviewer"
            />

            {/* Audio Waveform Visualizer */}
            <div className="w-full mt-4 flex flex-col items-center gap-2">
              <AudioVisualizer
                isActive={isSpeaking || isListening}
                type={isSpeaking ? 'avatar' : 'user'}
                barCount={20}
              />
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                {isSpeaking
                  ? 'AI Speech Synthesis Active'
                  : isListening
                  ? 'Listening to Microphone'
                  : 'Voice Audio Ready'}
              </span>
            </div>

            {/* Avatar Voice Controls */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800/80 w-full justify-center">
              <button
                onClick={handleReplayQuestion}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Replay Question</span>
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                  isMuted
                    ? 'bg-rose-950/40 border-rose-600/40 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Muted' : 'Mute'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Stage: Current Question, Input, and Real-time Evaluation */}
        <div className="lg:col-span-7 space-y-4">
          {/* Question Card */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/40 text-xs font-semibold">
                  {currentQuestion?.category || 'Technical Assessment'}
                </span>
                {currentQuestion?.is_follow_up && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/40 text-[10px] font-mono">
                    Dynamic Follow-up
                  </span>
                )}
              </div>

              {session?.language !== 'en' && (
                <button
                  onClick={() => setShowEnglishRef(!showEnglishRef)}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{showEnglishRef ? 'Show Native Script' : 'Show English Reference'}</span>
                </button>
              )}
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {showEnglishRef && currentQuestion?.question_text_en
                ? currentQuestion.question_text_en
                : currentQuestion?.question_text || 'Preparing question...'}
            </h3>

            {/* Input Selection Tabs */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode('voice')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    inputMode === 'voice'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice Answer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    inputMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Type Answer</span>
                </button>
              </div>

              {inputMode === 'voice' && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`text-xs px-3.5 py-1.5 rounded-xl border font-semibold flex items-center gap-2 transition-all ${
                    isListening
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Recording... (Click to Pause)</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Start Speaking</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Answer Textarea (Editable live transcript or typed answer) */}
            <div className="space-y-2">
              <textarea
                rows={5}
                value={candidateAnswer}
                onChange={(e) => setCandidateAnswer(e.target.value)}
                placeholder={
                  inputMode === 'voice'
                    ? 'Your spoken answer will appear here in real time. You can edit or refine text before submitting...'
                    : 'Type your comprehensive technical answer here...'
                }
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{candidateAnswer.split(/\s+/).filter(Boolean).length} words</span>
                <span className="italic">Semantic meaning is evaluated, not accent or grammar</span>
              </div>
            </div>

            {/* Answer Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCandidateAnswer('')}
                disabled={evaluating || !candidateAnswer}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
              >
                Clear Answer
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleProceedNextQuestion}
                  disabled={evaluating}
                  className="text-xs px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <span>Skip Question</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={evaluating || !candidateAnswer.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {evaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Evaluating Answer...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time AI Evaluation Card (Shows immediately after submitting) */}
          {latestEval && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-slate-900/90 border border-blue-500/50 shadow-2xl space-y-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">AI Rubric Evaluation</h4>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-blue-400">
                    {latestEval.score_overall}%
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">Weighted</span>
                </div>
              </div>

              {/* Rubric Breakdown Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Technical (30%)</p>
                  <p className="text-xs font-bold text-white">{latestEval.score_technical}%</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Relevance (20%)</p>
                  <p className="text-xs font-bold text-white">{latestEval.score_relevance}%</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Depth (20%)</p>
                  <p className="text-xs font-bold text-white">{latestEval.score_depth}%</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Problem Solv (20%)</p>
                  <p className="text-xs font-bold text-white">{latestEval.score_problem_solving}%</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Clarity (10%)</p>
                  <p className="text-xs font-bold text-white">{latestEval.score_clarity}%</p>
                </div>
              </div>

              {/* Feedback Justification */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <p className="font-semibold text-slate-200">Justification:</p>
                <p className="italic text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  "{latestEval.feedback_justification}"
                </p>
              </div>

              {/* Strengths & Missing Concepts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Strengths</span>
                  </span>
                  <p className="text-[11px] text-slate-300">{latestEval.strengths}</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Missing Concepts</span>
                  </span>
                  <p className="text-[11px] text-slate-300">{latestEval.missing_concepts}</p>
                </div>
              </div>

              {/* Advance Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleProceedNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
                >
                  <span>
                    {(session?.current_question_index ?? 0) + 1 >= (session?.total_questions ?? 5)
                      ? 'Complete & View Final Report'
                      : 'Continue to Next Question'}
                  </span>
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
