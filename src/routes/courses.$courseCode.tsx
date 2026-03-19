import { createFileRoute } from "@tanstack/react-router";
import { parseCourseIndexSearch } from "@/features/courses/course-index";
import { CoursePage } from "@/features/courses/course-page";

export const Route = createFileRoute("/courses/$courseCode")({
	validateSearch: (search) =>
		parseCourseIndexSearch(search as Record<string, unknown>),
	component: CoursePage,
});
