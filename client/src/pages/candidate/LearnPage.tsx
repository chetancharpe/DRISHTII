import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';

export const LearnPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          to="/candidate/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <Card
        title="Candidate Learning & Coursework Module"
        subtitle="Structured concept notes, syllabus summaries, and audio walkthroughs"
      >
        <div className="p-8 rounded-xl border border-dashed border-border bg-surface-elevated/40 flex flex-col items-center text-center gap-3 my-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <BookOpen className="w-8 h-8" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-base font-bold text-foreground">
              Module In Preparation
            </h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              This module will be available in the next development phase. It will feature accessible markdown notes, acoustic passage narrations, and audio-first study cards.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <Link
              to="/candidate/practice"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast text-xs font-bold transition-colors min-h-[40px]"
            >
              <span>Go to Practice Questions</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};
