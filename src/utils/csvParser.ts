import type { Course, Schedule, DayOfWeek } from '@/types';

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
  for (const [i, line] of lines.entries()) {
    const trimmedLine = line.trim();
    if (trimmedLine.includes('Disciplina,Nome da disciplina,Professor')) {
      dataStartIndex = i + 1;
      break;
    }
  }

  if (dataStartIndex === -1) {
    throw new Error(
      'CSV header not found. Please ensure you are using a valid class schedule CSV file.',
    );
  }

  for (const [i, line] of lines.slice(dataStartIndex).entries()) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    try {
      const parts = trimmedLine.split(',');

      const [
        courseCode,
        courseName,
        professorName,
        numCredits,
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
      if (
        !courseCode ||
        !courseName ||
        !professorName ||
        !numCredits ||
        !classCode ||
        !destCode ||
        !vacancyCount ||
        !horarioSala ||
        !distanceHours ||
        !SHFHours ||
        !preReq
      ) {
        throw new Error('Invalid line');
      }

      const cleanCourseCode = courseCode.replace(/[^A-Z0-9]/g, '');
      const cleanClassCode = classCode.trim();

      if (!cleanCourseCode || !cleanClassCode) {
        throw new Error('Invalid line');
      }

      if (!courses[cleanCourseCode]) {
        courses[cleanCourseCode] = {
          code: cleanCourseCode,
          name: courseName.trim(),
          numCredits: parseInt(numCredits, 10) || 0,
          shouldHavePreRequisites:
            preReq.toLowerCase().includes('sim') || false,
          bidirCoRequisites: [],
          unidirCoRequisites: [],
          classes: [],
        };
      }
      const course = courses[cleanCourseCode];

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

const dayMap: Record<string, DayOfWeek> = {
  SEG: 'segunda',
  TER: 'terça',
  QUA: 'quarta',
  QUI: 'quinta',
  SEX: 'sexta',
  SAB: 'sábado',
};

/**
 * Parses a schedule string (e.g., "SEG 8-10 QUI 8-10") into a structured array.
 * This function remains unchanged.
 */
export const parseScheduleFromCSV = (horarioSala: string): Schedule => {
  if (!horarioSala.trim()) {
    return [];
  }

  const timeBlocks = horarioSala.split(/\s{2,}/).filter(Boolean);

  return timeBlocks.reduce<Schedule>((schedule, block) => {
    try {
      const match = block.trim().match(/^([A-Z]{3})\s+(\d{1,2})-(\d{1,2})$/);

      if (!match) {
        return schedule;
      }

      const [, dayAbbr, startStr, endStr] = match;
      if (!dayAbbr || !startStr || !endStr) {
        throw new Error('Invalid schedule string');
      }

      const startHour = parseInt(startStr, 10);
      const endHour = parseInt(endStr, 10);

      if (
        dayMap[dayAbbr] &&
        !isNaN(startHour) &&
        !isNaN(endHour) &&
        startHour < endHour
      ) {
        const day = dayMap[dayAbbr];
        schedule.push({ day, slot: { startHour, endHour } });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`Error parsing block "${block}": ${error.message}`);
      } else {
        console.warn(`An unknown error occurred parsing block "${block}"`);
      }
    }

    return schedule;
  }, []);
};
