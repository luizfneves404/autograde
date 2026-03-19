import { createFileRoute } from "@tanstack/react-router";
import { PreferencesPage } from "@/features/preferences/preferences-page";

export const Route = createFileRoute("/preferences")({
	component: PreferencesPage,
});
