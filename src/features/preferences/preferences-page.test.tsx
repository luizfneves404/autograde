// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PreferencesPage } from "./preferences-page";

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const setUserDestCodes = vi.fn();
const setIgnoreLackOfVacancies = vi.fn();
const upsertConstraint = vi.fn();
const deleteConstraint = vi.fn();

const mockState = {
	courses: {
		INF1001: {
			code: "INF1001",
			name: "Programacao 1",
			shouldHavePreRequisites: false,
			coRequisites: [],
			numCredits: 4,
			classes: [
				{
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
				},
			],
		},
	},
	preferenceSet: {
		hardConstraints: [],
		userDestCodes: ["QQC"],
		ignoreLackOfVacancies: false,
	},
	setUserDestCodes,
	setIgnoreLackOfVacancies,
	upsertConstraint,
	deleteConstraint,
};

vi.mock("@/stores/app-store", () => ({
	useAppStore: (selector: (state: typeof mockState) => unknown) =>
		selector(mockState),
}));

describe("PreferencesPage", () => {
	it("saves the vacancy override together with destination codes", async () => {
		const user = userEvent.setup();

		render(<PreferencesPage />);

		await user.click(
			screen.getByRole("checkbox", {
				name: /Ignorar falta de vagas ao analisar e gerar grades/i,
			}),
		);
		await user.click(
			screen.getByRole("button", {
				name: "Salvar codigos",
			}),
		);

		expect(setUserDestCodes).toHaveBeenCalledWith(["QQC"]);
		expect(setIgnoreLackOfVacancies).toHaveBeenCalledWith(true);
	});
});
