import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CheckCircle2 } from 'lucide-react';


export const SettingsPage: React.FC = () => {
  const [wcagLevel, setWcagLevel] = useState<string>('AAA');
  const [networkBuffer, setNetworkBuffer] = useState<number>(90);
  const [extraTimeRatio, setExtraTimeRatio] = useState<number>(1.5);
  const [auditRetentionDays, setAuditRetentionDays] = useState<number>(365);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="System Configuration">
      <div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
          Platform Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Global System Settings</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Configure platform-wide accessibility gating thresholds, session safety buffers, and audit retention policies.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-status-success/15 border border-status-success/30 text-xs text-status-success font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          System configuration successfully synchronized across cluster nodes.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card title="Accessibility Standards Enforcement" subtitle="Strict publish gate criteria">
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground block">
                Mandatory Accessibility Enforcement Level
              </label>
              <select
                value={wcagLevel}
                onChange={(e) => setWcagLevel(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 rounded-lg border border-border bg-surface text-foreground font-semibold"
              >
                <option value="AAA">WCAG 2.2 Level AAA (Strict Non-Visual Parity)</option>
                <option value="AA">WCAG 2.2 Level AA (Standard)</option>
              </select>
              <p className="text-foreground-muted text-[11px] mt-1">
                Level AAA blocks examination publishing whenever formula ClearSpeak or image alt-text is omitted.
              </p>
            </div>

            <div className="space-y-1 pt-2">
              <label className="font-bold text-foreground block">
                Standard PwD Compensatory Extra Time Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={extraTimeRatio}
                onChange={(e) => setExtraTimeRatio(Number(e.target.value))}
                className="w-full sm:w-48 px-3 py-2 rounded-lg border border-border bg-surface text-foreground"
              />
              <p className="text-foreground-muted text-[11px] mt-1">
                Multiplier 1.5 grants 90 minutes for a standard 60-minute examination.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Resilience & Network Safety Buffer" subtitle="Protects candidates during momentary internet disconnects">
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground block">
                Candidate Disconnect Safety Grace Period (Seconds)
              </label>
              <input
                type="number"
                value={networkBuffer}
                onChange={(e) => setNetworkBuffer(Number(e.target.value))}
                className="w-full sm:w-48 px-3 py-2 rounded-lg border border-border bg-surface text-foreground"
              />
              <p className="text-foreground-muted text-[11px] mt-1">
                If candidate drops connection, local encrypted answers remain cached and timer compensates network reconnect time up to this buffer.
              </p>
            </div>

            <div className="space-y-1 pt-2">
              <label className="font-bold text-foreground block">
                Audit Log Retention Window (Days)
              </label>
              <input
                type="number"
                value={auditRetentionDays}
                onChange={(e) => setAuditRetentionDays(Number(e.target.value))}
                className="w-full sm:w-48 px-3 py-2 rounded-lg border border-border bg-surface text-foreground"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Save System Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
