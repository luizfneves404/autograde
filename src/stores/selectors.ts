import type { Course, CourseClass } from "@/types";

export function getCourseList(courses: Record<string, Course>): Course[] {
	return Object.values(courses);
}

export function getAvailableCourseCodes(
	courses: Record<string, Course>,
): string[] {
	return Object.keys(courses).sort();
}

export function getAvailableClasses(
	courses: Record<string, Course>,
): CourseClass[] {
	return getCourseList(courses).flatMap((course) => course.classes);
}

export function getAvailableProfessors(
	courses: Record<string, Course>,
): string[] {
	return [
		...new Set(
			getAvailableClasses(courses).map(
				(courseClass) => courseClass.professorName,
			),
		),
	].sort();
}

export function getAvailableDestCodes(
	courses: Record<string, Course>,
): string[] {
	return [
		...new Set(
			getAvailableClasses(courses).flatMap((courseClass) =>
				courseClass.offerings.map((offering) => offering.destCode),
			),
		),
	].sort();
}
