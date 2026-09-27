import React, { useState } from 'react';
import { accessibilityApi } from '../../services/api/accessibilityApi';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface AccessibilityIssueReporterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityIssueReporter: React.FC<AccessibilityIssueReporterProps> = ({
  isOpen,
  onClose,
}) => {
  const { speak } = useAccessibility();
  const [issueType, setIssueType] = useState('screen_reader');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const currentPageUrl = typeof window !== 'undefined' ? window.location.pathname : '/';

    const success = await accessibilityApi.reportIssue({
      page_url: currentPageUrl,
      issue_type: issueType,
      description: description.trim(),
    });

    setIsSubmitting(false);
    if (success) {
      setSubmittedMessage('Thank you. Your accessibility report has been logged for our engineering team.');
      speak('Accessibility report submitted successfully.');
      setTimeout(() => {
        setSubmittedMessage(null);
        setDescription('');
        onClose();
      }, 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
        <h2 id="report-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
          ♿ Report an Accessibility Issue
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Encountered a barrier with keyboard navigation, screen readers, contrast, or speech? Let us know so we can fix it immediately.
        </p>

        {submittedMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm font-medium"
          >
            {submittedMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="issue-type" className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                id="issue-type"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="screen_reader">Screen Reader (Labels, Landmarks, Focus)</option>
                <option value="keyboard">Keyboard Navigation (Trap, Tab Order, Shortcuts)</option>
                <option value="contrast">Color Contrast or Theme Visibility</option>
                <option value="text_size">Text Scaling or Reflow Issue</option>
                <option value="audio">Audio Assistance / Speech Synthesis</option>
                <option value="question_format">Question Format / Formula Accessibility</option>
                <option value="missing_alt_text">Missing Image Alternative Text</option>
                <option value="other">Other Usability Friction</option>
              </select>
            </div>

            <div>
              <label htmlFor="issue-description" className="block text-xs font-semibold text-slate-300 mb-1">
                Description of the barrier
              </label>
              <textarea
                id="issue-description"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened and what did you expect to happen? (e.g. Focus was lost after closing the question modal)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md focus:ring-2 focus:ring-indigo-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
