import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Course, CourseClass, DayOfWeek, ExprNode } from "@/types";
import {
	availableCourses,
	enrichClass,
	evaluateClassAvailability,
	evaluateConstraint,
	evaluateManualGrade,
	forbidClassesOnDays,
	generateOptimizedGrades,
	maxCreditLoad,
	minCreditLoad,
	minimumCoursesSet,
	noGapsByDay,
} from "./gradeOptimizer";

const propertyConfig = {
	numRuns: 100,
	seed: 20260319,
};

const optimizerPropertyConfig = {
	numRuns: 50,
	seed: 20260320,
};

const dayOfWeekValues = [
	"segunda",
	"terça",
	"quarta",
	"quinta",
	"sexta",
	"sábado",
] as const satisfies readonly DayOfWeek[];

const destCodeValues = ["QQC", "CEG", "MEC"] as const;

type CatalogScenario = {
	courses: Record<string, Course>;
	courseCodes: string[];
	flatClasses: CourseClass[];
};

type ManualScenario = CatalogScenario & {
	selectedClasses: CourseClass[];
	userDestCodes: string[];
	ignoreLackOfVacancies: boolean;
	userPreferences: ExprNode[];
};

type ConstraintScenario = CatalogScenario & {
	selectedClasses: CourseClass[];
	node: ExprNode;
};

function buildCourseCode(index: number): string {
	return `INF${(1000 + index).toString()}`;
}

function buildClassCode(index: number): string {
	return `${index.toString()}WA`;
}

function totalCredits(
	classes: readonly CourseClass[],
	courses: Readonly<Record<string, Course>>,
): number {
	return classes.reduce((sum, courseClass) => {
		return sum + (courses[courseClass.courseCode]?.numCredits ?? 0);
	}, 0);
}

function hasDuplicateCourseCodes(classes: readonly CourseClass[]): boolean {
	return (
		new Set(classes.map((courseClass) => courseClass.courseCode)).size !==
		classes.length
	);
}

function hasOverlappingSchedules(classes: readonly CourseClass[]): boolean {
	for (const [index, courseClass] of classes.entries()) {
		for (const otherClass of classes.slice(index + 1)) {
			for (const left of courseClass.schedule) {
				for (const right of otherClass.schedule) {
					if (
						left.day === right.day &&
						left.slot.startHour < right.slot.endHour &&
						left.slot.endHour > right.slot.startHour
					) {
						return true;
					}
				}
			}
		}
	}

	return false;
}

function hasMissingCoRequisites(
	classes: readonly CourseClass[],
	courses: Readonly<Record<string, Course>>,
): boolean {
	const selectedCodes = new Set(
		classes.map((courseClass) => courseClass.courseCode),
	);

	return classes.some((courseClass) =>
		(courses[courseClass.courseCode]?.coRequisites ?? []).some(
			(coRequisite) => !selectedCodes.has(coRequisite),
		),
	);
}

function buildManualConstraintNode(
	userPreferences: readonly ExprNode[],
): ExprNode {
	return {
		op: "and",
		children: [maxCreditLoad(30), ...userPreferences],
	};
}

const dayArb = fc.constantFrom(...dayOfWeekValues);

const timeArb = fc
	.record({
		day: dayArb,
		startHour: fc.integer({ min: 7, max: 18 }),
		duration: fc.integer({ min: 1, max: 3 }),
	})
	.map(({ day, startHour, duration }) => ({
		day,
		slot: {
			startHour,
			endHour: startHour + duration,
		},
	}));

function classArb(courseCode: string): fc.Arbitrary<CourseClass> {
	return fc
		.record({
			classIndex: fc.integer({ min: 1, max: 9 }),
			professorName: fc.string({ minLength: 1, maxLength: 8 }),
			distanceHours: fc.integer({ min: 0, max: 4 }),
			shfHours: fc.integer({ min: 0, max: 4 }),
			schedule: fc.array(timeArb, { minLength: 1, maxLength: 3 }),
			offerings: fc.uniqueArray(
				fc.record({
					destCode: fc.constantFrom(...destCodeValues),
					vacancyCount: fc.integer({ min: 0, max: 3 }),
				}),
				{
					minLength: 1,
					maxLength: destCodeValues.length,
					selector: (offering) => offering.destCode,
				},
			),
		})
		.map(
			({
				classIndex,
				professorName,
				distanceHours,
				shfHours,
				schedule,
				offerings,
			}) => ({
				classCode: buildClassCode(classIndex),
				courseCode,
				professorName,
				distanceHours,
				SHFHours: shfHours,
				schedule,
				offerings: offerings.map((offering) => ({
					classCode: buildClassCode(classIndex),
					courseCode,
					destCode: offering.destCode,
					vacancyCount: offering.vacancyCount,
				})),
			}),
		);
}

const catalogArb: fc.Arbitrary<CatalogScenario> = fc
	.integer({ min: 1, max: 4 })
	.chain((courseCount) => {
		const courseCodes = Array.from({ length: courseCount }, (_, index) =>
			buildCourseCode(index + 1),
		);
		const courseArbs = courseCodes.map((courseCode) =>
			fc
				.record({
					numCredits: fc.integer({ min: 2, max: 8 }),
					shouldHavePreRequisites: fc.boolean(),
					coRequisites: fc.subarray(
						courseCodes.filter((candidate) => candidate !== courseCode),
						{ maxLength: Math.max(0, courseCount - 1) },
					),
					classCount: fc.integer({ min: 1, max: 3 }),
				})
				.chain(
					({
						numCredits,
						shouldHavePreRequisites,
						coRequisites,
						classCount,
					}) => {
						const classesArb = fc.tuple(
							...Array.from({ length: classCount }, (_, index) =>
								classArb(courseCode).map((courseClass) => ({
									...courseClass,
									classCode: buildClassCode(index + 1),
									offerings: courseClass.offerings.map((offering) => ({
										...offering,
										classCode: buildClassCode(index + 1),
									})),
								})),
							),
						);

						return classesArb.map(
							(classes): Course => ({
								code: courseCode,
								name: `Course ${courseCode}`,
								numCredits,
								shouldHavePreRequisites,
								coRequisites,
								classes,
							}),
						);
					},
				),
		);

		return fc.tuple(...courseArbs).map((coursesArray) => {
			const courses = Object.fromEntries(
				coursesArray.map((course) => [course.code, course]),
			) as Record<string, Course>;

			return {
				courses,
				courseCodes,
				flatClasses: coursesArray.flatMap((course) => course.classes),
			};
		});
	});

function userPreferencesArb(
	courseCodes: readonly string[],
): fc.Arbitrary<ExprNode[]> {
	return fc
		.subarray(courseCodes, {
			minLength: 1,
			maxLength: courseCodes.length,
		})
		.chain((allowedCourseCodes) =>
			fc
				.record({
					requiredCourseCodes: fc.subarray(allowedCourseCodes, {
						maxLength: Math.min(2, allowedCourseCodes.length),
					}),
					minCredits: fc.integer({ min: 0, max: 12 }),
					maxCredits: fc.integer({ min: 12, max: 30 }),
					forbiddenDays: fc.subarray(dayOfWeekValues, { maxLength: 2 }),
					includeNoGaps: fc.boolean(),
				})
				.map(
					({
						requiredCourseCodes,
						minCredits,
						maxCredits,
						forbiddenDays,
						includeNoGaps,
					}) => {
						const preferences: ExprNode[] = [
							availableCourses([...allowedCourseCodes]),
							minCreditLoad(minCredits),
							maxCreditLoad(maxCredits),
						];

						if (requiredCourseCodes.length > 0) {
							preferences.push(minimumCoursesSet([...requiredCourseCodes]));
						}

						if (forbiddenDays.length > 0) {
							preferences.push(forbidClassesOnDays([...forbiddenDays]));
						}

						if (includeNoGaps) {
							preferences.push(noGapsByDay());
						}

						return preferences;
					},
				),
		);
}

function exprNodeArb(courseCodes: readonly string[]): fc.Arbitrary<ExprNode> {
	const courseCodeArb = fc.constantFrom(...courseCodes);
	const countLeafArb = fc.record({
		courseCode: courseCodeArb,
		operator: fc.constantFrom("==", "!=", ">=", "<=", ">", "<") as fc.Arbitrary<
			"==" | "!=" | ">=" | "<=" | ">" | "<"
		>,
		value: fc.integer({ min: 0, max: 4 }),
	});

	const leafArb: fc.Arbitrary<ExprNode> = fc.oneof(
		userPreferencesArb(courseCodes).map((preferences) =>
			preferences.length === 1
				? preferences[0]
				: ({
						op: "and",
						children: preferences,
					} satisfies ExprNode),
		),
		countLeafArb.map(
			({ courseCode, operator, value }): ExprNode => ({
				op: "count",
				predicate: {
					op: "==",
					property: "courseCode",
					value: courseCode,
				},
				operator,
				value,
			}),
		),
		fc.constant(noGapsByDay()),
	);

	return fc.letrec<{ expr: ExprNode }>((tie) => ({
		expr: fc.oneof(
			leafArb,
			fc.array(tie("expr"), { minLength: 1, maxLength: 3 }).map(
				(children): ExprNode => ({
					op: "and",
					children,
				}),
			),
			fc.array(tie("expr"), { minLength: 1, maxLength: 3 }).map(
				(children): ExprNode => ({
					op: "or",
					children,
				}),
			),
			tie("expr").map(
				(child): ExprNode => ({
					op: "not",
					child,
				}),
			),
		),
	})).expr;
}

const manualScenarioArb: fc.Arbitrary<ManualScenario> = catalogArb.chain(
	(catalog) =>
		fc
			.record({
				selectedClasses: fc.subarray(catalog.flatClasses, {
					maxLength: Math.min(6, catalog.flatClasses.length),
				}),
				userDestCodes: fc.subarray(destCodeValues, {
					minLength: 1,
					maxLength: destCodeValues.length,
				}),
				ignoreLackOfVacancies: fc.boolean(),
				userPreferences: userPreferencesArb(catalog.courseCodes),
			})
			.map(
				({
					selectedClasses,
					userDestCodes,
					ignoreLackOfVacancies,
					userPreferences,
				}) => ({
					...catalog,
					selectedClasses,
					userDestCodes: [...userDestCodes],
					ignoreLackOfVacancies,
					userPreferences,
				}),
			),
);

const constraintScenarioArb: fc.Arbitrary<ConstraintScenario> =
	catalogArb.chain((catalog) =>
		fc
			.record({
				selectedClasses: fc.subarray(catalog.flatClasses, {
					maxLength: Math.min(6, catalog.flatClasses.length),
				}),
				node: exprNodeArb(catalog.courseCodes),
			})
			.map(({ selectedClasses, node }) => ({
				...catalog,
				selectedClasses,
				node,
			})),
	);

describe("gradeOptimizer property tests", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("evaluateConstraint", () => {
		it("keeps boolean and explain modes aligned on satisfaction", () => {
			fc.assert(
				fc.property(
					constraintScenarioArb,
					({ courses, selectedClasses, node }) => {
						const classesForEval = selectedClasses.map((courseClass) =>
							enrichClass(courseClass, courses),
						);

						const booleanResult = evaluateConstraint(
							node,
							classesForEval,
							"boolean",
						);
						const explainResult = evaluateConstraint(
							node,
							classesForEval,
							"explain",
						);

						expect(booleanResult.satisfied).toBe(explainResult.satisfied);
					},
				),
				propertyConfig,
			);
		});

		it("matches hand-computed availableCourses, credit loads, and minimumCoursesSet oracles", () => {
			fc.assert(
				fc.property(
					manualScenarioArb,
					({ courses, selectedClasses, courseCodes }) => {
						const selectedCodes = new Set(
							selectedClasses.map((courseClass) => courseClass.courseCode),
						);
						const allowedCourseCodes = courseCodes.slice(
							0,
							Math.max(1, Math.floor(courseCodes.length / 2)),
						);
						const requiredCourseCodes = allowedCourseCodes.slice(
							0,
							Math.min(2, allowedCourseCodes.length),
						);
						const credits = totalCredits(selectedClasses, courses);
						const enrichedClasses = selectedClasses.map((courseClass) =>
							enrichClass(courseClass, courses),
						);

						expect(
							evaluateConstraint(
								availableCourses(allowedCourseCodes),
								enrichedClasses,
								"boolean",
							).satisfied,
						).toBe(
							selectedClasses.every((courseClass) =>
								allowedCourseCodes.includes(courseClass.courseCode),
							),
						);
						expect(
							evaluateConstraint(
								minCreditLoad(credits),
								enrichedClasses,
								"boolean",
							).satisfied,
						).toBe(true);
						expect(
							evaluateConstraint(
								maxCreditLoad(credits),
								enrichedClasses,
								"boolean",
							).satisfied,
						).toBe(true);
						expect(
							evaluateConstraint(
								minimumCoursesSet(requiredCourseCodes),
								enrichedClasses,
								"boolean",
							).satisfied,
						).toBe(
							requiredCourseCodes.every((courseCode) =>
								selectedCodes.has(courseCode),
							),
						);
					},
				),
				propertyConfig,
			);
		});
	});

	describe("evaluateClassAvailability and evaluateManualGrade", () => {
		it("makes vacancy checks monotone under the ignore flag", () => {
			fc.assert(
				fc.property(manualScenarioArb, ({ selectedClasses, userDestCodes }) => {
					const strictResult = evaluateClassAvailability(
						selectedClasses,
						userDestCodes,
						false,
					);
					const relaxedResult = evaluateClassAvailability(
						selectedClasses,
						userDestCodes,
						true,
					);

					expect(strictResult.satisfied && !relaxedResult.satisfied).toBe(
						false,
					);
				}),
				propertyConfig,
			);
		});

		it("matches its availability-plus-constraint decomposition", () => {
			fc.assert(
				fc.property(
					manualScenarioArb,
					({
						courses,
						selectedClasses,
						userDestCodes,
						ignoreLackOfVacancies,
						userPreferences,
					}) => {
						const manualResult = evaluateManualGrade(
							selectedClasses,
							courses,
							userPreferences,
							userDestCodes,
							ignoreLackOfVacancies,
						);
						const availabilityResult = evaluateClassAvailability(
							selectedClasses,
							userDestCodes,
							ignoreLackOfVacancies,
						);
						const constraintsResult = evaluateConstraint(
							buildManualConstraintNode(userPreferences),
							selectedClasses.map((courseClass) =>
								enrichClass(courseClass, courses),
							),
							"explain",
						);
						const expectedResult =
							availabilityResult.satisfied && constraintsResult.satisfied
								? constraintsResult
								: {
										satisfied: false,
										reasons: [
											...availabilityResult.reasons,
											...(constraintsResult.satisfied
												? []
												: constraintsResult.reasons),
										],
									};

						expect(manualResult).toEqual(expectedResult);
					},
				),
				propertyConfig,
			);
		});
	});

	describe("generateOptimizedGrades", () => {
		it("never returns duplicate course codes or overlapping schedules", () => {
			fc.assert(
				fc.property(manualScenarioArb, (scenario) => {
					const grades = generateOptimizedGrades(
						scenario.courses,
						[...scenario.userPreferences],
						[...scenario.userDestCodes],
						scenario.ignoreLackOfVacancies,
					);

					for (const grade of grades) {
						expect(hasDuplicateCourseCodes(grade.classes)).toBe(false);
						expect(hasOverlappingSchedules(grade.classes)).toBe(false);
					}
				}),
				optimizerPropertyConfig,
			);
		});

		it("returns grades that satisfy manual evaluation, availability, and co-requisites", () => {
			fc.assert(
				fc.property(manualScenarioArb, (scenario) => {
					const grades = generateOptimizedGrades(
						scenario.courses,
						[...scenario.userPreferences],
						[...scenario.userDestCodes],
						scenario.ignoreLackOfVacancies,
					);

					for (const grade of grades) {
						expect(
							evaluateManualGrade(
								grade.classes,
								scenario.courses,
								scenario.userPreferences,
								scenario.userDestCodes,
								scenario.ignoreLackOfVacancies,
							).satisfied,
						).toBe(true);
						expect(
							evaluateClassAvailability(
								grade.classes,
								scenario.userDestCodes,
								scenario.ignoreLackOfVacancies,
							).satisfied,
						).toBe(true);
						expect(
							hasMissingCoRequisites(grade.classes, scenario.courses),
						).toBe(false);
					}
				}),
				optimizerPropertyConfig,
			);
		});
	});
});
