import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface PersonalizedMockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalizedMockModal: React.FC<PersonalizedMockModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { speak } = useAccessibility();

  const [subject, setSubject] = useState('Mathematics');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Percentages', 'Probability']);
  const [questionCount, setQuestionCount] = useState(15);
  const [difficulty, setDifficulty] = useState('Adaptive');
  const [durationMinutes, setDurationMinutes] = useState(25);

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

  const availableTopics =
    subject === 'Mathematics'
      ? ['Percentages', 'Probability', 'Algebra', 'Number Systems', 'Geometry']
      : subject === 'Logical Reasoning'
      ? ['Syllogisms', 'Blood Relations', 'Seating Arrangement', 'Series']
      : ['Reading Comprehension', 'Vocabulary', 'Error Spotting'];

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const handleStartMock = () => {
    speak(`Starting personalized mock test with ${questionCount} questions in ${subject}.`);
    onClose();
    navigate('/mock-tests');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mock-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-800 pb-3 mb-5">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Personalized Practice Engine
          </span>
          <h2 id="mock-modal-title" className="text-2xl font-bold text-white mt-1">
            Create Custom Practice Mock
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure your custom mock test parameters. Your existing accessibility settings automatically apply.
          </p>
        </div>

        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label htmlFor="mock-subject" className="block text-xs font-semibold text-slate-300 mb-1">
              Subject
            </label>
            <select
              id="mock-subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setSelectedTopics([]);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Logical Reasoning">Logical Reasoning</option>
              <option value="English">English</option>
            </select>
          </div>

          {/* Topics Multi-Select */}
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Topics ({selectedTopics.length} selected)
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Topic Selection">
              {availableTopics.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {topic} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions & Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mock-q-count" className="block text-xs font-semibold text-slate-300 mb-1">
                Number of Questions
              </label>
              <select
                id="mock-q-count"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
                <option value={30}>30 Questions</option>
              </select>
            </div>

            <div>
              <label htmlFor="mock-duration" className="block text-xs font-semibold text-slate-300 mb-1">
                Duration (Minutes)
              </label>
              <select
                id="mock-duration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={15}>15 Minutes</option>
                <option value={25}>25 Minutes</option>
                <option value={40}>40 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="mock-difficulty" className="block text-xs font-semibold text-slate-300 mb-1">
              Difficulty
            </label>
            <select
              id="mock-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Adaptive">Adaptive (Adjusts to your accuracy)</option>
              <option value="Easy">Foundational (Easy)</option>
              <option value="Medium">Standard (Medium)</option>
              <option value="Hard">Advanced (Hard)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartMock}
            disabled={selectedTopics.length === 0}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 focus:ring-2 focus:ring-indigo-500"
          >
            Generate & Launch Mock Test
          </button>
        </div>
      </div>
    </div>
  );
};
