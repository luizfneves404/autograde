// import { describe, it, expect, beforeEach } from 'vitest';
// import { generateOptimizedGrades } from './gradeOptimizer';
// import type { CourseClass, Course, PreferenceSet } from '@/types';

// // --- Mock Data Setup ---
// // By defining our test data centrally, we make tests cleaner and easier to maintain.

// const MOCK_DISCIPLINAS = {
//   CS101: {
//     code: 'CS101',
//     name: 'Intro to CS',
//     numCredits: 4,
//     possoPuxar: true,
//     shouldHavePreRequisites: false,
//     bidirCoRequisites: [],
//     unidirCoRequisites: [],
//   } as Course,
//   MA101: {
//     code: 'MA101',
//     name: 'Math 1',
//     numCredits: 4,
//     possoPuxar: true,
//     shouldHavePreRequisites: false,
//     bidirCoRequisites: [],
//     unidirCoRequisites: [],
//   } as Course,
//   PH101: {
//     code: 'PH101',
//     name: 'Physics 1',
//     numCredits: 6,
//     possoPuxar: true,
//     shouldHavePreRequisites: false,
//     bidirCoRequisites: [],
//     unidirCoRequisites: [],
//   } as Course,
// };

// const createTurma = (
//   turmaCode: string,
//   disciplinaCode: string,
//   teacherName: string,
//   schedule: CourseClass['schedule'],
// ): CourseClass => ({
//   classCode: turmaCode,
//   courseCode: disciplinaCode,
//   teacherName,
//   schedule,
//   destCode: 'CIC',
//   numVagas: 30,
//   distanceHours: 0,
//   SHFHours: 0,
// });

// // --- Test Suite ---

// describe('generateOptimizedGrades', () => {
//   let allDisciplinas: Record<string, Course>;

//   // Use beforeEach to reset common data for each test, ensuring test isolation.
//   beforeEach(() => {
//     allDisciplinas = MOCK_DISCIPLINAS;
//   });

//   it('should return an empty array if no turmas are provided', () => {
//     const result = generateOptimizedGrades([], allDisciplinas, null);
//     expect(result).toEqual([]);
//   });

//   it('should generate a single grade for a single disciplina with one valid turma', () => {
//     const turmas: CourseClass[] = [
//       createTurma('T1', 'CS101', 'Dr. Smith', [
//         { day: 'segunda', slot: { startHour: 10, endHour: 12 } },
//       ]),
//     ];
//     const result = generateOptimizedGrades(turmas, allDisciplinas, null);

//     expect(result).toHaveLength(1);
//     expect(result[0].classes).toHaveLength(1);
//     expect(result[0].classes[0].classCode).toBe('T1');
//   });

//   it('should correctly generate grades that avoid time conflicts', () => {
//     const turmas: CourseClass[] = [
//       createTurma('T1', 'CS101', 'Dr. Smith', [
//         { day: 'segunda', slot: { startHour: 10, endHour: 12 } },
//       ]),
//       // This turma conflicts with T1
//       createTurma('T2', 'MA101', 'Dr. Jones', [
//         { day: 'segunda', slot: { startHour: 11, endHour: 13 } },
//       ]),
//       // This turma does not conflict with T1
//       createTurma('T3', 'MA101', 'Dr. Who', [
//         { day: 'terça', slot: { startHour: 10, endHour: 12 } },
//       ]),
//     ];
//     const result = generateOptimizedGrades(turmas, allDisciplinas, null);

//     // The optimizer should find the combination of T1 and T3.
//     const bestGrade = result[0];
//     const turmaCodes = bestGrade.classes.map((t) => t.classCode).sort();

//     expect(result).toHaveLength(1); // Assuming it finds the single best non-conflicting combination
//     expect(turmaCodes).toEqual(['T1', 'T3']);
//   });

//   it('should respect a "require_disciplinas" hard constraint', () => {
//     const turmas: CourseClass[] = [
//       createTurma('T1', 'CS101', 'Dr. Smith', []),
//       createTurma('T2', 'MA101', 'Dr. Jones', []),
//     ];
//     const preferences: PreferenceSet = {
//       id: 'pref1',
//       name: 'Test Prefs',
//       description: '',
//       globalSettings: { softConstraintAggregation: 'sum', maxViolations: 0 },
//       preferences: [
//         {
//           id: 'p1',
//           kind: 'require_disciplinas',
//           type: 'hard',
//           enabled: true,
//           disciplinaCodes: ['CS101'],
//         },
//       ],
//     };
//     const result = generateOptimizedGrades(turmas, allDisciplinas, preferences);

//     // Every resulting grade must contain CS101 and nothing else.
//     expect(result).toHaveLength(1);
//     expect(result[0].classes.every((t) => t.courseCode === 'CS101')).toBe(true);
//     expect(result[0].classes.some((t) => t.courseCode === 'MA101')).toBe(false);
//   });

//   it('should respect an "avoid_disciplinas" hard constraint', () => {
//     const turmas: CourseClass[] = [
//       createTurma('T1', 'CS101', 'Dr. Smith', []),
//       createTurma('T2', 'MA101', 'Dr. Jones', []),
//     ];
//     const preferences: PreferenceSet = {
//       id: 'pref1',
//       name: 'Test Prefs',
//       description: '',
//       globalSettings: { softConstraintAggregation: 'sum', maxViolations: 0 },
//       preferences: [
//         {
//           id: 'p1',
//           kind: 'avoid_disciplinas',
//           type: 'hard',
//           enabled: true,
//           disciplinaCodes: ['MA101'],
//         },
//       ],
//     };
//     const result = generateOptimizedGrades(turmas, allDisciplinas, preferences);

//     // No resulting grade should contain MA101.
//     expect(
//       result.every((grade) =>
//         grade.classes.every((t) => t.courseCode !== 'MA101'),
//       ),
//     ).toBe(true);
//     // At least one grade should contain the non-avoided disciplina.
//     expect(
//       result.some((grade) =>
//         grade.classes.some((t) => t.courseCode === 'CS101'),
//       ),
//     ).toBe(true);
//   });

//   it('should apply a "prefer_teacher" soft preference correctly', () => {
//     const turmas: CourseClass[] = [
//       createTurma('T1', 'CS101', 'Dr. Smith', []),
//       createTurma('T2', 'CS101', 'Dr. Jones', []), // The preferred teacher
//     ];
//     const preferences: PreferenceSet = {
//       id: 'pref1',
//       name: 'Test Prefs',
//       description: '',
//       globalSettings: { softConstraintAggregation: 'sum', maxViolations: 0 },
//       preferences: [
//         {
//           id: 'p1',
//           kind: 'prefer_teacher',
//           type: 'soft',
//           enabled: true,
//           teacherNames: ['Dr. Jones'],
//           weight: 10,
//         },
//       ],
//     };
//     // Assuming generateOptimizedGrades returns grades sorted by score
//     const result = generateOptimizedGrades(turmas, allDisciplinas, preferences);

//     expect(result).toHaveLength(2); // Both options are valid, but one is better.
//     expect(result[0].classes[0].teacherName).toBe('Dr. Jones');
//     expect(result[0].score).toBeGreaterThan(result[1].score);
//   });

//   it('should respect a "credit_load" hard constraint', () => {
//     const turmas: CourseClass[] = [
//       createTurma('T1', 'CS101', 'Dr. Smith', [
//         { day: 'segunda', slot: { startHour: 8, endHour: 10 } },
//       ]), // 4 credits
//       createTurma('T2', 'MA101', 'Dr. Jones', [
//         { day: 'terça', slot: { startHour: 8, endHour: 10 } },
//       ]), // 4 credits
//       createTurma('T3', 'PH101', 'Dr. Brown', [
//         { day: 'quarta', slot: { startHour: 8, endHour: 10 } },
//       ]), // 6 credits
//     ];
//     const preferences: PreferenceSet = {
//       id: 'pref1',
//       name: 'Test Prefs',
//       description: '',
//       globalSettings: { softConstraintAggregation: 'sum', maxViolations: 0 },
//       preferences: [
//         {
//           id: 'p1',
//           kind: 'credit_load',
//           type: 'hard',
//           enabled: true,
//           min: 8,
//           max: 12,
//         },
//       ],
//     };
//     const result = generateOptimizedGrades(turmas, allDisciplinas, preferences);

//     // Expected valid combinations: CS101+MA101 (8), CS101+PH101 (10), MA101+PH101 (10)
//     expect(result.length).toBeGreaterThan(0);
//     result.forEach((grade) => {
//       const totalCredits = grade.classes.reduce(
//         (sum, t) => sum + (allDisciplinas[t.courseCode].numCredits ?? 0),
//         0,
//       );
//       expect(totalCredits).toBeGreaterThanOrEqual(8);
//       expect(totalCredits).toBeLessThanOrEqual(12);
//     });
//   });
// });
