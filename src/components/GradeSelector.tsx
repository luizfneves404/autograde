import React from 'react';
import type { Grade } from '@/types';

interface GradeSelectorProps {
  grades: Grade[];
  currentGradeIndex: number;
  onSelectGrade: (index: number) => void;
}

export const GradeSelector: React.FC<GradeSelectorProps> = ({
  grades,
  currentGradeIndex,
  onSelectGrade,
}) => {
  if (grades.length <= 1) {
    return null;
  }

  return (
    <div>
      <h4 className="text-base font-semibold mb-3 text-neutral-700">
        Todas as Grades (ordenadas por pontuação):
      </h4>
      <div className="flex flex-wrap gap-2">
        {grades.map((grade, index) => (
          <button
            key={index}
            onClick={() => onSelectGrade(index)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              index === currentGradeIndex
                ? 'bg-primary-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
            }`}
          >
            <span className="tabular-nums">
              Grade {index + 1} ({grade.score.toFixed(2)} pontos)
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
