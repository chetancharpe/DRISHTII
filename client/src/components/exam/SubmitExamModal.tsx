import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export interface SubmitExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount?: number;
  totalCount?: number;
}

export const SubmitExamModal: React.FC<SubmitExamModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  answeredCount = 0,
  totalCount = 0,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Examination Session"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Return to Questions
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirm Final Submission
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p>Are you sure you want to conclude and submit your certified examination?</p>
        <div className="p-3 bg-surface-elevated rounded border border-border text-sm">
          <span>You have answered </span>
          <strong>{answeredCount}</strong> of <strong>{totalCount}</strong> questions.
        </div>
        <p className="text-xs text-status-warning">
          ⚠️ Once submitted, answers are permanently locked and sent for psychometric evaluation.
        </p>
      </div>
    </Modal>
  );
};
