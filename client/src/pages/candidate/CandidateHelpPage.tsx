import React from 'react';
import { Card } from '../../components/common/Card';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export const CandidateHelpPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Candidate Help, Shortcuts & Exam Guidance
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Audio-first navigation commands, exam shortcuts, and offline resilience guidelines for DRISHTI.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/candidate/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Link to="/candidate/practice">
            <Button variant="primary">Practice Shortcuts</Button>
          </Link>
        </div>
      </div>

      {/* 1. Essential Exam Shortcuts */}
      <Card
        title="Live Exam & Practice Keyboard Shortcuts"
        subtitle="Single-key actions designed for screen-reader and keyboard-only navigation without mouse dependency"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Keyboard Shortcuts Table">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-foreground-muted font-semibold">
                <th scope="col" className="py-3 px-4">Key / Combination</th>
                <th scope="col" className="py-3 px-4">Action</th>
                <th scope="col" className="py-3 px-4">Screen Reader Announcement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">Q</td>
                <td className="py-3 px-4 font-semibold">Read Question</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Reads full question prompt and mathematical expressions aloud</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">1, 2, 3, 4</td>
                <td className="py-3 px-4 font-semibold">Select Option</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Selects Option A, B, C, or D and confirms selection audibly</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">O</td>
                <td className="py-3 px-4 font-semibold">Read Selected Option</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Announces your currently selected answer option</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">Shift + O</td>
                <td className="py-3 px-4 font-semibold">Cycle All Options</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Reads each available option with its corresponding letter</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">N or →</td>
                <td className="py-3 px-4 font-semibold">Next Question</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Autosaves answer and moves focus to next question</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">P or ←</td>
                <td className="py-3 px-4 font-semibold">Previous Question</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Returns to prior question with state preserved</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">M</td>
                <td className="py-3 px-4 font-semibold">Mark for Review</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Flags question for later review and updates palette</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">C</td>
                <td className="py-3 px-4 font-semibold">Clear Response</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Clears current selection and resets to unanswered status</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">S</td>
                <td className="py-3 px-4 font-semibold">Status & Time Check</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Announces remaining time, total answered, and review counts</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-primary">Alt + A</td>
                <td className="py-3 px-4 font-semibold">Accessibility Panel</td>
                <td className="py-3 px-4 text-xs text-foreground-muted">Opens speech rate, contrast mode, and font size adjustment panel</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* 2. Scribe & Voice Dictation Mode */}
      <Card
        title="Speech Dictation & Scribe Mode"
        subtitle="Hands-free and assisted voice recognition for visually impaired candidates"
      >
        <div className="flex flex-col gap-4 text-sm text-foreground">
          <p>
            DRISHTI includes a built-in digital scribe feature that allows you to dictate choices and navigate without touch or sight dependencies.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-elevated border border-border">
              <h4 className="font-bold text-foreground mb-1">Voice Commands for Selection</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1">
                <li>Say <span className="font-mono text-primary font-bold">"Option 1"</span> or <span className="font-mono text-primary font-bold">"Choose Option B"</span></li>
                <li>Say <span className="font-mono text-primary font-bold">"Mark for review"</span> to flag the item</li>
                <li>Say <span className="font-mono text-primary font-bold">"Clear response"</span> to undo your selection</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-surface-elevated border border-border">
              <h4 className="font-bold text-foreground mb-1">Voice Navigation Commands</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1">
                <li>Say <span className="font-mono text-primary font-bold">"Next question"</span> or <span className="font-mono text-primary font-bold">"Previous question"</span></li>
                <li>Say <span className="font-mono text-primary font-bold">"Read question again"</span> to repeat prompt</li>
                <li>Say <span className="font-mono text-primary font-bold">"How much time is left?"</span> for clock check</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Offline Autosave & Connection Loss */}
      <Card
        title="Offline Resilience & Data Protection"
        subtitle="Automatic safeguarding against Wi-Fi or power disruptions during exams"
      >
        <div className="flex flex-col gap-3 text-sm text-foreground">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-status-success/10 border border-status-success/30">
            <span className="text-2xl" aria-hidden="true">🛡️</span>
            <div>
              <h4 className="font-bold text-status-success">Continuous Local Autosave</h4>
              <p className="text-xs text-foreground-muted mt-1">
                Every keystroke, answer selection, and navigation action is recorded in local browser storage before sending to the server. If your internet connection drops, you can continue answering uninterrupted.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-2xl" aria-hidden="true">🔄</span>
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-300">Audible Connection Announcements</h4>
              <p className="text-xs text-foreground-muted mt-1">
                If the server cannot be reached, a screen reader announcement will notify you immediately: <em>"Connection lost. Answers are safely preserved locally."</em> When connection returns, all queued answers sync automatically.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Support & Proctor Contact */}
      <Card
        title="Proctor Desk & Candidate Support"
        subtitle="Immediate assistance during assessment sessions"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
          <div>
            <p className="font-semibold text-foreground">Technical Proctor Support Desk</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              Email: support@drishti-exam.gov.in · Toll-free Helpline: 1800-11-2244 (Mon-Sat, 8 AM - 8 PM IST)
            </p>
          </div>
          <a
            href="mailto:support@drishti-exam.gov.in?subject=Candidate%20Accessibility%20Support%20Request"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs"
          >
            Contact Support Desk
          </a>
        </div>
      </Card>
    </div>
  );
};
