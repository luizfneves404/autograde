import { describe, expect, it } from "vitest";
import type { Course, CourseClass } from "@/types";
import {
	evaluateClassAvailability,
	evaluateManualGrade,
	generateOptimizedGrades,
	minCreditLoad,
} from "./gradeOptimizer";

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
});
