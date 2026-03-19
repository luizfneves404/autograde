# Form Field Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the custom form field shell with shadcn field primitives and convert the shared multi-value field to a shadcn multi-select combobox while keeping the current form helper API stable.

**Architecture:** Add the missing shadcn primitives locally, then refactor `use-app-form.tsx` so all generated form fields compose those primitives and expose consistent invalid/error state behavior. Keep the current field component names for callers, but change `CheckboxGroupField` to render a searchable multi-select combobox and lightly refresh the current consuming pages to use the new structure cleanly.

**Tech Stack:** TypeScript, React, TanStack Form, Vitest, shadcn/ui patterns, Radix UI

---

### Task 1: Add the UI test harness and lock the shared form contract

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/features/forms/use-app-form.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders field errors only after a field becomes invalid", async () => {
  render(<TestForm />);
  expect(screen.queryByText("Informe o nome.")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Salvar" }));
  expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/features/forms/use-app-form.test.tsx`
Expected: FAIL because the repo does not yet have the React DOM test setup and the shared form layer does not expose the desired shadcn field behavior.

**Step 3: Write minimal implementation**

```ts
// add @testing-library/react, @testing-library/user-event, jsdom
// create a focused test that drives the existing form hook
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/features/forms/use-app-form.test.tsx`
Expected: PASS

### Task 2: Add shadcn field primitives

**Files:**
- Create: `src/components/ui/field.tsx`
- Test: `src/features/forms/use-app-form.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders label, description, and field error with shadcn field structure", async () => {
  render(<TestForm />);
  expect(screen.getByText("Nome")).toBeInTheDocument();
  expect(screen.getByText("Nome publico")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/features/forms/use-app-form.test.tsx`
Expected: FAIL because the shared form layer still uses the custom field shell.

**Step 3: Write minimal implementation**

```tsx
export function Field(props: React.ComponentProps<"div">) {
  return <div data-slot="field" {...props} />
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/features/forms/use-app-form.test.tsx`
Expected: PASS

### Task 3: Add shadcn combobox support for multi-select fields

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/components/ui/popover.tsx`
- Create: `src/components/ui/command.tsx`
- Create: `src/components/ui/combobox.tsx`
- Test: `src/features/forms/use-app-form.test.tsx`

**Step 1: Write the failing test**

```tsx
it("updates a multi-select field through the combobox", async () => {
  render(<TestForm />);
  await user.click(screen.getByRole("button", { name: /selecionar/i }));
  await user.click(screen.getByText("MAT101"));
  expect(screen.getByText("MAT101")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/features/forms/use-app-form.test.tsx`
Expected: FAIL because the repo does not yet have the shadcn combobox primitives or dependencies.

**Step 3: Write minimal implementation**

```tsx
<Combobox multiple value={value} onValueChange={onChange}>
  <ComboboxChips />
  <ComboboxContent />
</Combobox>
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/features/forms/use-app-form.test.tsx`
Expected: PASS

### Task 4: Refactor `use-app-form.tsx` to use shadcn field composition

**Files:**
- Modify: `src/features/forms/use-app-form.tsx`
- Test: `src/features/forms/use-app-form.test.tsx`

**Step 1: Write the failing test**

```tsx
it("marks invalid controls with aria-invalid once touched", async () => {
  render(<TestForm />);
  const input = screen.getByLabelText("Nome");
  await user.click(input);
  await user.tab();
  expect(input).toHaveAttribute("aria-invalid", "true");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/features/forms/use-app-form.test.tsx`
Expected: FAIL because the shared form controls do not yet derive invalid state from TanStack metadata in a shadcn-compatible way.

**Step 3: Write minimal implementation**

```tsx
const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/features/forms/use-app-form.test.tsx`
Expected: PASS

### Task 5: Refresh the current consumer pages

**Files:**
- Modify: `src/features/manual/manual-page.tsx`
- Modify: `src/features/preferences/preferences-page.tsx`
- Test: `src/features/forms/use-app-form.test.tsx`

**Step 1: Write the failing test**

Manual verification is acceptable here because these pages currently have no focused UI tests and the shared form tests cover the underlying behavior.

**Step 2: Write minimal implementation**

```tsx
// wrap related fields with FieldSet or adjust descriptions/placeholders
// keep caller API stable while improving layout clarity
```

**Step 3: Run verification**

Run: `pnpm test`
Run: `pnpm build`
Expected: PASS, and the manual/preferences pages show shadcn field structure plus the shadcn multi-select combobox.
