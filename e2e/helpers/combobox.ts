import type { Page } from "@playwright/test";

async function clickComboboxItem(page: Page, filter: RegExp): Promise<void> {
	const item = page
		.locator('[data-slot="combobox-item"]')
		.filter({ hasText: filter });
	await item.first().waitFor({ state: "visible" });
	await item.first().click();
}

export async function pickFirstComboboxOptionContaining(
	page: Page,
	fieldLabel: string,
	substring: string,
): Promise<void> {
	const input = page.getByLabel(fieldLabel);
	await input.click();
	await input.clear();
	await input.fill(substring);
	const byOption = page.getByRole("option", { name: new RegExp(substring) });
	if ((await byOption.count()) > 0) {
		await byOption.first().click();
	} else {
		await clickComboboxItem(page, new RegExp(substring));
	}
	await page.keyboard.press("Escape");
}
