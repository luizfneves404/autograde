import { useMemo } from 'react';
import type { Grade, CourseClass, Course } from '@/types';

interface UseGradeScheduleParams {
  grade: Grade;
  allCourses: Record<string, Course>;
}

export function useGradeSchedule({
  grade,
  allCourses,
}: UseGradeScheduleParams) {
  return useMemo(() => {
    const scheduleMap = new Map<string, CourseClass>();

    let minHour = 23;
    let maxHour = 7;

    grade.classes.forEach((courseClass) => {
      courseClass.schedule.forEach((classTime) => {
        for (
          let hour = classTime.slot.startHour;
          hour < classTime.slot.endHour;
          hour++
        ) {
          const key = `${classTime.day}-${hour}`;
          scheduleMap.set(key, courseClass);

          if (hour < minHour) minHour = hour;
          if (hour >= maxHour) maxHour = hour + 1;
        }
      });
    });

    const hourSlots = Array.from(
      { length: Math.max(0, maxHour - minHour) },
      (_, i) => minHour + i,
    );

    const totalCreditos = grade.classes.reduce((sum, courseClass) => {
      const course = allCourses[courseClass.courseCode];
      return sum + (course?.numCredits || 0);
    }, 0);

    return { scheduleMap, hourSlots, totalCreditos };
  }, [grade, allCourses]);
}
