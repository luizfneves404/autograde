import type { CourseClass } from '@/types';
import { formatSchedule } from '@utils/formatters';

interface ClassViewProps {
  courseClass: CourseClass;
}

export function ClassView({ courseClass }: ClassViewProps) {
  return (
    <div>
      <div className="mb-2">
        <strong className="font-semibold text-neutral-800">
          {courseClass.classCode}
        </strong>
      </div>

      <div className="text-sm text-neutral-600 space-y-1">
        {/* Class-level details that are always present */}
        <p>
          <strong>Professor:</strong> {courseClass.professorName}
        </p>
        <p>
          <strong>Horário:</strong> {formatSchedule(courseClass.schedule)}
        </p>
      </div>
    </div>
  );
}
