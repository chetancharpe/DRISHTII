import React, { useEffect, useState } from 'react';
import { ExaminerExam } from '../../types/examiner';
import { examinerService } from '../../services/examinerService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Pause, Eye } from 'lucide-react';

import { Link } from 'react-router-dom';

export const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<ExaminerExam[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await examinerService.getExams();
      setExams(data);
    };
    load();
  }, []);

  const handleEmergencyPause = async (examId: string) => {
    if (window.confirm('Administrative Override: Emergency pause examination for compliance review?')) {
      await examinerService.pauseExam(examId);
      const updated = await examinerService.getExams();
      setExams(updated);
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Global Examination Administration">
      <div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
          Platform-Wide Registry
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Global Examinations Governance</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Review all scheduled and live examinations across institutional tenants with administrative emergency pause controls.
        </p>
      </div>

      <div className="space-y-4">
        {exams.map((exam) => (
          <Card
            key={exam.id}
            title={exam.title}
            subtitle={`${exam.code} • Organization: ${exam.organization} • ${exam.schedule.startDate} (${exam.schedule.timezone})`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-foreground-muted block">Status</span>
                  <span className="font-bold text-foreground capitalize">{exam.lifecycleStatus}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block">Enrolled Candidates</span>
                  <span className="font-bold text-foreground">{exam.candidatesCount}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block">Duration</span>
                  <span className="font-bold text-foreground">{exam.rules.durationMinutes} mins</span>
                </div>
                <div>
                  <span className="text-foreground-muted block">Immutability</span>
                  <span className="font-bold text-status-success">{exam.isImmutable ? 'Locked' : 'Draft Mutable'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/examiner/exams/${exam.id}/preview`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-1" aria-hidden="true" />
                    Preview
                  </Button>
                </Link>
                {exam.lifecycleStatus === 'LIVE' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleEmergencyPause(exam.id)}
                    className="flex items-center gap-1"
                  >
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    Admin Freeze
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
