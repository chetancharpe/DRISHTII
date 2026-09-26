import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamHeader } from '../../components/exam/ExamHeader';
import { ExamTimer } from '../../components/exam/ExamTimer';
import { QuestionCard } from '../../components/exam/QuestionCard';
import { QuestionPalette } from '../../components/exam/QuestionPalette';
import { ExamNavigation } from '../../components/exam/ExamNavigation';
import { SubmitExamModal } from '../../components/exam/SubmitExamModal';
import { MOCK_EXAMS, MOCK_QUESTIONS } from '../../utils/mockData';

export const LiveExamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const exam = MOCK_EXAMS.find((e) => e.id === id) || MOCK_EXAMS[0];
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleConfirmSubmit = () => {
    setIsSubmitModalOpen(false);
    navigate('/candidate/results');
  };

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto">
      <ExamHeader title={exam.title} category={exam.category} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <QuestionCard
            question={MOCK_QUESTIONS[0]}
            currentIndex={currentIndex + 1}
            totalQuestions={exam.totalQuestions}
          />
          <ExamNavigation
            onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentIndex((prev) => prev + 1)}
            onSubmit={() => setIsSubmitModalOpen(true)}
            hasPrev={currentIndex > 0}
          />
        </div>

        <div className="flex flex-col gap-4">
          <ExamTimer remainingMinutes={exam.duration} />
          <QuestionPalette
            totalQuestions={15}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
          />
        </div>
      </div>

      <SubmitExamModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        answeredCount={1}
        totalCount={exam.totalQuestions}
      />
    </div>
  );
};
