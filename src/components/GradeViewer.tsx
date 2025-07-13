import React from 'react';
import type { Grade, DayOfWeek, Disciplina } from '@/types';
import { DAYS } from '@/constants';
import { useGradeSchedule } from '@/hooks/useGradeSchedule';

interface GradeViewerProps {
  grade: Grade;
  allDisciplinas: Disciplina[];
}

const DAY_NAMES: Record<DayOfWeek, string> = {
  segunda: 'Segunda',
  terça: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sábado: 'Sábado',
};

export const GradeViewer: React.FC<GradeViewerProps> = ({ grade, allDisciplinas }) => {
  const { scheduleMap, hourSlots, totalCreditos } = useGradeSchedule({
    grade,
    allDisciplinas,
  });

  const renderCell = (day: DayOfWeek, hour: number) => {
    const key = `${day}-${hour}`;
    const turma = scheduleMap.get(key);

    if (!turma) {
      return <td key={key} className="table-cell h-16 bg-neutral-50/50" />;
    }

    return (
      <td key={key} className="table-cell h-16 text-center bg-white align-middle">
        <div className="font-bold text-sm text-primary-700">{turma.disciplinaCode}</div>
        <div className="text-xs text-neutral-600">{turma.turmaCode}</div>
      </td>
    );
  };

  return (
    <div className="card-body">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-neutral-800">
          Detalhes da Grade - <span className="text-primary-600">Pontuação: {grade.score.toFixed(2)}</span>
        </h3>
        <p className="text-md text-neutral-600">
          <strong>Número de créditos:</strong> {totalCreditos}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="table-header">
              <th className="table-cell-header text-left">
                Hora
              </th>
              {DAYS.map(day => (
                <th key={day} className="table-cell-header text-center">
                  {DAY_NAMES[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourSlots.map(hour => (
              <tr key={hour}>
                <td className="table-cell-header text-center align-middle">
                  {`${hour}:00 - ${hour + 1}:00`}
                </td>
                {DAYS.map(day => renderCell(day, hour))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
