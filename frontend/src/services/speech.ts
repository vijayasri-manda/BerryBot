export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
  onError?: (error: any) => void;
}

export interface RecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onSoundLevel?: (level: number) => void;
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: 'en-US',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
};

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private isListeningActive: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  // =========================================================================
  // Text-To-Speech (Avatar Voice)
  // =========================================================================
  public speak(
    text: string,
    langCode: string = 'en',
    callbacks?: SpeechCallbacks
  ): void {
    if (!this.synth) {
      callbacks?.onError?.('Speech synthesis is not supported on this browser.');
      callbacks?.onEnd?.();
      return;
    }

    this.stopSpeaking();

    const targetLang = LANGUAGE_CODE_MAP[langCode] || 'en-US';
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    utterance.lang = targetLang;
    utterance.rate = 0.95; // Slightly slower for crisp clarity
    utterance.pitch = 1.05; // Friendly, professional timbre

    // Try finding a matching language voice
    const voices = this.synth.getVoices();
    const matchedVoice = voices.find(
      (v) => v.lang === targetLang || v.lang.replace('_', '-').startsWith(targetLang.slice(0, 2))
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      callbacks?.onError?.(e);
      callbacks?.onEnd?.();
    };

    utterance.onboundary = (e) => {
      callbacks?.onBoundary?.(e.charIndex);
    };

    // Edge-case workaround for Chrome speech synthesis pausing after 15s
    this.synth.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  // =========================================================================
  // Speech-To-Text (Candidate Microphone Input)
  // =========================================================================
  public startListening(
    langCode: string = 'en',
    callbacks: RecognitionCallbacks
  ): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      callbacks.onError('Web Speech Recognition API is not supported in this browser. Please use text input or Chrome/Edge.');
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = LANGUAGE_CODE_MAP[langCode] || 'en-US';

      this.recognition.onstart = () => {
        this.isListeningActive = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const combined = (finalTranscript || interimTranscript).trim();
        callbacks.onResult(combined, !!finalTranscript);
      };

      this.recognition.onerror = (event: any) => {
        let message = 'Microphone speech recognition error';
        if (event.error === 'not-allowed') {
          message = 'Microphone permission denied. Please enable microphone access in browser settings.';
        } else if (event.error === 'no-speech') {
          message = 'No speech detected. Please speak into your microphone or switch to typed answer.';
        }
        callbacks.onError(message);
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        callbacks.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      callbacks.onError(err.message || 'Failed to initialize microphone');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.isListeningActive = false;
    }
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }
}

export const speechService = new SpeechService();
