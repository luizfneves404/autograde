import type { DayOfWeek, UIConstraint } from "@/types";
import {
	availableCourses,
	forbidClassesOnDays,
	forbidCourseCombo,
	forbidEachCourse,
	maxCreditLoad,
	minCreditLoad,
	minimumCoursesSet,
	noGapsByDay,
	propertyValueIn,
} from "@/utils/gradeOptimizer";

export type ConstraintType =
	| "AVAILABLE_COURSES"
	| "MINIMUM_COURSES"
	| "FORBID_COURSE_COMBO"
	| "FORBID_EACH_COURSE"
	| "ONLY_PROFESSORS"
	| "MAX_CREDIT_LOAD"
	| "MIN_CREDIT_LOAD"
	| "NO_GAPS_BY_DAY"
	| "FORBID_DAYS";

export type ConstraintFormValues = {
	type: ConstraintType | "";
	courses: string[];
	professors: string[];
	days: DayOfWeek[];
	max: number;
	min: number;
};

export type ConstraintOption = {
	label: string;
	value: ConstraintType;
};

export const constraintOptions: ConstraintOption[] = [
	{ value: "AVAILABLE_COURSES", label: "Disciplinas disponiveis" },
	{ value: "MINIMUM_COURSES", label: "Cursar disciplinas especificas" },
	{
		value: "FORBID_COURSE_COMBO",
		label: "Nao cursar combinacao de disciplinas",
	},
	{
		value: "FORBID_EACH_COURSE",
		label: "Nao cursar nenhuma destas disciplinas",
	},
	{ value: "ONLY_PROFESSORS", label: "Apenas professores especificos" },
	{ value: "MAX_CREDIT_LOAD", label: "Carga maxima de creditos" },
	{ value: "MIN_CREDIT_LOAD", label: "Carga minima de creditos" },
	{ value: "NO_GAPS_BY_DAY", label: "Sem janelas na grade" },
	{ value: "FORBID_DAYS", label: "Dias proibidos" },
];

export function createConstraintId(): string {
	return `constraint_${Date.now().toString()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildConstraint(values: ConstraintFormValues): UIConstraint {
	switch (values.type) {
		case "AVAILABLE_COURSES":
			return {
				id: createConstraintId(),
				name: "Disciplinas Disponiveis",
				description: "Conjunto de disciplinas que podem entrar na grade.",
				enabled: true,
				expression: availableCourses(values.courses),
			};
		case "MINIMUM_COURSES":
			return {
				id: createConstraintId(),
				name: "Disciplinas Obrigatorias",
				description: "Todas as disciplinas listadas devem ser cursadas.",
				enabled: true,
				expression: minimumCoursesSet(values.courses),
			};
		case "FORBID_COURSE_COMBO":
			return {
				id: createConstraintId(),
				name: "Combinacao Proibida",
				description: "Nao cursar simultaneamente as disciplinas listadas.",
				enabled: true,
				expression: forbidCourseCombo(values.courses),
			};
		case "FORBID_EACH_COURSE":
			return {
				id: createConstraintId(),
				name: "Disciplinas Proibidas",
				description: "Cada disciplina listada fica proibida individualmente.",
				enabled: true,
				expression: forbidEachCourse(values.courses),
			};
		case "ONLY_PROFESSORS":
			return {
				id: createConstraintId(),
				name: "Professores Preferenciais",
				description:
					"Todas as turmas devem estar entre os professores escolhidos.",
				enabled: true,
				expression: propertyValueIn("professorName", values.professors),
			};
		case "MAX_CREDIT_LOAD":
			return {
				id: createConstraintId(),
				name: "Creditos Maximos",
				description: "A grade nao deve ultrapassar a carga maxima informada.",
				enabled: true,
				expression: maxCreditLoad(values.max),
			};
		case "MIN_CREDIT_LOAD":
			return {
				id: createConstraintId(),
				name: "Creditos Minimos",
				description:
					"A grade deve atingir pelo menos a carga minima informada.",
				enabled: true,
				expression: minCreditLoad(values.min),
			};
		case "NO_GAPS_BY_DAY":
			return {
				id: createConstraintId(),
				name: "Sem Janelas",
				description: "Nao permite janelas entre aulas no mesmo dia.",
				enabled: true,
				expression: noGapsByDay(),
			};
		case "FORBID_DAYS":
			return {
				id: createConstraintId(),
				name: "Dias Proibidos",
				description: "Nao permitir nenhuma aula nos dias selecionados.",
				enabled: true,
				expression: forbidClassesOnDays(values.days),
			};
		default:
			throw new Error("Tipo de restricao invalido.");
	}
}

export function validateConstraintValues(
	values: ConstraintFormValues,
): string | null {
	switch (values.type) {
		case "":
			return "Selecione um tipo de restricao.";
		case "AVAILABLE_COURSES":
		case "MINIMUM_COURSES":
		case "FORBID_COURSE_COMBO":
		case "FORBID_EACH_COURSE":
			return values.courses.length > 0
				? null
				: "Selecione pelo menos uma disciplina.";
		case "ONLY_PROFESSORS":
			return values.professors.length > 0
				? null
				: "Selecione pelo menos um professor.";
		case "MAX_CREDIT_LOAD":
			return values.max > 0 ? null : "Informe um numero maximo de creditos.";
		case "MIN_CREDIT_LOAD":
			return values.min > 0 ? null : "Informe um numero minimo de creditos.";
		case "FORBID_DAYS":
			return values.days.length > 0 ? null : "Selecione pelo menos um dia.";
		case "NO_GAPS_BY_DAY":
			return null;
	}
}
