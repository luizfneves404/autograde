# Form Field Refresh Design

**Goal:** Replace the custom form field shell with shadcn field primitives and migrate multi-value selection to a shadcn multi-select combobox without forcing broad caller API changes.

## Scope

- Add local shadcn-style `field` primitives for labels, descriptions, errors, groups, and sets.
- Refactor `src/features/forms/use-app-form.tsx` to render those primitives for all generated form fields.
- Replace the current checkbox-list multi-select UI with a shadcn combobox-based multi-select while preserving the existing `CheckboxGroupField` API name for callers.
- Refresh the current consumers in `src/features/manual/manual-page.tsx` and `src/features/preferences/preferences-page.tsx` only where the new field primitives improve structure.

## Design

- Create `src/components/ui/field.tsx` to provide `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`, and related layout helpers.
- Add the minimum supporting shadcn combobox pieces required by this repo so the multi-select input is based on shadcn composition rather than a custom ad hoc widget.
- Move shared invalid-state logic into `use-app-form.tsx`, using TanStack Form metadata to drive `data-invalid`, `aria-invalid`, and error visibility.
- Keep the generated field API stable so current `form.AppField` call sites only change when layout or wording benefits from the new primitives.

## Risks

- The repo does not yet include the full shadcn combobox dependency chain, so the migration may require adding Radix and command-palette dependencies plus a small test harness for interactive UI coverage.
- The current `CheckboxGroupField` name will no longer match its visual implementation, so future cleanup may want to rename it after this migration lands.
- The project already has unrelated in-progress changes, so edits must stay tightly scoped to the shared form layer and the existing consumer pages.

## Validation

- Add failing tests first for the shared field rendering and multi-select value behavior.
- Run the focused tests after each step, then run the project test suite and lint/build checks.
- Manually verify the updated pages against the running Vite app to confirm the shadcn combobox behavior and field error presentation.
