/**
 * AI Accessibility & Interaction Monitoring Status Component
 * Displays lightweight, non-distracting telemetry status indicators:
 * - Camera: Connected / Denied / Off
 * - Candidate: Detected / Absent
 * - Hand Gesture: Ready (or active recognized gesture)
 * - Voice Assistance: Enabled / Muted
 *
 * Conforms to WCAG 2.1 AA, high-contrast mode, and keyboard accessibility.
 */

import React, { useState } from 'react';
import {
  Camera,
  CameraOff,
  UserCheck,
  UserX,
  Hand,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  MonitoringCameraStatus,
  CandidatePresenceStatus,
  GestureType,
  AccessibilityMode,
} from '../../types/accessibilityMonitoring';

export interface AccessibilityMonitoringWidgetProps {
  cameraStatus: MonitoringCameraStatus;
  presenceStatus: CandidatePresenceStatus;
  presenceAlert: string | null;
  activeGesture: GestureType;
  gestureConfidence: number;
  pendingOption: string | null;
  voiceEnabled: boolean;
  absenceDuration: number;
  mode?: AccessibilityMode;
  onToggleVoice: () => void;
  onConfirmPending?: () => void;
  onRetryCamera?: () => void;
  onHelpRequested?: () => void;
}

export const AccessibilityMonitoringWidget: React.FC<AccessibilityMonitoringWidgetProps> = ({
  cameraStatus,
  presenceStatus,
  presenceAlert,
  activeGesture,
  gestureConfidence,
  pendingOption,
  voiceEnabled,
  absenceDuration,
  mode = 'STANDARD',
  onToggleVoice,
  onConfirmPending,
  onRetryCamera,
  onHelpRequested,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Status Labels & Styles
  const isCameraOk = cameraStatus === 'connected';
  const isCandidateOk = presenceStatus === 'detected';

  const getCameraBadge = () => {
    switch (cameraStatus) {
      case 'connected':
        return { label: 'Camera: Connected', class: 'text-success bg-success/10 border-success/30' };
      case 'requesting':
        return { label: 'Camera: Connecting...', class: 'text-primary bg-primary/10 border-primary/30' };
      case 'denied':
        return { label: 'Camera: Denied', class: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' };
      default:
        return { label: 'Camera: Off', class: 'text-foreground-secondary bg-surface-elevated border-border' };
    }
  };

  const getPresenceBadge = () => {
    switch (presenceStatus) {
      case 'detected':
        return { label: 'Candidate: Detected', class: 'text-success bg-success/10 border-success/30' };
      case 'too_far':
        return { label: 'Candidate: Too Far', class: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'too_close':
        return { label: 'Candidate: Too Close', class: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'shifted':
        return { label: 'Candidate: Shifted', class: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' };
      default:
        return {
          label: `Candidate: Absent (${absenceDuration.toFixed(1)}s)`,
          class: 'text-red-700 dark:text-red-400 bg-red-500/15 border-red-500/30 animate-pulse',
        };
    }
  };

  const cameraBadge = getCameraBadge();
  const presenceBadge = getPresenceBadge();

  return (
    <aside
      aria-label="AI Accessibility and Proctoring Monitor"
      role="region"
      className="w-full rounded-xl border border-border bg-surface shadow-xs transition-all text-xs"
    >
      {/* Top Bar Summary: Always Visible & Non-distracting */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:px-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Monitor Title */}
          <div className="flex items-center gap-1.5 text-primary font-bold text-[11px] uppercase tracking-wider pr-1">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>AI Assist</span>
          </div>

          {/* Camera Status */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${cameraBadge.class}`}
          >
            {isCameraOk ? (
              <Camera className="w-3 h-3 text-success" aria-hidden="true" />
            ) : (
              <CameraOff className="w-3 h-3" aria-hidden="true" />
            )}
            <span>{cameraBadge.label}</span>
          </span>

          {/* Candidate Presence Status */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${presenceBadge.class}`}
          >
            {isCandidateOk ? (
              <UserCheck className="w-3 h-3 text-success" aria-hidden="true" />
            ) : (
              <UserX className="w-3 h-3 text-red-600 dark:text-red-400" aria-hidden="true" />
            )}
            <span>{presenceBadge.label}</span>
          </span>

          {/* Hand Gesture Status */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-surface-elevated text-[11px] font-medium text-foreground">
            <Hand className="w-3 h-3 text-primary" aria-hidden="true" />
            <span>
              {activeGesture !== 'UNKNOWN'
                ? `Gesture: ${activeGesture.replace('_', ' ')} (${Math.round(gestureConfidence * 100)}%)`
                : 'Hand Gesture: Ready'}
            </span>
          </span>

          {/* Voice Assistance Status */}
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-surface-elevated text-[11px] font-medium text-foreground">
            {voiceEnabled ? (
              <Volume2 className="w-3 h-3 text-primary" aria-hidden="true" />
            ) : (
              <VolumeX className="w-3 h-3 text-foreground-secondary" aria-hidden="true" />
            )}
            <span>Voice: {voiceEnabled ? 'Enabled' : 'Muted'}</span>
          </span>

          {/* Child Mode Badge (Requirement #6) */}
          {mode === 'CHILD' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
              <span>Child Mode Active</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Pending Option Confirmation Button (Requirement #4) */}
          {pendingOption && (
            <button
              type="button"
              onClick={onConfirmPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-contrast text-xs font-bold hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[30px] animate-pulse"
              aria-label={`Confirm selected Option ${pendingOption}`}
            >
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Confirm Option {pendingOption}</span>
            </button>
          )}

          {/* Toggle Voice Audio Button */}
          <button
            type="button"
            onClick={onToggleVoice}
            className="p-1.5 rounded-lg border border-border hover:bg-surface-elevated text-foreground-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[30px] min-w-[30px] inline-flex items-center justify-center transition-colors"
            aria-label={voiceEnabled ? 'Mute voice feedback' : 'Enable voice feedback'}
            title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
          >
            {voiceEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {/* Help trigger */}
          <button
            type="button"
            onClick={onHelpRequested}
            className="p-1.5 rounded-lg border border-border hover:bg-surface-elevated text-foreground-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[30px] min-w-[30px] inline-flex items-center justify-center transition-colors"
            aria-label="Request proctor assistance or open help"
            title="Assistance"
          >
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Expand Details Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg border border-border hover:bg-surface-elevated text-foreground-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[30px] min-w-[30px] inline-flex items-center justify-center transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse monitoring details' : 'Expand monitoring details'}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Urgent Presence Alert Banner (only when continuous absence >= 3s, Requirement #1) */}
      {presenceAlert && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-t border-red-500/20 bg-red-500/10 px-3.5 py-2 flex items-center justify-between text-xs text-red-800 dark:text-red-300 font-semibold"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
            <span>{presenceAlert}</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-red-700 dark:text-red-400">
            {absenceDuration.toFixed(1)}s
          </span>
        </div>
      )}

      {/* Expanded Accessibility & Gesture Guide */}
      {isExpanded && (
        <div className="border-t border-border p-3.5 bg-surface-elevated/40 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            {/* Gesture Guide */}
            <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col gap-1">
              <span className="font-bold text-foreground">Hand Gestures:</span>
              <ul className="text-foreground-secondary space-y-0.5">
                <li>• 1 Finger: Option 1</li>
                <li>• 2 Fingers: Option 2</li>
                <li>• 3 Fingers: Option 3</li>
                <li>• 4 Fingers: Option 4</li>
                <li>• Thumbs Up: Confirm Answer</li>
                <li>• Open Palm: Request Help</li>
              </ul>
            </div>

            {/* Keyboard Guide */}
            <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col gap-1">
              <span className="font-bold text-foreground">Keyboard Controls:</span>
              <ul className="text-foreground-secondary space-y-0.5">
                <li>• Keys 1-4 or A-D: Select Option</li>
                <li>• Enter / Space: Confirm Answer</li>
                <li>• Alt+N: Next Question</li>
                <li>• Alt+P: Previous Question</li>
                <li>• H: Trigger Assistance</li>
              </ul>
            </div>

            {/* Privacy Compliance (Requirement #8) */}
            <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col gap-1">
              <span className="font-bold text-foreground">Privacy Protection:</span>
              <p className="text-foreground-secondary leading-tight">
                Camera processing runs 100% locally in your browser. Video feeds and biometric markers
                are never uploaded or recorded to servers.
              </p>
            </div>

            {/* Camera Diagnostics */}
            <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col justify-between gap-1.5">
              <div>
                <span className="font-bold text-foreground">Diagnostics:</span>
                <p className="text-foreground-secondary">
                  Loop: 10 FPS • Threshold: 3s
                </p>
              </div>
              {cameraStatus === 'denied' && onRetryCamera && (
                <button
                  type="button"
                  onClick={onRetryCamera}
                  className="px-2 py-1 rounded bg-primary text-primary-contrast font-bold text-[11px] self-start"
                >
                  Retry Camera
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
