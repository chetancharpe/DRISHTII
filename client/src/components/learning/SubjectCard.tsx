import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { LearningSubject } from '../../types/learning';
import { BookOpen, Calculator, Globe, Brain, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SubjectCardProps {
  subject: LearningSubject;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Calculator,
  BookOpen,
  Globe,
  Brain,
};

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const IconComponent = iconMap[subject.iconName] || BookOpen;

  return (
    <Card className="flex flex-col justify-between h-full hover:border-primary/50 transition-colors">
      <div className="flex flex-col gap-4">
        {/* Subject Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-secondary">
                {subject.code}
              </span>
              <h3 className="text-base font-bold text-foreground leading-tight">
                {subject.name}
              </h3>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-elevated text-foreground-secondary border border-border">
            <CheckCircle2 className="w-3 h-3 text-primary" aria-hidden="true" />
            <span>{subject.completedTopicsCount} / {subject.totalTopicsCount} topics</span>
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-foreground-secondary leading-relaxed">
          {subject.description}
        </p>

        {/* Progress Bar */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-foreground-secondary">Subject Progress</span>
            <span className="font-bold text-foreground">{subject.progressPercent}%</span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={subject.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${subject.name} progress: ${subject.progressPercent} percent`}
            className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border/50"
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${subject.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-5 mt-auto">
        <Link
          to={`/candidate/learn/${subject.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated active:bg-surface-elevated text-foreground font-semibold text-xs border border-border hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-colors"
          aria-label={`Continue learning ${subject.name}`}
        >
          <span>Continue Learning</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
};
