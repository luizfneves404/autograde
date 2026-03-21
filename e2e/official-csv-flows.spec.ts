import { expect, test } from "@playwright/test";
import {
	OFFICIAL_GRADE_COUNT_WITH_VACANCY_OVERRIDE,
	OFFICIAL_TARGET_COURSE_CODES,
	OFFICIAL_USER_DEST_CODES,
	OFFICIAL_VISIBLE_GRADE_UI_LIMIT,
} from "../src/fixtures/officialGradeScenario";
import { getDestCodeName } from "../src/utils/destCodes";
import {
	generateGradesFromHeader,
	goToCourses,
	goToGrades,
	goToManualGrade,
	goToPreferences,
	importOfficialCsv,
} from "./helpers/app-flow";
import { pickFirstComboboxOptionContaining } from "./helpers/combobox";
import { seedOfficialScenarioInLocalStorage } from "./helpers/official-scenario-storage";

test.beforeEach(async ({ page }) => {
	page.on("dialog", (dialog) => dialog.accept());
	await page.goto("/courses?page=1&query=");
	await page.evaluate(() => localStorage.removeItem("autograde_data"));
	await page.reload();
});

test.describe("Official CSV and optimizer", () => {
	test("produces no grades when vacancies are enforced on the same scenario", async ({
		page,
	}) => {
		await importOfficialCsv(page);
		await seedOfficialScenarioInLocalStorage(page, {
			ignoreLackOfVacancies: false,
		});
		await generateGradesFromHeader(page);
		await expect(page.locator("header").getByText("0 grades")).toBeVisible();
		await goToGrades(page);
		await expect(page.getByText("Nenhuma grade gerada ainda")).toBeVisible();
	});

	test("generates the expected schedule count with vacancy override and constraints", async ({
		page,
	}) => {
		await importOfficialCsv(page);
		await seedOfficialScenarioInLocalStorage(page, {
			ignoreLackOfVacancies: true,
		});
		await generateGradesFromHeader(page);
		await expect(page.locator("header")).toContainText(
			`${OFFICIAL_GRADE_COUNT_WITH_VACANCY_OVERRIDE.toString()} grades`,
		);
		await goToGrades(page);
		await expect(page.getByText("Navegacao das grades")).toBeVisible();
		await expect(page.getByText(/resultados carregados/)).toContainText(
			OFFICIAL_VISIBLE_GRADE_UI_LIMIT.toString(),
		);
		await expect(
			page.getByRole("button", { name: "Grade 1", exact: true }),
		).toBeVisible();
		await expect(page.getByText("Visualizando a grade 1.")).toBeVisible();
		await expect(
			page
				.locator("table")
				.getByText(OFFICIAL_TARGET_COURSE_CODES[1], { exact: true })
				.first(),
		).toBeVisible();
	});
});

test.describe("Preferences rehydration", () => {
	test("surfaces destination codes and constraints after storage seed", async ({
		page,
	}) => {
		await importOfficialCsv(page);
		await seedOfficialScenarioInLocalStorage(page, {
			ignoreLackOfVacancies: true,
		});
		await goToPreferences(page);
		for (const code of OFFICIAL_USER_DEST_CODES) {
			await expect(page.getByText(getDestCodeName(code))).toBeVisible();
		}
		await expect(
			page.locator("header").getByText("2 restricoes"),
		).toBeVisible();
	});
});

test.describe("Disciplines and manual grade", () => {
	test("finds a target course in the catalog after import", async ({
		page,
	}) => {
		await importOfficialCsv(page);
		await goToCourses(page);
		const sample = OFFICIAL_TARGET_COURSE_CODES[0];
		await page.getByPlaceholder("INF1001 ou nome da disciplina").fill(sample);
		await expect(page.getByText(new RegExp(`^${sample} -`))).toBeVisible();
	});

	test("evaluates a manual selection against active constraints", async ({
		page,
	}) => {
		await importOfficialCsv(page);
		await seedOfficialScenarioInLocalStorage(page, {
			ignoreLackOfVacancies: true,
		});
		await goToManualGrade(page);
		await pickFirstComboboxOptionContaining(
			page,
			"Turmas disponiveis",
			OFFICIAL_TARGET_COURSE_CODES[0],
		);
		await page.getByRole("button", { name: "Analisar grade manual" }).click();
		await expect(page.getByText("Analise das restricoes")).toBeVisible();
	});
});
