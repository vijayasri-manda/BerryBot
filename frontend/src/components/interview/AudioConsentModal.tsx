import React, { useState } from 'react';
import { Mic, Volume2, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { speechService } from '../../services/speech';

interface AudioConsentModalProps {
  language: string;
  onConsentGiven: () => void;
  onCancel: () => void;
}

export const AudioConsentModal: React.FC<AudioConsentModalProps> = ({
  language,
  onConsentGiven,
  onCancel,
}) => {
  const [micTested, setMicTested] = useState(false);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [isListeningTest, setIsListeningTest] = useState(false);
  const [heardText, setHeardText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const testSpeaker = () => {
    setSpeakerTested(true);
    speechService.speak(
      "Audio check: Welcome to Berri Bot. Can you hear me clearly?",
      language
    );
  };

  const testMicrophone = () => {
    setErrorMessage('');
    setIsListeningTest(true);
    setHeardText('Listening... please say "Hello Berri Bot"');

    const started = speechService.startListening(language, {
      onResult: (text) => {
        setHeardText(`Heard: "${text}"`);
        setMicTested(true);
        setIsListeningTest(false);
        speechService.stopListening();
      },
      onError: (err) => {
        setErrorMessage(err);
        setIsListeningTest(false);
      },
      onEnd: () => {
        setIsListeningTest(false);
      },
    });

    if (!started) {
      setErrorMessage("Speech recognition not supported in this browser. You can still use typed answers!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Audio Setup & Privacy Consent</h3>
            <p className="text-xs text-slate-400">Verify your microphone and speakers before beginning</p>
          </div>
        </div>

        {/* Audio Privacy Notice */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Audio Privacy Commitment</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Your spoken responses are transcribed in real-time. Raw audio streams are never saved, recorded, or shared with third parties. You maintain full control to review or type responses.
          </p>
        </div>

        {/* Hardware Checks */}
        <div className="space-y-3">
          {/* Speaker Test */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Speaker Test</p>
                <p className="text-[11px] text-slate-400">Verify AI avatar voice playback</p>
              </div>
            </div>
            <button
              onClick={testSpeaker}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                speakerTested
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 flex items-center gap-1'
                  : 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
              }`}
            >
              {speakerTested ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tested</span>
                </>
              ) : (
                'Play Voice'
              )}
            </button>
          </div>

          {/* Microphone Test */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Microphone Test</p>
                  <p className="text-[11px] text-slate-400">Speak to test speech recognition</p>
                </div>
              </div>
              <button
                onClick={testMicrophone}
                disabled={isListeningTest}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  micTested
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 flex items-center gap-1'
                    : isListeningTest
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 animate-pulse'
                    : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                }`}
              >
                {micTested ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Working</span>
                  </>
                ) : isListeningTest ? (
                  'Listening...'
                ) : (
                  'Test Mic'
                )}
              </button>
            </div>
            {heardText && (
              <p className="text-[11px] italic text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg">
                {heardText}
              </p>
            )}
            {errorMessage && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/40 p-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="text-xs px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConsentGiven}
            className="text-xs px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all"
          >
            I Agree & Enter Interview
          </button>
        </div>
      </div>
    </div>
  );
};
