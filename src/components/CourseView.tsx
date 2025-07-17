import type { Course } from '@/types';

interface CourseViewProps {
  course: Course;
  allCourses: Record<string, Course>;
}

export function CourseView({ course, allCourses }: CourseViewProps) {
  const getNameByCode = (code: string) =>
    allCourses[code]?.name || `${code} (not found)`;

  const detailItem = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row">
      <strong className="w-full sm:w-1/3 text-neutral-600">{label}:</strong>
      <span className="w-full sm:w-2/3 text-neutral-800">{value}</span>
    </div>
  );

  return (
    <div className="flex-1">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-neutral-900">{course.name}</h3>
        <p className="text-md text-neutral-500">{course.code}</p>
      </div>

      <div className="space-y-3 text-sm">
        {detailItem('Créditos', course.numCredits)}
        {detailItem(
          'Requer pré-requisitos',
          course.shouldHavePreRequisites ? 'Sim' : 'Não',
        )}
        {detailItem(
          'Co-requisitos Unidirecionais',
          course.unidirCoRequisites.length > 0
            ? course.unidirCoRequisites.map(getNameByCode).join(', ')
            : 'Nenhum',
        )}
        {detailItem(
          'Co-requisitos Bidirecionais',
          course.bidirCoRequisites.length > 0
            ? course.bidirCoRequisites.map(getNameByCode).join(', ')
            : 'Nenhum',
        )}
      </div>
    </div>
  );
}
