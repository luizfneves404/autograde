import React from 'react';
import type { Grade, DayOfWeek, Course } from '@/types';
import { DAYS } from '@/constants';
import { useGradeSchedule } from '@/hooks/useGradeSchedule';

interface GradeViewerProps {
  grade: Grade;
  allCourses: Record<string, Course>;
}

const DAY_NAMES: Record<DayOfWeek, string> = {
  segunda: 'Segunda',
  terça: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sábado: 'Sábado',
};

export const GradeViewer: React.FC<GradeViewerProps> = ({
  grade,
  allCourses,
}) => {
  const { scheduleMap, hourSlots, totalCreditos } = useGradeSchedule({
    grade,
    allCourses,
  });

  const renderCell = (day: DayOfWeek, hour: number) => {
    const key = `${day}-${hour}`;
    const courseClass = scheduleMap.get(key);

    if (!courseClass) {
      return <td key={key} className="table-cell h-16 bg-neutral-50/50" />;
    }

    return (
      <td
        key={key}
        className="table-cell h-16 text-center bg-white align-middle"
      >
        <div className="font-bold text-sm text-primary-700">
          {courseClass.courseCode}
        </div>
        <div className="text-xs text-neutral-600">{courseClass.classCode}</div>
      </td>
    );
  };

  return (
    <div className="card-body">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-neutral-800">
          Detalhes da Grade -{' '}
          <span className="text-primary-600">
            Pontuação: {grade.score.toFixed(2)}
          </span>
        </h3>
        <p className="text-md text-neutral-600">
          <strong>Número de créditos:</strong> {totalCreditos}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="table-header">
              <th className="table-cell-header text-left">Hora</th>
              {DAYS.map((day) => (
                <th key={day} className="table-cell-header text-center">
                  {DAY_NAMES[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourSlots.map((hour) => (
              <tr key={hour}>
                <td className="table-cell-header text-center align-middle">
                  {`${hour}:00 - ${hour + 1}:00`}
                </td>
                {DAYS.map((day) => renderCell(day, hour))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
