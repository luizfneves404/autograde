import { describe, expect, it } from "vitest";
import { parseCSVData } from "./csvParser";

const header = [
	"Período: 20261,Emitido em: 18/03/2026 20:03 h, Data da última atualização: 18/03/2026 19:50h,,,,,,,,,,,,,",
	"Critérios da busca: ,,,,,,,,,,,,,,,",
	"Não foi especificado nenhum critério de busca,,,,,,,,,,,,,,,",
	"Disciplina,Nome da disciplina,Professor,Créd,Turma,Destino,Vag,Turno,Horário/Sala,Horas a Distância,SHF,Horas de extensão,Pré-Req,Depto,,",
].join("\n");

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

describe("parseCSVData", () => {
	it("parses a PUC row with an unquoted comma in the course name", () => {
		const csv = [
			header,
			"ACN1023, LEITOR,ESPECTADOR/OBRA DE ARTE ,SARA FAGUNDES SOARES DE OLIVEIRA,4,1DA,QQC,1,I,TER 11-13 L148  QUI 11-13 L114  ,0,0,0,NÃO,LET,",
		].join("\n");

		const courses = parseCSVData(csv);

		expect(courses.ACN1023?.name).toBe("LEITOR, ESPECTADOR/OBRA DE ARTE");
		expect(courses.ACN1023?.classes[0]?.schedule).toEqual([
			{ day: "terça", slot: { startHour: 11, endHour: 13 } },
			{ day: "quinta", slot: { startHour: 11, endHour: 13 } },
		]);
	});

	it("parses UTF-16 encoded PUC CSV content", () => {
		const csv = [
			header,
			"ACN1005, PROJETO FINAL ,SARA FAGUNDES SOARES DE OLIVEIRA,4,1DA,QQC,3,I,SEX 13-15 L148  ,2,0,0, SIM ,LET,,",
		].join("\n");

		const courses = parseCSVData(encodeUtf16LE(csv));

		expect(courses.ACN1005?.name).toBe("PROJETO FINAL");
		expect(courses.ACN1005?.classes[0]?.distanceHours).toBe(2);
	});
});
