import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTranslation } from '../../i18n';
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
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('accessibility.resetConfirmTitle')}
      description={t('accessibility.resetConfirmDesc')}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label={t('common.cancel')}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            icon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
            aria-label={t('accessibility.resetDefaults')}
          >
            {t('accessibility.resetDefaults')}
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
            {t('accessibility.resetConfirmTitle')}
          </p>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            {t('accessibility.resetConfirmDesc')}
          </p>
        </div>
      </div>
    </Modal>
  );
};
