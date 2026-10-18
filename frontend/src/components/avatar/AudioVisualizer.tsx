import React from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  isActive: boolean;
  type?: 'avatar' | 'user';
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  type = 'avatar',
  barCount = 16,
}) => {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  // Color scheme based on speaker
  const activeColor =
    type === 'avatar'
      ? 'from-blue-500 to-indigo-400'
      : 'from-emerald-400 to-teal-300';

  const idleColor = 'from-slate-700 to-slate-800';

  return (
    <div className="flex items-center justify-center gap-1 h-10 px-4 py-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-inner">
      {bars.map((i) => {
        // Vary heights naturally
        const minHeight = 4;
        const maxHeight = isActive ? (i % 2 === 0 ? 32 : i % 3 === 0 ? 24 : 18) : 4;
        const duration = 0.4 + (i % 5) * 0.1;

        return (
          <motion.div
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t ${isActive ? activeColor : idleColor} transition-colors duration-300`}
            animate={
              isActive
                ? {
                    height: [minHeight, maxHeight, minHeight + 4, maxHeight * 0.8, minHeight],
                  }
                : { height: 4 }
            }
            transition={
              isActive
                ? {
                    repeat: Infinity,
                    duration: duration,
                    ease: 'easeInOut',
                    delay: (i * 0.05) % 0.3,
                  }
                : { duration: 0.3 }
            }
          />
        );
      })}
    </div>
  );
};
