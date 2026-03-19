import { z } from "zod";
import { useAppForm } from "@/features/forms/use-app-form";
import type { Course, CourseClass, Schedule } from "@/types";

export const courseFormSchema = z.object({
	code: z.string().trim().min(1, "Informe o codigo."),
	name: z.string().trim().min(1, "Informe o nome."),
	numCredits: z.number().min(0, "Creditos nao podem ser negativos."),
	shouldHavePreRequisites: z.boolean(),
	coRequisites: z.array(z.string()),
});

export const classFormSchema = z.object({
	classCode: z.string().trim().min(1, "Informe o codigo da turma."),
	professorName: z.string().trim().min(1, "Informe o professor."),
	distanceHours: z
		.number()
		.min(0, "Horas a distancia nao podem ser negativas."),
	SHFHours: z.number().min(0, "Horas SHF nao podem ser negativas."),
	scheduleText: z.string(),
});

export const offeringFormSchema = z.object({
	destCode: z.string().trim().min(1, "Informe o codigo de destino."),
	vacancyCount: z.number().min(0, "As vagas nao podem ser negativas."),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;
export type ClassFormValues = z.infer<typeof classFormSchema>;
export type OfferingFormValues = z.infer<typeof offeringFormSchema>;

export const emptyCourseFormValues: CourseFormValues = {
	code: "",
	name: "",
	numCredits: 0,
	shouldHavePreRequisites: false,
	coRequisites: [],
};

export const emptyClassFormValues: ClassFormValues = {
	classCode: "",
	professorName: "",
	distanceHours: 0,
	SHFHours: 0,
	scheduleText: "",
};

export const emptyOfferingFormValues: OfferingFormValues = {
	destCode: "",
	vacancyCount: 0,
};

export function scheduleToText(schedule: Schedule): string {
	return schedule
		.map(
			(item) =>
				`${item.day.slice(0, 3).toUpperCase()} ${item.slot.startHour.toString()}-${item.slot.endHour.toString()}`,
		)
		.join("  ");
}

export function classSummary(courseClass: CourseClass): string {
	if (courseClass.schedule.length === 0) {
		return "Sem horario definido";
	}

	return courseClass.schedule
		.map(
			(item) =>
				`${item.day} ${item.slot.startHour.toString()}-${item.slot.endHour.toString()}`,
		)
		.join(", ");
}

export function updateCourseCodeReferences(
	course: Course,
	nextCode: string,
): Course {
	return {
		...course,
		code: nextCode,
		classes: course.classes.map((courseClass) => ({
			...courseClass,
			courseCode: nextCode,
			offerings: courseClass.offerings.map((offering) => ({
				...offering,
				courseCode: nextCode,
			})),
		})),
	};
}

export function CourseForm({
	initialValues,
	submitLabel,
	availableCourseCodes,
	showCoRequisites = true,
	onSubmit,
}: {
	initialValues: CourseFormValues;
	submitLabel: string;
	availableCourseCodes: string[];
	showCoRequisites?: boolean;
	onSubmit: (values: CourseFormValues) => void;
}) {
	const form = useAppForm({
		defaultValues: initialValues,
		validators: {
			onChange: courseFormSchema,
		},
		onSubmit: ({ value }) => {
			onSubmit({
				...value,
				code: value.code.trim().toUpperCase(),
				name: value.name.trim(),
			});
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
			<div className="grid gap-4 md:grid-cols-2">
				<form.AppField name="code">
					{(field) => <field.TextField label="Codigo" placeholder="INF1001" />}
				</form.AppField>
				<form.AppField name="name">
					{(field) => (
						<field.TextField label="Nome" placeholder="Nome da disciplina" />
					)}
				</form.AppField>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<form.AppField name="numCredits">
					{(field) => <field.NumberField label="Creditos" min={0} />}
				</form.AppField>
				<form.AppField name="shouldHavePreRequisites">
					{(field) => (
						<field.CheckboxField
							label="Precisa de algum pré-requisito"
							placeholder="Marque se a disciplina exigir algum pré-requisito (campo ignorado pelo otimizador)."
						/>
					)}
				</form.AppField>
			</div>
			{showCoRequisites ? (
				<form.AppField name="coRequisites">
					{(field) => (
						<field.CheckboxGroupField
							label="Co-requisitos"
							description="Selecione disciplinas que devem ser cursadas em conjunto."
							options={availableCourseCodes.map((courseCode) => ({
								label: courseCode,
								value: courseCode,
							}))}
							emptyMessage="Nenhuma outra disciplina disponivel."
						/>
					)}
				</form.AppField>
			) : null}
			<form.AppForm>
				<form.SubmitButton>{submitLabel}</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}

export function ClassForm({
	initialValues,
	submitLabel,
	onSubmit,
}: {
	initialValues: ClassFormValues;
	submitLabel: string;
	onSubmit: (values: ClassFormValues) => void;
}) {
	const form = useAppForm({
		defaultValues: initialValues,
		validators: {
			onChange: classFormSchema,
		},
		onSubmit: ({ value }) => {
			onSubmit({
				...value,
				classCode: value.classCode.trim().toUpperCase(),
				professorName: value.professorName.trim(),
			});
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
			<div className="grid gap-4 md:grid-cols-2">
				<form.AppField name="classCode">
					{(field) => <field.TextField label="Turma" placeholder="3WA" />}
				</form.AppField>
				<form.AppField name="professorName">
					{(field) => (
						<field.TextField label="Professor" placeholder="Ada Lovelace" />
					)}
				</form.AppField>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<form.AppField name="distanceHours">
					{(field) => <field.NumberField label="Horas a distancia" min={0} />}
				</form.AppField>
				<form.AppField name="SHFHours">
					{(field) => <field.NumberField label="Horas SHF" min={0} />}
				</form.AppField>
			</div>
			<form.AppField name="scheduleText">
				{(field) => (
					<field.TextareaField
						label="Horario"
						description="Use o formato SEG 7-9  QUI 11-13."
						rows={3}
						placeholder="SEG 9-11  QUA 9-11"
					/>
				)}
			</form.AppField>
			<form.AppForm>
				<form.SubmitButton>{submitLabel}</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}

export function OfferingForm({
	initialValues,
	submitLabel,
	onSubmit,
}: {
	initialValues: OfferingFormValues;
	submitLabel: string;
	onSubmit: (values: OfferingFormValues) => void;
}) {
	const form = useAppForm({
		defaultValues: initialValues,
		validators: {
			onChange: offeringFormSchema,
		},
		onSubmit: ({ value }) => {
			onSubmit({
				...value,
				destCode: value.destCode.trim().toUpperCase(),
			});
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
			<div className="grid gap-4 md:grid-cols-2">
				<form.AppField name="destCode">
					{(field) => (
						<field.TextField label="Codigo de destino" placeholder="CCP" />
					)}
				</form.AppField>
				<form.AppField name="vacancyCount">
					{(field) => <field.NumberField label="Vagas" min={0} />}
				</form.AppField>
			</div>
			<form.AppForm>
				<form.SubmitButton>{submitLabel}</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}
