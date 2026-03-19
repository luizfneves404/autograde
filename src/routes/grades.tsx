import { createFileRoute } from "@tanstack/react-router";
import { GradesPage } from "@/features/grades/grades-page";

export const Route = createFileRoute("/grades")({
	component: GradesPage,
});
