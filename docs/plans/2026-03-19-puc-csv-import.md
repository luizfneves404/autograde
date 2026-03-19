# PUC CSV Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make CSV import work for the bundled PUC export and similarly formatted uploaded files, then expose a one-click import for the sample asset.

**Architecture:** Keep `Papa.parse` as the tokenizer, but add a PUC-specific normalization layer that decodes UTF-16 input and repairs malformed rows before course construction. Update the import UI to load CSV uploads as bytes and add a second path that fetches the bundled asset and routes it through the same parser.

**Tech Stack:** TypeScript, Vitest, Vite, React, Zustand, Papa Parse

---

### Task 1: Lock the parser bug with tests

**Files:**
- Create: `src/utils/csvParser.test.ts`
- Test: `src/utils/csvParser.test.ts`

**Step 1: Write the failing test**

```ts
it("parses a PUC row with an unquoted comma in the course name", () => {
  const csv = "...ACN1023, LEITOR,ESPECTADOR/OBRA DE ARTE ...";
  expect(parseCSVData(csv).ACN1023?.name).toBe("LEITOR, ESPECTADOR/OBRA DE ARTE");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/utils/csvParser.test.ts`
Expected: FAIL because the malformed row shifts columns.

**Step 3: Write minimal implementation**

```ts
function normalizePucRow(row: string[]): string[] {
  // rebuild malformed rows around stable columns
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/utils/csvParser.test.ts`
Expected: PASS

### Task 2: Support UTF-16 CSV bytes

**Files:**
- Modify: `src/utils/csvParser.ts`
- Modify: `src/stores/app-store.ts`
- Modify: `src/stores/app-store.test.ts`

**Step 1: Write the failing test**

```ts
it("imports UTF-16 CSV bytes", async () => {
  const file = new File([utf16Bytes], "grades.csv");
  await store.getState().importCsvFile(file);
  expect(store.getState().courses.ACN1005).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/stores/app-store.test.ts`
Expected: FAIL because upload handling currently uses `text()`.

**Step 3: Write minimal implementation**

```ts
async function importCsvFile(file: Blob) {
  const content = await decodeCsvInput(await file.arrayBuffer());
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/stores/app-store.test.ts`
Expected: PASS

### Task 3: Add one-click sample CSV import

**Files:**
- Modify: `src/routes/__root.tsx`

**Step 1: Write the failing test**

Manual verification is acceptable here because the route currently has no focused UI tests.

**Step 2: Implement minimal UI**

```ts
import sampleCsvUrl from "@/assets/HORARIO_DAS_DISCIPLINAS_18032026.csv?url";
```

**Step 3: Verify manually and with existing tests**

Run: `pnpm test`
Run: `pnpm build`
Expected: Both succeed and the new button imports the bundled file.
