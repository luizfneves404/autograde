import type { Page } from "@playwright/test";
import {
	OFFICIAL_MIN_CREDIT_LOAD,
	OFFICIAL_TARGET_COURSE_CODES,
	OFFICIAL_USER_DEST_CODES,
} from "../../src/fixtures/officialGradeScenario";
import type { UIConstraint } from "../../src/types";
import {
	availableCourses,
	minCreditLoad,
} from "../../src/utils/gradeOptimizer";

const STORAGE_KEY = "autograde_data";

/** Seeds the same preference payload as the UI (dest codes, vacancy flag, constraints) without driving the multi-select combobox, which does not reliably expose a second pick in headless runs. */
function buildOfficialScenarioConstraints(): UIConstraint[] {
	return [
		{
			id: "e2e_official_available_courses",
			name: "Disciplinas Disponiveis",
			description: "Conjunto de disciplinas que podem entrar na grade.",
			enabled: true,
			expression: availableCourses([...OFFICIAL_TARGET_COURSE_CODES]),
		},
		{
			id: "e2e_official_min_credit_load",
			name: "Creditos Minimos",
			description: "A grade deve atingir pelo menos a carga minima informada.",
			enabled: true,
			expression: minCreditLoad(OFFICIAL_MIN_CREDIT_LOAD),
		},
	];
}

type PersistShape = {
	state: {
		preferenceSet: {
			userDestCodes: string[];
			ignoreLackOfVacancies: boolean;
			hardConstraints: UIConstraint[];
		};
	};
};

export async function seedOfficialScenarioInLocalStorage(
	page: Page,
	options: { ignoreLackOfVacancies: boolean },
): Promise<void> {
	const constraints = buildOfficialScenarioConstraints();
	const destCodes = [...OFFICIAL_USER_DEST_CODES];
	await page.evaluate(
		({ key, destCodes: codes, ignore, hardConstraints }) => {
			const raw = localStorage.getItem(key);
			if (!raw) {
				throw new Error("Expected persisted state after CSV import.");
			}
			const data = JSON.parse(raw) as PersistShape;
			data.state.preferenceSet.userDestCodes = codes;
			data.state.preferenceSet.ignoreLackOfVacancies = ignore;
			data.state.preferenceSet.hardConstraints = hardConstraints;
			localStorage.setItem(key, JSON.stringify(data));
		},
		{
			key: STORAGE_KEY,
			destCodes,
			ignore: options.ignoreLackOfVacancies,
			hardConstraints: constraints,
		},
	);
	await page.reload();
}
