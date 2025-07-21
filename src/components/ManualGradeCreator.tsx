import React, { useMemo, useState } from 'react';
import type { Grade, Course, PreferenceSet, CourseClass } from '@/types';
import SearchAndAdd from './SearchAndAdd';
import { GradeViewer } from './GradeViewer';
import {
  explain,
  type EvaluationResult,
  enrichClass,
} from '@/utils/gradeOptimizer';

interface ManualGradeCreatorProps {
  allCourses: Record<string, Course>;
  availableClasses: CourseClass[];
  preferenceSet: PreferenceSet;
}

export const ManualGradeCreator: React.FC<ManualGradeCreatorProps> = ({
  allCourses,
  availableClasses,
  preferenceSet,
}) => {
  const [selectedClasses, setSelectedClasses] = useState<CourseClass[]>([]);

  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);

  const displayGrade: Grade = {
    classes: selectedClasses,
  };

  const classMap = useMemo(() => {
    return new Map<string, CourseClass>(
      availableClasses.map((c) => {
        return [`${c.courseCode}-${c.classCode}`, c];
      }),
    );
  }, [availableClasses]);

  const handleCheckPreferences = () => {
    const evaluation = explain(
      {
        op: 'and',
        children: preferenceSet.hardConstraints.map((c) => c.expression),
      },
      displayGrade.classes.map((c) => enrichClass(c, allCourses)),
    );
    setEvaluationResult(evaluation);
  };

  React.useEffect(() => {
    setEvaluationResult(null);
  }, [selectedClasses]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Panel: Controls for building the grade */}
      <div className="lg:w-1/3 card-body">
        <h2 className="section-title mb-4">Montar Grade</h2>
        <div className="space-y-6">
          <SearchAndAdd
            label="Adicionar Turmas"
            placeholder="Buscar por código da disciplina e turma..."
            allItems={availableClasses.map((c) => {
              return `${c.courseCode}-${c.classCode}`;
            })}
            selectedItems={selectedClasses.map((c) => {
              return `${c.courseCode}-${c.classCode}`;
            })}
            onSelectionChange={(newSelection: string[]) => {
              const selected = newSelection.flatMap((id) => {
                const foundClass = classMap.get(id);
                return foundClass ? [foundClass] : [];
              });
              setSelectedClasses(selected);
            }}
          />
          <button
            onClick={handleCheckPreferences}
            className="btn btn-primary w-full"
            disabled={selectedClasses.length === 0}
          >
            Analisar Preferências
          </button>
        </div>
      </div>

      {/* Right Panel: Display for the schedule and violations */}
      <div className="lg:w-2/3 bg-neutral-50 p-4 sm:p-6 rounded-lg border border-neutral-200 shadow-md min-h-[30rem]">
        <h2 className="page-title mb-4">Visualização da Grade</h2>
        {selectedClasses.length > 0 ? (
          <>
            <div className="border-t border-neutral-200 pt-6">
              <GradeViewer grade={displayGrade} allCourses={allCourses} />
            </div>
            {evaluationResult && (
              <div className="mt-6 border-t border-neutral-200 pt-6">
                <h3 className="text-lg font-semibold mb-3 text-neutral-800">
                  Resultado da Análise de Preferências
                </h3>
                <p className="text-neutral-600">
                  {evaluationResult.status === 'SATISFIED'
                    ? 'As preferências foram atendidas.'
                    : 'As preferências não foram atendidas.'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-700">
                  {evaluationResult.reasons.map((r, index) => (
                    <li key={index} className="text-sm">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-500 text-center py-10">
              Adicione disciplinas para começar a montar sua grade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
