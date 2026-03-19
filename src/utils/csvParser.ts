import Papa from "papaparse";
import type { Course, DayOfWeek, Schedule } from "@/types";

type CSVInput = string | ArrayBuffer | Uint8Array;

function decodeCSVInput(input: CSVInput): string {
	if (typeof input === "string") {
		return input.replace(/^\uFEFF/, "");
	}

	const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
	const isUtf16LE = bytes[0] === 0xff && bytes[1] === 0xfe;
	const isUtf16BE = bytes[0] === 0xfe && bytes[1] === 0xff;

	const decoder = isUtf16LE
		? new TextDecoder("utf-16le")
		: isUtf16BE
			? new TextDecoder("utf-16be")
			: new TextDecoder();

	return decoder.decode(bytes).replace(/^\uFEFF/, "");
}

function normalizePUCRow(row: string[]): string[] {
	const trimmedRow = [...row];
	while ((trimmedRow.at(-1) ?? "").trim() === "") {
		trimmedRow.pop();
	}

	if (trimmedRow.length < 14) {
		return trimmedRow.map((value) => value.trim());
	}

	const professorIndex = trimmedRow.length - 12;
	const courseName = trimmedRow
		.slice(1, professorIndex)
		.map((value) => value.trim())
		.filter(Boolean)
		.join(", ");

	return [
		trimmedRow[0]?.trim() ?? "",
		courseName,
		...trimmedRow.slice(professorIndex).map((value) => value.trim()),
	];
}

export const parseCSVData = (csvContent: CSVInput): Record<string, Course> => {
	const courses: Record<string, Course> = {};

	const result = Papa.parse<string[]>(decodeCSVInput(csvContent), {
		header: false,
		skipEmptyLines: true,
	});

	const rows = result.data;
	if (!rows.length) {
		throw new Error(
			"CSV is empty. Please ensure you are using a valid class schedule CSV file.",
		);
	}

	let dataStartIndex = -1;
	for (const [i, row] of rows.entries()) {
		const c0 = row[0]?.trim() ?? "";
		const c1 = row[1]?.trim() ?? "";
		const c2 = row[2]?.trim() ?? "";
		if (
			c0 === "Disciplina" &&
			c1 === "Nome da disciplina" &&
			c2 === "Professor"
		) {
			dataStartIndex = i + 1;
			break;
		}
	}

	if (dataStartIndex === -1) {
		throw new Error(
			"CSV header not found. Please ensure you are using a valid class schedule CSV file.",
		);
	}

	for (const [i, row] of rows.slice(dataStartIndex).entries()) {
		try {
			const parts = normalizePUCRow(row);

			const [
				courseCode,
				courseName,
				professorName,
				numCredits,
				classCode,
				destCode,
				vacancyCount,
				_,
				horarioSala,
				distanceHours,
				SHFHours,
				__,
				preReq,
				___,
			] = parts;
			if (
				!courseCode ||
				!courseName ||
				!professorName ||
				!numCredits ||
				!classCode ||
				!destCode ||
				!vacancyCount ||
				!distanceHours ||
				!SHFHours ||
				!preReq
			) {
				throw new Error("Invalid line, lacking some required field");
			}

			const cleanCourseCode = courseCode.replace(/[^A-Z0-9]/g, "");
			const cleanClassCode = classCode.trim();

			if (!cleanCourseCode || !cleanClassCode) {
				throw new Error(
					"Invalid line, cleanCourseCode or cleanClassCode is empty",
				);
			}

			if (!courses[cleanCourseCode]) {
				courses[cleanCourseCode] = {
					code: cleanCourseCode,
					name: courseName.trim(),
					numCredits: parseInt(numCredits, 10) || 0,
					shouldHavePreRequisites:
						preReq.toLowerCase().includes("sim") || false,
					coRequisites: [],
					classes: [],
				};
			}
			const course = courses[cleanCourseCode];

			let courseClass = course.classes.find(
				(c) => c.classCode === cleanClassCode,
			);

			if (!courseClass) {
				courseClass = {
					classCode: cleanClassCode,
					courseCode: cleanCourseCode,
					professorName: professorName.trim(),
					schedule: horarioSala ? parseScheduleFromCSV(horarioSala) : [],
					distanceHours: parseInt(distanceHours, 10) || 0,
					SHFHours: parseInt(SHFHours, 10) || 0,
					offerings: [],
				};
				course.classes.push(courseClass);
			}

			courseClass.offerings.push({
				classCode: cleanClassCode,
				courseCode: cleanCourseCode,
				destCode: destCode.trim(),
				vacancyCount: parseInt(vacancyCount, 10) || 0,
			});
		} catch (error) {
			console.warn(
				`Skipping line due to error: ${error instanceof Error ? error.message : String(error)}`,
				{ line: i + 1 },
			);
		}
	}

	return courses;
};

const dayMap: Record<string, DayOfWeek> = {
	SEG: "segunda",
	TER: "terça",
	QUA: "quarta",
	QUI: "quinta",
	SEX: "sexta",
	SAB: "sábado",
};

export const parseScheduleFromCSV = (horarioSala: string): Schedule => {
	if (!horarioSala.trim()) {
		return [];
	}

	const timeBlocks = horarioSala.split(/\s{2,}/).filter(Boolean);

	return timeBlocks.reduce<Schedule>((schedule, block) => {
		try {
			const match = block
				.trim()
				.match(/^([A-Z]{3})\s+(\d{1,2})-(\d{1,2})(?:\s+.+)?$/);

			if (!match) {
				return schedule;
			}

			const [, dayAbbr, startStr, endStr] = match;
			if (!dayAbbr || !startStr || !endStr) {
				throw new Error("Invalid schedule string");
			}

			const startHour = parseInt(startStr, 10);
			const endHour = parseInt(endStr, 10);

			const day = dayMap[dayAbbr];
			if (
				day &&
				!Number.isNaN(startHour) &&
				!Number.isNaN(endHour) &&
				startHour < endHour
			) {
				schedule.push({ day, slot: { startHour, endHour } });
			} else {
				throw new Error("Invalid schedule string");
			}
		} catch (error) {
			console.warn(
				`Error parsing block "${block}": ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		return schedule;
	}, []);
};
