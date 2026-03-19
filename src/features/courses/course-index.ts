import type { Course } from "@/types";

export const COURSES_PAGE_SIZE = 20;

export function parseCourseIndexSearch(search: Record<string, unknown>): {
	page: number;
	query: string;
} {
	const rawPage =
		typeof search.page === "number" || typeof search.page === "string"
			? Number(search.page)
			: Number.NaN;
	const query = typeof search.query === "string" ? search.query.trim() : "";

	return {
		page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
		query,
	};
}

export function filterCourses(courses: Course[], query: string): Course[] {
	if (!query) {
		return courses;
	}

	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return courses;
	}

	return courses.filter(
		(course) =>
			course.code.toLowerCase().includes(normalizedQuery) ||
			course.name.toLowerCase().includes(normalizedQuery),
	);
}

export function paginateItems<T>(
	items: T[],
	page: number,
	pageSize: number,
): {
	items: T[];
	page: number;
	totalPages: number;
} {
	const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
	const currentPage = Math.min(Math.max(page, 1), totalPages);
	const start = (currentPage - 1) * pageSize;

	return {
		items: items.slice(start, start + pageSize),
		page: currentPage,
		totalPages,
	};
}
