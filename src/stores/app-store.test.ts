import { describe, expect, it, vi } from "vitest";
import type { AppData, Course, PreferenceSet } from "@/types";
import { maxCreditLoad } from "@/utils/gradeOptimizer";
import { createPlainAppStore } from "./app-store";

function encodeUtf16LE(value: string): ArrayBuffer {
	const bytes = new Uint8Array(value.length * 2 + 2);
	bytes[0] = 0xff;
	bytes[1] = 0xfe;

	for (let index = 0; index < value.length; index += 1) {
		const codeUnit = value.charCodeAt(index);
		bytes[2 + index * 2] = codeUnit & 0xff;
		bytes[3 + index * 2] = codeUnit >> 8;
	}

	return bytes.buffer;
}

function makeCourse(overrides: Partial<Course> = {}): Course {
	return {
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
						destCode: "CCP",
						vacancyCount: 20,
					},
				],
			},
		],
		...overrides,
	};
}

const emptyPreferenceSet: PreferenceSet = {
	hardConstraints: [],
	userDestCodes: ["CCP"],
};

describe("app-store", () => {
	it("imports valid JSON text and replaces the persisted app data", () => {
		const store = createPlainAppStore();

		const importedData: AppData = {
			courses: {
				INF1001: makeCourse(),
			},
			preferenceSet: emptyPreferenceSet,
		};

		store.getState().importJsonText(JSON.stringify(importedData));

		expect(store.getState().courses).toEqual(importedData.courses);
		expect(store.getState().preferenceSet).toEqual(importedData.preferenceSet);
	});

	it("imports UTF-16 CSV files", async () => {
		const store = createPlainAppStore();

		const csv = [
			"cabecalho irrelevante",
			"Disciplina,Nome da disciplina,Professor,Créd,Turma,Destino,Vag,Turno,Horário/Sala,Horas a Distância,SHF,Horas de extensão,Pré-Req,Depto,,",
			"ACN1005, PROJETO FINAL ,SARA FAGUNDES SOARES DE OLIVEIRA,4,1DA,QQC,3,I,SEX 13-15 L148  ,2,0,0, SIM ,LET,,",
		].join("\n");

		const file = new File([encodeUtf16LE(csv)], "HORARIO.csv", {
			type: "text/csv",
		});

		await store.getState().importCsvFile(file);

		expect(store.getState().courses.ACN1005?.name).toBe("PROJETO FINAL");
	});

	it("only sends enabled constraints into the optimizer", () => {
		const optimizer = vi.fn(() => [{ classes: [] }]);
		const store = createPlainAppStore(
			{
				courses: {
					INF1001: makeCourse(),
				},
				preferenceSet: {
					hardConstraints: [
						{
							id: "enabled",
							name: "Enabled",
							description: "Enabled constraint",
							enabled: true,
							expression: maxCreditLoad(20),
						},
						{
							id: "disabled",
							name: "Disabled",
							description: "Disabled constraint",
							enabled: false,
							expression: maxCreditLoad(10),
						},
					],
					userDestCodes: ["CCP"],
				},
			},
			{
				generateOptimizedGrades: optimizer,
			},
		);

		store.getState().generateGrades();

		expect(optimizer).toHaveBeenCalledTimes(1);
		expect(optimizer).toHaveBeenCalledWith(
			expect.any(Object),
			[maxCreditLoad(20)],
			["CCP"],
			expect.any(Function),
		);
		expect(store.getState().grades).toEqual([{ classes: [] }]);
	});
});
