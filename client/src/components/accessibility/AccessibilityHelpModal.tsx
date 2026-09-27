import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import {
  Keyboard,
  Volume2,
  Eye,
  Clock,
  Wifi,
  Sparkles,
  BookOpen,
  Settings,
} from 'lucide-react';


export interface AccessibilityHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

type HelpTab = 'shortcuts' | 'exam_keys' | 'screen_reader' | 'audio' | 'display' | 'exam_safety';

export const AccessibilityHelpModal: React.FC<AccessibilityHelpModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('shortcuts');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accessibility Help & Shortcuts"
      description="Clear, accessible instructions for keyboard navigation, screen reader usage, and examination controls."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Navigation Tabs for Categories */}
        <div
          role="tablist"
          aria-label="Help categories"
          className="flex flex-wrap gap-2 p-1.5 bg-muted/40 rounded-xl border border-border"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'shortcuts'}
            aria-controls="help-tabpanel-shortcuts"
            id="help-tab-shortcuts"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'shortcuts'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-muted focus:bg-muted'
            }`}
          >
            <Keyboard className="w-4 h-4" aria-hidden="true" />
            <span>Global Shortcuts</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'exam_keys'}
            aria-controls="help-tabpanel-exam-keys"
            id="help-tab-exam-keys"
            onClick={() => setActiveTab('exam_keys')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'exam_keys'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-muted focus:bg-muted'
            }`}
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>Exam Key Map</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'screen_reader'}
            aria-controls="help-tabpanel-screen-reader"
            id="help-tab-screen-reader"
            onClick={() => setActiveTab('screen_reader')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'screen_reader'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-muted focus:bg-muted'
            }`}
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Screen Readers</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'audio'}
            aria-controls="help-tabpanel-audio"
            id="help-tab-audio"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'audio'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-muted focus:bg-muted'
            }`}
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            <span>Audio & Speech</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'display'}
            aria-controls="help-tabpanel-display"
            id="help-tab-display"
            onClick={() => setActiveTab('display')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'display'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-muted focus:bg-muted'
            }`}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>Display & Contrast</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'exam_safety'}
            aria-controls="help-tabpanel-exam-safety"
            id="help-tab-exam-safety"
            onClick={() => setActiveTab('exam_safety')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'exam_safety'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-muted focus:bg-muted'
            }`}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>Timer & Auto-Save</span>
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'shortcuts' && (
          <div
            id="help-tabpanel-shortcuts"
            role="tabpanel"
            aria-labelledby="help-tab-shortcuts"
            className="space-y-4"
          >
            <h3 className="text-base font-semibold text-foreground">Global Platform Shortcuts</h3>
            <p className="text-sm text-muted-foreground">
              These hotkeys can be pressed from any page on GoWow to jump directly to key accessibility tools.
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-card">
                <dt className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Open Accessibility Help</span>
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                    Alt + H
                  </kbd>
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Displays this guide anywhere in the platform.
                </dd>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card">
                <dt className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Accessibility Settings</span>
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                    Alt + A
                  </kbd>
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Opens font size, contrast, speech, and motion controls.
                </dd>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card">
                <dt className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Skip to Content</span>
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                    Tab &gt; Enter
                  </kbd>
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  First focusable element on any page bypasses header navigation.
                </dd>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card">
                <dt className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Close Dialog / Panel</span>
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                    Escape (Esc)
                  </kbd>
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Dismisses any open modal or popover and restores keyboard focus.
                </dd>
              </div>
            </dl>
          </div>
        )}

        {activeTab === 'exam_keys' && (
          <div
            id="help-tabpanel-exam-keys"
            role="tabpanel"
            aria-labelledby="help-tab-exam-keys"
            className="space-y-4"
          >
            <h3 className="text-base font-semibold text-foreground">Live Examination Keyboard Map</h3>
            <p className="text-sm text-muted-foreground">
              Candidate independence is guaranteed. Complete an entire examination using only your keyboard.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <caption className="sr-only">Live Examination Keyboard Shortcuts</caption>
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th scope="col" className="py-2.5 px-3 font-semibold text-foreground">
                      Action
                    </th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-foreground">
                      Shortcut
                    </th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-foreground">
                      Screen Reader Result
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-foreground">Next Question</td>
                    <td className="py-2.5 px-3">
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                        Alt + N
                      </kbd>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      Saves answer, advances to next question, and focuses question heading.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-foreground">Previous Question</td>
                    <td className="py-2.5 px-3">
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                        Alt + P
                      </kbd>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      Returns to preceding question without losing input.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-foreground">Select / Change Option</td>
                    <td className="py-2.5 px-3">
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                        Arrow Keys / Space
                      </kbd>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      Standard radio/checkbox group navigation; announces selected state.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-foreground">Mark for Review</td>
                    <td className="py-2.5 px-3">
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                        Alt + M
                      </kbd>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      Toggles flagged status and announces &quot;Question marked for review&quot;.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-foreground">Clear Response</td>
                    <td className="py-2.5 px-3">
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                        Alt + C
                      </kbd>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      Unselects choices and announces &quot;Answer cleared&quot;.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-foreground">Read Aloud</td>
                    <td className="py-2.5 px-3">
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                        Alt + L
                      </kbd>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      Triggers GoWow TTS to speak current question and choices.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-foreground">Submit Exam</td>
                    <td className="py-2.5 px-3">
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-muted rounded border border-border text-foreground">
                        Alt + S
                      </kbd>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      Opens accessible submission confirmation dialog.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'screen_reader' && (
          <div
            id="help-tabpanel-screen-reader"
            role="tabpanel"
            aria-labelledby="help-tab-screen-reader"
            className="space-y-4"
          >
            <h3 className="text-base font-semibold text-foreground">Screen Reader Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              GoWow is engineered for seamless operation with <strong>NVDA</strong> (Windows), <strong>JAWS</strong> (Windows), and <strong>VoiceOver</strong> (macOS/iOS).
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-border bg-card">
                <h4 className="font-medium text-sm text-foreground">Semantic Landmarks</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Use standard landmark navigation keys (e.g. <code>D</code> in NVDA/JAWS) to jump between Header, Navigation, Main, and Footer regions.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card">
                <h4 className="font-medium text-sm text-foreground">Headings Hierarchy</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Press <code>H</code> to navigate by heading levels. Every page contains one clear <code>&lt;h1&gt;</code>, followed by logical <code>&lt;h2&gt;</code> sections.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card">
                <h4 className="font-medium text-sm text-foreground">Form Controls</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Press <code>F</code> to jump between inputs and questions. Single-choice questions use standard radio groups; multiple-choice questions use standard checkboxes.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div
            id="help-tabpanel-audio"
            role="tabpanel"
            aria-labelledby="help-tab-audio"
            className="space-y-4"
          >
            <h3 className="text-base font-semibold text-foreground">Audio & Text-to-Speech Assistance</h3>
            <p className="text-sm text-muted-foreground">
              For candidates who do not use an external screen reader or prefer auditory reinforcement, GoWow includes native speech synthesis.
            </p>

            <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Play / Pause:</strong> Every question and lesson has an audio player with accessible controls.
              </li>
              <li>
                <strong className="text-foreground">Speed Adjustment:</strong> Adjust speech rate from 0.75x (slow) to 1.5x (fast) in Accessibility Settings.
              </li>
              <li>
                <strong className="text-foreground">No Auto-Play:</strong> Audio will never play automatically without your explicit action.
              </li>
              <li>
                <strong className="text-foreground">Formula Speech:</strong> Complex math formulas have spoken transcripts (e.g., &quot;fraction x over y&quot;).
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'display' && (
          <div
            id="help-tabpanel-display"
            role="tabpanel"
            aria-labelledby="help-tab-display"
            className="space-y-4"
          >
            <h3 className="text-base font-semibold text-foreground">Visual Personalization & Contrast</h3>
            <p className="text-sm text-muted-foreground">
              Tailor the platform to your vision requirements without breaking layouts or truncating text.
            </p>

            <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Text Scaling:</strong> Choose between Default, Large (125%), Extra-Large (150%), and Maximum (200%).
              </li>
              <li>
                <strong className="text-foreground">High Contrast:</strong> Enables 7:1 contrast ratios and crisp outlines on all interactive elements.
              </li>
              <li>
                <strong className="text-foreground">Theme Modes:</strong> Switch seamlessly between Dark, Light, or System default modes.
              </li>
              <li>
                <strong className="text-foreground">Reduced Motion:</strong> Suppresses decorative animations, transitions, and slide effects.
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'exam_safety' && (
          <div
            id="help-tabpanel-exam-safety"
            role="tabpanel"
            aria-labelledby="help-tab-exam-safety"
            className="space-y-4"
          >
            <h3 className="text-base font-semibold text-foreground">Timer & Connection Safeguards</h3>
            <p className="text-sm text-muted-foreground">
              Exam security, automated saving, and network disconnect recovery work silently in the background.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
                <Wifi className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="font-medium text-sm text-foreground">Offline Resilience</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    If your network drops, responses are cached in local browser storage and re-synchronized automatically upon reconnection.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="font-medium text-sm text-foreground">Audible Timer Warnings</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Spoken announcements alert you at 15 minutes, 5 minutes, and 1 minute remaining. You can configure announcement frequency in Settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="font-mono font-bold bg-muted px-1.5 py-0.5 rounded border border-border text-foreground">Esc</kbd> to close.
          </div>

          <div className="flex items-center gap-3">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
                <span>Accessibility Settings (Alt+A)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
