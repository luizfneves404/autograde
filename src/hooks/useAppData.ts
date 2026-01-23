import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppData, Course, Grade, PreferenceSet } from "@/types";
import { AppDataSchema, CourseSchema } from "@/types";
import { parseCSVData } from "@/utils/csvParser";
import { generateOptimizedGrades } from "@/utils/gradeOptimizer";

const STORAGE_KEY = "autograde_data";

const defaultPreferenceSet: PreferenceSet = {
	hardConstraints: [],
	userDestCodes: [],
};

export function useAppData() {
	const [courses, setCourses] = useState<Record<string, Course>>({});
	const [preferenceSet, setPreferenceSet] =
		useState<PreferenceSet>(defaultPreferenceSet);
	const [grades, setGrades] = useState<Grade[]>([]);

	useEffect(() => {
		try {
			const savedData = localStorage.getItem(STORAGE_KEY);
			if (!savedData) return;

			const parsed = JSON.parse(savedData);
			const result = AppDataSchema.safeParse(parsed);

			if (result.success) {
				setCourses(result.data.courses);
				setPreferenceSet(result.data.preferenceSet);
			} else {
				console.error("Invalid data in localStorage:", result.error);
				localStorage.removeItem(STORAGE_KEY);
			}
		} catch (error) {
			console.error("Failed to load data from localStorage:", error);
			localStorage.removeItem(STORAGE_KEY);
		}
	}, []);

	useEffect(() => {
		try {
			const dataToSave: AppData = { courses, preferenceSet };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
		} catch (error) {
			console.error("Failed to save data to localStorage:", error);
		}
	}, [courses, preferenceSet]);

	const handleDataImport = useCallback((data: AppData) => {
		setCourses(data.courses);
		setPreferenceSet(data.preferenceSet);
	}, []);

	const handleJsonImport = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const content = e.target?.result;
					if (typeof content !== "string") {
						throw new Error("File content is not a string.");
					}

					const parsed = JSON.parse(content);
					const result = AppDataSchema.safeParse(parsed);

					if (result.success) {
						handleDataImport(result.data);
						alert("Dados importados com sucesso!");
					} else {
						const formattedErrors = result.error.issues
							.map((issue) => {
								// Join the path array (e.g., ["courses", "CS101", "classes"]) into a string
								const path =
									issue.path.length > 0 ? issue.path.join(".") : "root";
								return `• ${path}: ${issue.message}`;
							})
							.join("\n");

						// Log the full error object to console for detailed inspection
						console.error("Zod Validation Errors:", result.error.issues);

						throw new Error(`Dados inválidos:\n${formattedErrors}`);
					}
				} catch (error) {
					console.error("Erro ao importar JSON:", error);
					alert(
						`Falha ao importar o arquivo JSON: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
					);
				}
			};
			reader.readAsText(file);
			event.target.value = "";
		},
		[handleDataImport],
	);

	const handleCsvImport = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const content = e.target?.result;
					if (typeof content !== "string") {
						throw new Error("File content is not a string.");
					}

					const coursesFromCsv = parseCSVData(content);
					const validatedCourses = Object.fromEntries(
						Object.entries(coursesFromCsv).filter(
							([, course]) => CourseSchema.safeParse(course).success,
						),
					);

					const invalidCount =
						Object.keys(coursesFromCsv).length -
						Object.keys(validatedCourses).length;
					if (invalidCount > 0) {
						console.warn(`${invalidCount} cursos inválidos foram ignorados`);
					}

					const courseCount = Object.keys(validatedCourses).length;
					const classCount = Object.values(validatedCourses).reduce(
						(total, course) => total + course.classes.length,
						0,
					);
					const classOfferingCount = Object.values(validatedCourses).reduce(
						(total, course) =>
							total +
							course.classes.reduce(
								(classTotal, c) => classTotal + c.offerings.length,
								0,
							),
						0,
					);

					alert(
						`${courseCount} disciplinas, ${classCount} turmas e ${classOfferingCount} ofertas de turmas importadas com sucesso!`,
					);

					setCourses((prev) => ({ ...prev, ...validatedCourses }));
				} catch (error) {
					console.error("Erro ao importar CSV:", error);
					alert(
						`Falha ao importar o arquivo CSV: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
					);
				}
			};
			reader.readAsText(file);
			event.target.value = "";
		},
		[],
	);

	const handleGenerateGrades = useCallback(() => {
		try {
			// TODO: Use progress callback to update UI state (e.g., for a progress bar)
			const generated = generateOptimizedGrades(
				courses,
				preferenceSet.hardConstraints
					.filter((c) => c.enabled)
					.map((c) => c.expression),
				preferenceSet.userDestCodes,
				(progress) => {
					console.log(`Progress: ${(progress * 100).toFixed(4)}%`);
				},
			);
			setGrades(generated);
			if (generated.length === 0) {
				alert(
					"Nenhuma grade pôde ser gerada com as preferências e disciplinas atuais.",
				);
			}
		} catch (error) {
			console.error("Erro ao gerar grades:", error);
			alert(
				`Ocorreu um erro ao gerar as grades: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
			);
		}
	}, [courses, preferenceSet]);

	const coursesList = useMemo(() => Object.values(courses), [courses]);
	const availableCourseCodes = useMemo(() => Object.keys(courses), [courses]);
	const availableClasses = useMemo(
		() => coursesList.flatMap((d) => d.classes),
		[coursesList],
	);
	const availableProfessors = useMemo(
		() => [
			...new Set(
				coursesList.flatMap((t) => t.classes.map((c) => c.professorName)),
			),
		],
		[coursesList],
	);
	const availableDestCodes = useMemo(
		() => [
			...new Set(
				coursesList.flatMap((t) =>
					t.classes.flatMap((c) => c.offerings.map((o) => o.destCode)),
				),
			),
		],
		[coursesList],
	);

	return {
		courses,
		setCourses,
		preferenceSet,
		setPreferenceSet,
		grades,
		handleJsonImport,
		handleCsvImport,
		handleGenerateGrades,
		availableCourseCodes,
		availableClasses,
		availableProfessors,
		availableDestCodes,
	};
}
