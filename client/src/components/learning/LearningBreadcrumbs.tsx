import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { LearningBreadcrumbItem } from '../../types/learning';

interface LearningBreadcrumbsProps {
  items: LearningBreadcrumbItem[];
}

export const LearningBreadcrumbs: React.FC<LearningBreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb navigation" className="py-1">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-secondary">
        <li>
          <Link
            to="/candidate/dashboard"
            className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1 min-h-[32px]"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-foreground-muted" />
              </li>
              <li>
                {item.path && !isLast ? (
                  <Link
                    to={item.path}
                    className="hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1.5 py-1 min-h-[32px] inline-flex items-center"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current="page"
                    className="font-bold text-foreground px-1.5 py-1"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
