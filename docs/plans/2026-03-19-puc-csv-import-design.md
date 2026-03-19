# PUC CSV Import Design

**Goal:** Parse the bundled PUC schedule export and similarly formatted files reliably, including malformed rows and UTF-16 encoded uploads.

## Scope

- Keep the existing `Course` output shape unchanged.
- Tailor the parser to the known PUC export layout instead of treating the file as generic CSV.
- Add a built-in import path that loads the sample CSV from `src/assets`.

## Design

- Normalize CSV input before parsing course rows.
- Support UTF-16 input from uploaded files by decoding bytes before parsing.
- Keep `Papa.parse` for row tokenization, but repair malformed rows by rebuilding them around stable trailing columns.
- Preserve the existing schedule parsing flow after row repair.
- Add a UI action that imports the bundled sample CSV without requiring a file upload.

## Risks

- PUC exports may contain more malformed row variants than the one already identified.
- Browser-side asset loading must preserve the original bytes so the UTF-16 decoder can run first.

## Validation

- Add regression tests for UTF-16 decoding.
- Add regression tests for rows with unquoted commas in the course name.
- Verify store import still merges parsed courses into existing data.
