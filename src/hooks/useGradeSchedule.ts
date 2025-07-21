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

    // Populate the schedule map from the grade's classes
    grade.classes.forEach((courseClass) => {
      courseClass.schedule.forEach((classTime) => {
        for (
          let hour = classTime.slot.startHour;
          hour < classTime.slot.endHour;
          hour++
        ) {
          const key = `${classTime.day}-${hour.toString()}`;
          scheduleMap.set(key, courseClass);
        }
      });
    });

    // Always generate hour slots from 7 to 22 (for a 7-23h view)
    const hourSlots = Array.from({ length: 23 - 7 }, (_, i) => 7 + i);

    // Calculate the total number of credits
    const totalCreditos = grade.classes.reduce((sum, courseClass) => {
      const course = allCourses[courseClass.courseCode];
      return sum + (course?.numCredits || 0);
    }, 0);

    return { scheduleMap, hourSlots, totalCreditos };
  }, [grade, allCourses]);
}
