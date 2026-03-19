import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Course, CourseClass } from "@/types";
import { parseCSVData } from "./csvParser";
import {
	availableCourses,
	evaluateClassAvailability,
	evaluateManualGrade,
	generateOptimizedGrades,
	minCreditLoad,
} from "./gradeOptimizer";

const targetCourses = [
	"INF1721",
	"INF1027",
	"INF1041",
	"ENG4011",
	"INF1407",
	"ENG4451",
	"INF1643",
	"ENG4421",
] as const;

const targetCourseSet = new Set<string>(targetCourses);

const officialCsvPath = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../assets/HORARIO_DAS_DISCIPLINAS_18032026.csv",
);

const officialCourses = parseCSVData(readFileSync(officialCsvPath));

const constrainedPreferences = [
	availableCourses([...targetCourses]),
	minCreditLoad(26),
];

const expectedOverrideCourseSignatures = [
	"ENG4011,ENG4421,ENG4451,INF1027,INF1041,INF1407,INF1643",
	"ENG4011,ENG4421,ENG4451,INF1027,INF1041,INF1407,INF1643,INF1721",
	"ENG4011,ENG4421,ENG4451,INF1027,INF1041,INF1407,INF1721",
	"ENG4011,ENG4421,ENG4451,INF1027,INF1041,INF1643,INF1721",
	"ENG4011,ENG4421,ENG4451,INF1027,INF1407,INF1643,INF1721",
	"ENG4011,ENG4421,ENG4451,INF1041,INF1407,INF1643,INF1721",
	"ENG4011,ENG4421,INF1027,INF1041,INF1407,INF1643,INF1721",
	"ENG4011,ENG4451,INF1027,INF1041,INF1407,INF1643,INF1721",
	"ENG4421,ENG4451,INF1027,INF1041,INF1407,INF1643,INF1721",
] as const;

function makeClass(overrides: Partial<CourseClass> = {}): CourseClass {
	return {
		classCode: "3WA",
		courseCode: "INF1001",
		professorName: "Ada",
		distanceHours: 0,
		SHFHours: 0,
		schedule: [{ day: "segunda", slot: { startHour: 9, endHour: 11 } }],
		offerings: [
			{
				classCode: "3WA",
				courseCode: "INF1001",
				destCode: "QQC",
				vacancyCount: 0,
			},
		],
		...overrides,
	};
}

function makeCourse(courseClass: CourseClass): Course {
	return {
		code: courseClass.courseCode,
		name: "Programacao 1",
		numCredits: 4,
		shouldHavePreRequisites: false,
		coRequisites: [],
		classes: [courseClass],
	};
}

describe("gradeOptimizer", () => {
	it("excludes classes without vacancies when the override is off", () => {
		const onlyClass = makeClass();
		const courses = {
			INF1001: makeCourse(onlyClass),
		};

		const grades = generateOptimizedGrades(courses, [], ["QQC"], false);

		expect(grades).toEqual([]);
	});

	it("includes classes without vacancies when the override is on", () => {
		const onlyClass = makeClass();
		const courses = {
			INF1001: makeCourse(onlyClass),
		};

		const grades = generateOptimizedGrades(courses, [], ["QQC"], true);

		expect(grades).toHaveLength(1);
		expect(grades[0]?.classes).toEqual([
			expect.objectContaining({
				courseCode: onlyClass.courseCode,
				classCode: onlyClass.classCode,
			}),
		]);
	});

	it("explains which class is blocked by missing vacancies", () => {
		const onlyClass = makeClass();

		const result = evaluateClassAvailability([onlyClass], ["QQC"], false);

		expect(result.satisfied).toBe(false);
		expect(result.reasons).toContain(
			"Turma INF1001-3WA nao possui vagas nos codigos de destino selecionados.",
		);
	});

	it("fails manual grade analysis when availability fails even if constraints pass", () => {
		const onlyClass = makeClass();
		const courses = {
			INF1001: makeCourse(onlyClass),
		};

		const result = evaluateManualGrade(
			[onlyClass],
			courses,
			[minCreditLoad(4)],
			["QQC"],
			false,
		);

		expect(result.satisfied).toBe(false);
		expect(result.reasons).toContain(
			"Turma INF1001-3WA nao possui vagas nos codigos de destino selecionados.",
		);
	});

	it("cannot reach 26 credits from the official CSV subset when zero-vacancy classes are excluded", () => {
		const grades = generateOptimizedGrades(
			officialCourses,
			constrainedPreferences,
			["CEG", "QQC"],
			false,
		);

		expect(grades).toEqual([]);
	});

	it("returns all valid 26-credit schedules from the official CSV subset when the vacancy override is enabled", () => {
		const grades = generateOptimizedGrades(
			officialCourses,
			constrainedPreferences,
			["CEG", "QQC"],
			true,
		);

		const courseSignatures = grades.map((grade) =>
			grade.classes
				.map((cls) => cls.courseCode)
				.sort()
				.join(","),
		);
		const classSignatures = grades.map((grade) =>
			grade.classes
				.map((cls) => `${cls.courseCode}-${cls.classCode}`)
				.sort()
				.join(","),
		);

		expect(grades).toHaveLength(80);
		expect([...new Set(courseSignatures)].sort()).toEqual(
			expectedOverrideCourseSignatures,
		);
		expect(new Set(classSignatures)).toHaveLength(grades.length);

		for (const grade of grades) {
			const courseCodes = grade.classes.map((cls) => cls.courseCode);
			const totalCredits = grade.classes.reduce(
				(sum, cls) => sum + (officialCourses[cls.courseCode]?.numCredits ?? 0),
				0,
			);
			const manualCheck = evaluateManualGrade(
				grade.classes,
				officialCourses,
				constrainedPreferences,
				["CEG", "QQC"],
				true,
			);

			expect(courseCodes.every((code) => targetCourseSet.has(code))).toBe(true);
			expect(new Set(courseCodes)).toHaveLength(courseCodes.length);
			expect(totalCredits).toBeGreaterThanOrEqual(26);
			expect(totalCredits).toBeLessThanOrEqual(30);
			expect(manualCheck.satisfied).toBe(true);
			expect(manualCheck.reasons).toContain("All AND conditions are satisfied");
		}
	});
});
