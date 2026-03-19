import { createFileRoute } from "@tanstack/react-router";
import { ManualPage } from "@/features/manual/manual-page";

export const Route = createFileRoute("/manual")({
	component: ManualPage,
});
