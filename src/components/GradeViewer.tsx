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
    const key = `${day}-${hour.toString()}`;
    const courseClass = scheduleMap.get(key);

    if (!courseClass) {
      return <td key={key} className="p-1 bg-gray-50/50" />;
    }

    return (
      <td key={key} className="p-1 text-center bg-white">
        <div className="font-bold text-xs text-primary-700 leading-tight break-all">
          {courseClass.courseCode}
        </div>
        <div className="text-xs text-neutral-600 leading-tight break-all">
          {courseClass.classCode}
        </div>
      </td>
    );
  };

  return (
    <div className="card-body">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-neutral-800">
          Detalhes da Grade
        </h3>
        <p className="text-md text-neutral-600">
          <strong>Número de créditos:</strong> {totalCreditos}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="text-left">Hora</th>
              {DAYS.map((day) => (
                <th key={day} className="text-center">
                  {DAY_NAMES[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourSlots.map((hour) => (
              <tr key={hour}>
                <td className="p-2 font-semibold text-center text-gray-700 bg-gray-100">
                  {`${hour.toString()}:00 - ${(hour + 1).toString()}:00`}
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
