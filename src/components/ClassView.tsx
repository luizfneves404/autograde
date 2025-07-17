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

        {/* --- Offerings List --- */}
        {/* Render the list of offerings for this class */}
        {courseClass.offerings.length > 0 && (
          <div>
            <strong className="font-medium">Ofertas:</strong>
            <ul className="pl-5 mt-1 list-disc list-inside">
              {courseClass.offerings.map((offering, index) => (
                // Use index in the key for safety, in case destCode is not unique
                <li key={`${offering.destCode}-${index}`}>
                  {offering.vacancyCount} vagas para{' '}
                  {offering.destCode || 'Geral'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
