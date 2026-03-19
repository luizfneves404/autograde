import { createFileRoute, Outlet } from "@tanstack/react-router";
import { parseCourseIndexSearch } from "@/features/courses/course-index";

export const Route = createFileRoute("/courses")({
	validateSearch: (search) =>
		parseCourseIndexSearch(search as Record<string, unknown>),
	component: Outlet,
});
