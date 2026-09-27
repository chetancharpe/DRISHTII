import React from 'react';
import { speechService } from '../../services/speechService';
import { SpeechControls } from './SpeechControls';

interface AudioAssistantProps {
  questionText?: string;
  options?: Array<{ id: string; text: string; aria_label?: string }>;
  instructions?: string;
  explanation?: string;
  className?: string;
}

export const AudioAssistant: React.FC<AudioAssistantProps> = ({
  questionText,
  options = [],
  instructions,
  explanation,
  className = '',
}) => {
  const readFullQuestionAndOptions = () => {
    let fullScript = '';
    if (questionText) {
      fullScript += `Question: ${questionText}. `;
    }
    if (options.length > 0) {
      fullScript += 'Options are: ';
      options.forEach((opt, idx) => {
        const label = opt.aria_label || opt.text;
        fullScript += `Option ${idx + 1}: ${label}. `;
      });
    }

    speechService.speak(fullScript, { priority: 'urgent' });
  };

  const readQuestionOnly = () => {
    if (questionText) {
      speechService.speak(`Question: ${questionText}`, { priority: 'urgent' });
    }
  };

  const readOptionsOnly = () => {
    if (options.length > 0) {
      let script = 'Available options are: ';
      options.forEach((opt, idx) => {
        const label = opt.aria_label || opt.text;
        script += `Option ${idx + 1}: ${label}. `;
      });
      speechService.speak(script, { priority: 'urgent' });
    }
  };

  const readInstructionsOnly = () => {
    if (instructions) {
      speechService.speak(`Instructions: ${instructions}`, { priority: 'urgent' });
    }
  };

  const readExplanationOnly = () => {
    if (explanation) {
      speechService.speak(`Explanation: ${explanation}`, { priority: 'urgent' });
    }
  };

  return (
    <div
      role="region"
      aria-label="Audio Reader Assistant"
      className={`flex flex-wrap items-center gap-2 p-2 rounded-xl bg-indigo-950/30 border border-indigo-900/50 ${className}`}
    >
      <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
        🔊 Audio Assistant:
      </span>

      {questionText && (
        <button
          type="button"
          onClick={readFullQuestionAndOptions}
          className="px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Read Question & Options
        </button>
      )}

      {questionText && (
        <button
          type="button"
          onClick={readQuestionOnly}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Question Only
        </button>
      )}

      {options.length > 0 && (
        <button
          type="button"
          onClick={readOptionsOnly}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Options Only
        </button>
      )}

      {instructions && (
        <button
          type="button"
          onClick={readInstructionsOnly}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Instructions
        </button>
      )}

      {explanation && (
        <button
          type="button"
          onClick={readExplanationOnly}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Explanation
        </button>
      )}

      <div className="ml-auto">
        <SpeechControls />
      </div>
    </div>
  );
};
