import type { Course, Schedule, DayOfWeek } from '@/types';
// No longer need createClassKey if we aren't creating a flat dictionary
// import { createClassKey } from '@/utils/keys';

/**
 * Parses a denormalized CSV string into a purely nested data structure of courses.
 * This function treats the nested structure as the single source of truth.
 *
 * @param csvContent The raw string content from the CSV file.
 * @returns A dictionary of courses, with classes and offerings nested within.
 */
export const parseCSVData = (csvContent: string): Record<string, Course> => {
  const courses: Record<string, Course> = {};

  const lines = csvContent.split('\n');

  let dataStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Disciplina,Nome da disciplina,Professor')) {
      dataStartIndex = i + 1;
      break;
    }
  }

  if (dataStartIndex === -1) {
    throw new Error(
      'CSV header not found. Please ensure you are using a valid class schedule CSV file.',
    );
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const parts = line.split(',');
      if (parts.length < 13) continue;

      const [
        courseCode,
        courseName,
        professorName,
        numCreditos,
        classCode,
        destCode,
        vacancyCount,
        _,
        horarioSala,
        distanceHours,
        SHFHours,
        __,
        preReq,
      ] = parts.map((p) => p.trim());

      const cleanCourseCode = courseCode.replace(/[^A-Z0-9]/g, '');
      const cleanClassCode = classCode.trim();

      if (!cleanCourseCode || !cleanClassCode) continue;

      // 1. Get or Create the Course
      if (!courses[cleanCourseCode]) {
        courses[cleanCourseCode] = {
          code: cleanCourseCode,
          name: courseName.trim(),
          numCredits: parseInt(numCreditos, 10) || 0,
          shouldHavePreRequisites:
            preReq?.toLowerCase().includes('sim') || false,
          bidirCoRequisites: [],
          unidirCoRequisites: [],
          classes: [],
        };
      }
      const course = courses[cleanCourseCode];

      // 2. Get or Create the Class (CourseClass) within the Course
      let courseClass = course.classes.find(
        (c) => c.classCode === cleanClassCode,
      );

      if (!courseClass) {
        courseClass = {
          classCode: cleanClassCode,
          courseCode: cleanCourseCode,
          professorName: professorName.trim(),
          schedule: parseScheduleFromCSV(horarioSala),
          distanceHours: parseInt(distanceHours, 10) || 0,
          SHFHours: parseInt(SHFHours, 10) || 0,
          offerings: [],
        };
        course.classes.push(courseClass);
      }

      // 3. Add the Class Offering to the Class
      courseClass.offerings.push({
        classCode: cleanClassCode,
        courseCode: cleanCourseCode,
        destCode: destCode.trim(),
        vacancyCount: parseInt(vacancyCount, 10) || 0,
      });
    } catch (error) {
      console.warn(
        `Skipping line due to error: ${error instanceof Error ? error.message : String(error)}`,
        { line: i + 1 },
      );
    }
  }

  return courses;
};

/**
 * Parses a schedule string (e.g., "SEG 8-10 QUI 8-10") into a structured array.
 * This function remains unchanged.
 */
export const parseScheduleFromCSV = (horarioSala: string): Schedule => {
  const schedule: Schedule = [];
  if (!horarioSala || horarioSala.trim() === '') return schedule;

  const dayMap: Record<string, DayOfWeek> = {
    SEG: 'segunda',
    TER: 'terça',
    QUA: 'quarta',
    QUI: 'quinta',
    SEX: 'sexta',
    SAB: 'sábado',
  };

  const timeBlocks = horarioSala
    .split(/\s{2,}/)
    .filter((block) => block.trim());

  for (const block of timeBlocks) {
    try {
      const match = block.trim().match(/^([A-Z]{3})\s+(\d{1,2})-(\d{1,2})/);
      if (match) {
        const [, dayStr, startStr, endStr] = match;
        const day = dayMap[dayStr];
        const startHour = parseInt(startStr, 10);
        const endHour = parseInt(endStr, 10);

        if (
          day &&
          !isNaN(startHour) &&
          !isNaN(endHour) &&
          startHour < endHour
        ) {
          schedule.push({ day, slot: { startHour, endHour } });
        }
      }
    } catch (error) {
      console.warn(`Error parsing schedule block "${block}":`, error);
    }
  }

  return schedule;
};
