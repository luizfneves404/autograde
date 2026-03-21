import { expect, type Page } from "@playwright/test";

export async function importOfficialCsv(page: Page): Promise<void> {
	await page.getByRole("button", { name: "Importar CSV oficial" }).click();
	await expect(
		page.locator("header").getByText(/\d+ disciplinas/),
	).not.toHaveText("0 disciplinas");
}

export async function goToPreferences(page: Page): Promise<void> {
	await page.getByRole("link", { name: "Preferencias" }).click();
	await expect(
		page.getByRole("heading", { name: "Preferencias", exact: true }),
	).toBeVisible();
}

export async function generateGradesFromHeader(page: Page): Promise<void> {
	await page.getByRole("button", { name: "Gerar grades" }).click();
	await expect(page.locator("header").getByText(/\d+ grades/)).toBeVisible();
}

export async function goToGrades(page: Page): Promise<void> {
	await page.getByRole("link", { name: "Grades" }).click();
	await expect(
		page.getByRole("heading", { name: "Grades geradas" }),
	).toBeVisible();
}

export async function goToManualGrade(page: Page): Promise<void> {
	await page.getByRole("link", { name: "Grade Manual" }).click();
	await expect(
		page.getByRole("heading", { name: "Grade manual" }),
	).toBeVisible();
}

export async function goToCourses(page: Page): Promise<void> {
	await page.getByRole("link", { name: "Disciplinas" }).click();
	await expect(
		page.getByRole("heading", { name: "Gerenciamento de disciplinas" }),
	).toBeVisible();
}
