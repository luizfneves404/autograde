import React from 'react';
import type { Grade, Course } from '@/types';
import { GradeViewer } from '@components/GradeViewer';
import { GradeControls } from '@components/GradeControls';
import { useGradeNavigation } from '@/hooks/useGradeNavigation';

interface GradeManagerProps {
  grades: Grade[];
  activeGrade: Grade | null;
  setActiveGrade: (grade: Grade | null) => void;
  allCourses: Record<string, Course>;
}

export const GradeManager: React.FC<GradeManagerProps> = ({
  grades,
  activeGrade,
  setActiveGrade,
  allCourses: allCourses,
}) => {
  const { currentGradeIndex, goToPrevious, goToNext } = useGradeNavigation({
    totalGrades: grades.length,
    onGradeChange: (index: number) => {
      setActiveGrade(grades[index] || null);
    },
  });

  if (grades.length === 0) {
    return (
      <div className="card-body">
        <h2 className="section-title mb-2">Grades Disponíveis</h2>
        <p className="text-neutral-600">
          Nenhuma grade disponível. As grades serão geradas automaticamente
          baseadas na lógica de otimização assim que você definir suas
          preferências e clicar em &quot;Gerar Grades&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 p-4 sm:p-6 rounded-lg border border-neutral-200 shadow-md">
      <div className="page-header">
        <h2 className="page-title mb-4 sm:mb-0">Grades Geradas</h2>
        <GradeControls
          currentGradeIndex={currentGradeIndex}
          totalGrades={grades.length}
          goToPrevious={goToPrevious}
          goToNext={goToNext}
        />
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-6">
        {activeGrade ? (
          <GradeViewer grade={activeGrade} allCourses={allCourses} />
        ) : (
          <p className="text-center text-neutral-500">
            Selecione uma grade para ver os detalhes.
          </p>
        )}
      </div>
    </div>
  );
};
