import { describe, expect, it } from "vitest";
import type { Course } from "@/types";
import {
	COURSES_PAGE_SIZE,
	filterCourses,
	paginateItems,
	parseCourseIndexSearch,
} from "./course-index";

function makeCourse(overrides: Partial<Course> = {}): Course {
	return {
		code: "INF1001",
		name: "Programacao 1",
		shouldHavePreRequisites: false,
		coRequisites: [],
		numCredits: 4,
		classes: [],
		...overrides,
	};
}

describe("course index helpers", () => {
	it("parses course index search params with sane defaults", () => {
		expect(parseCourseIndexSearch({})).toEqual({
			page: 1,
			query: "",
		});

		expect(
			parseCourseIndexSearch({
				page: "0",
				query: "  algebra linear  ",
			}),
		).toEqual({
			page: 1,
			query: "algebra linear",
		});

		expect(
			parseCourseIndexSearch({
				page: "3",
				query: 42,
			}),
		).toEqual({
			page: 3,
			query: "",
		});
	});

	it("filters courses by code or name case-insensitively", () => {
		const courses = [
			makeCourse({ code: "INF1001", name: "Programacao 1" }),
			makeCourse({ code: "MAT2001", name: "Algebra Linear" }),
			makeCourse({ code: "QUI3001", name: "Quimica" }),
		];

		expect(filterCourses(courses, "inf")).toEqual([courses[0]]);
		expect(filterCourses(courses, "linear")).toEqual([courses[1]]);
		expect(filterCourses(courses, "QUI")).toEqual([courses[2]]);
	});

	it("paginates items and clamps the current page into range", () => {
		const items = Array.from(
			{ length: COURSES_PAGE_SIZE * 2 + 5 },
			(_, index) => ({
				id: index + 1,
			}),
		);

		expect(paginateItems(items, 1, COURSES_PAGE_SIZE)).toEqual({
			items: items.slice(0, COURSES_PAGE_SIZE),
			page: 1,
			totalPages: 3,
		});

		expect(paginateItems(items, 99, COURSES_PAGE_SIZE)).toEqual({
			items: items.slice(COURSES_PAGE_SIZE * 2),
			page: 3,
			totalPages: 3,
		});
	});
});
