import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export interface ResetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetSettingsModal: React.FC<ResetSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Accessibility Settings"
      description="Restore all accessibility configurations to default state"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Cancel reset and keep current settings"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            icon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
            aria-label="Confirm reset all settings to defaults"
          >
            Reset to Defaults
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3 p-1">
        <div className="p-2.5 rounded-lg bg-status-warning/10 text-status-warning shrink-0" aria-hidden="true">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">
            Reset all accessibility preferences to the default settings?
          </p>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            This action will restore default text scaling (100%), standard contrast, system theme, and turn off audio assistance. You can reconfigure or adjust your preferences at any time.
          </p>
        </div>
      </div>
    </Modal>
  );
};
