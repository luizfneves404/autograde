// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useAppForm } from "./use-app-form";

const testSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome."),
	items: z.array(z.string()).min(1, "Selecione pelo menos um item."),
});

class ResizeObserverStub {
	observe() {}

	unobserve() {}

	disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);
window.HTMLElement.prototype.scrollIntoView = vi.fn();

afterEach(() => {
	cleanup();
});

function TestForm() {
	const onSubmit = vi.fn();
	const form = useAppForm({
		defaultValues: {
			name: "",
			items: [] as string[],
		},
		validators: {
			onChange: testSchema,
		},
		onSubmit: ({ value }) => {
			onSubmit(value);
		},
	});

	return (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.AppField name="name">
				{(field) => (
					<field.TextField
						label="Nome"
						description="Nome publico"
						placeholder="Ada"
					/>
				)}
			</form.AppField>
			<form.AppField name="items">
				{(field) => (
					<field.CheckboxGroupField
						label="Itens"
						description="Selecione pelo menos um item"
						placeholder="Selecionar itens"
						options={[
							{ label: "MAT101", value: "MAT101" },
							{ label: "INF202", value: "INF202" },
						]}
					/>
				)}
			</form.AppField>
			<form.AppForm>
				<form.SubmitButton>Salvar</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}

describe("useAppForm", () => {
	it("renders the field label and description without showing errors immediately", () => {
		render(<TestForm />);

		expect(screen.getByText("Nome")).toBeTruthy();
		expect(screen.getByText("Nome publico")).toBeTruthy();
		expect(screen.queryByText("Informe o nome.")).toBeNull();
	});

	it("shows the field error after submit and marks the input invalid", async () => {
		const user = userEvent.setup();

		render(<TestForm />);

		const submitButton = screen.getAllByRole("button", { name: "Salvar" })[0];

		if (!submitButton) {
			throw new Error("Submit button not found");
		}

		await user.click(submitButton);

		expect(screen.getByText("Informe o nome.")).toBeTruthy();
		expect(screen.getByLabelText("Nome").getAttribute("aria-invalid")).toBe(
			"true",
		);
	});

	it("updates the multi-select field through the combobox", async () => {
		const user = userEvent.setup();

		render(<TestForm />);

		await user.click(screen.getByLabelText("Itens"));
		await user.click(screen.getByText("MAT101"));

		expect(screen.getAllByText("MAT101").length).toBeGreaterThan(0);
	});
});
