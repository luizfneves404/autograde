import React from 'react';

interface GradeControlsProps {
  currentGradeIndex: number;
  totalGrades: number;
  goToPrevious: () => void;
  goToNext: () => void;
}

export const GradeControls: React.FC<GradeControlsProps> = ({
  currentGradeIndex,
  totalGrades,
  goToPrevious,
  goToNext,
}) => {
  const isControlDisabled = totalGrades <= 1;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={goToPrevious}
        disabled={isControlDisabled}
        className="btn-secondary"
      >
        ← Anterior
      </button>

      <span className="font-semibold text-neutral-700 text-sm tabular-nums">
        Grade {currentGradeIndex + 1} de {totalGrades}
      </span>

      <button
        onClick={goToNext}
        disabled={isControlDisabled}
        className="btn-secondary"
      >
        Próxima →
      </button>
    </div>
  );
};
