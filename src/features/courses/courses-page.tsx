import { useMemo, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAppForm } from "@/features/forms/use-app-form";
import { useAppStore } from "@/stores/app-store";
import { getAvailableCourseCodes, getCourseList } from "@/stores/selectors";
import type { ClassOffering, Course, CourseClass, Schedule } from "@/types";
import { parseScheduleFromCSV } from "@/utils/csvParser";

const courseFormSchema = z.object({
	code: z.string().trim().min(1, "Informe o codigo."),
	name: z.string().trim().min(1, "Informe o nome."),
	numCredits: z.number().min(0, "Creditos nao podem ser negativos."),
	shouldHavePreRequisites: z.boolean(),
	coRequisites: z.array(z.string()),
});

const classFormSchema = z.object({
	classCode: z.string().trim().min(1, "Informe o codigo da turma."),
	professorName: z.string().trim().min(1, "Informe o professor."),
	distanceHours: z
		.number()
		.min(0, "Horas a distancia nao podem ser negativas."),
	SHFHours: z.number().min(0, "Horas SHF nao podem ser negativas."),
	scheduleText: z.string(),
});

const offeringFormSchema = z.object({
	destCode: z.string().trim().min(1, "Informe o codigo de destino."),
	vacancyCount: z.number().min(0, "As vagas nao podem ser negativas."),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;
type ClassFormValues = z.infer<typeof classFormSchema>;
type OfferingFormValues = z.infer<typeof offeringFormSchema>;

function scheduleToText(schedule: Schedule): string {
	return schedule
		.map(
			(item) =>
				`${item.day.slice(0, 3).toUpperCase()} ${item.slot.startHour.toString()}-${item.slot.endHour.toString()}`,
		)
		.join("  ");
}

function classSummary(courseClass: CourseClass): string {
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

function updateCourseCodeReferences(course: Course, nextCode: string): Course {
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

function CourseForm({
	initialValues,
	submitLabel,
	availableCourseCodes,
	onSubmit,
}: {
	initialValues: CourseFormValues;
	submitLabel: string;
	availableCourseCodes: string[];
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
							label="Precisa de pre-requisitos"
							placeholder="Marque quando a disciplina exigir pre-requisitos."
						/>
					)}
				</form.AppField>
			</div>
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
			<form.AppForm>
				<form.SubmitButton>{submitLabel}</form.SubmitButton>
			</form.AppForm>
		</form>
	);
}

function ClassForm({
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

function OfferingForm({
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

export function CoursesPage() {
	const courses = useAppStore((state) => state.courses);
	const setCourses = useAppStore((state) => state.setCourses);
	const upsertCourse = useAppStore((state) => state.upsertCourse);
	const deleteCourse = useAppStore((state) => state.deleteCourse);
	const [searchQuery, setSearchQuery] = useState("");
	const [editingCourseCode, setEditingCourseCode] = useState<string | null>(
		null,
	);
	const [classDialog, setClassDialog] = useState<{
		courseCode: string;
		initialClass?: CourseClass;
	} | null>(null);
	const [offeringDialog, setOfferingDialog] = useState<{
		courseCode: string;
		classCode: string;
		initialOffering?: ClassOffering;
	} | null>(null);

	const courseList = useMemo(() => getCourseList(courses), [courses]);
	const availableCourseCodes = useMemo(
		() => getAvailableCourseCodes(courses),
		[courses],
	);
	const visibleCourses = useMemo(() => {
		if (!searchQuery) {
			return courseList;
		}

		const query = searchQuery.toLowerCase();
		return courseList.filter(
			(course) =>
				course.code.toLowerCase().includes(query) ||
				course.name.toLowerCase().includes(query),
		);
	}, [courseList, searchQuery]);

	const handleCreateCourse = (values: CourseFormValues) => {
		if (courses[values.code]) {
			window.alert("Ja existe uma disciplina com esse codigo.");
			return;
		}

		upsertCourse({
			code: values.code,
			name: values.name,
			numCredits: values.numCredits,
			shouldHavePreRequisites: values.shouldHavePreRequisites,
			coRequisites: values.coRequisites.filter((code) => code !== values.code),
			classes: [],
		});
	};

	const handleUpdateCourse = (
		originalCode: string,
		values: CourseFormValues,
	) => {
		const existingCourse = courses[originalCode];
		if (!existingCourse) {
			return;
		}

		if (values.code !== originalCode && courses[values.code]) {
			window.alert("Ja existe uma disciplina com o codigo informado.");
			return;
		}

		const updatedCourse = updateCourseCodeReferences(
			existingCourse,
			values.code,
		);
		const nextCourse: Course = {
			...updatedCourse,
			name: values.name,
			numCredits: values.numCredits,
			shouldHavePreRequisites: values.shouldHavePreRequisites,
			coRequisites: values.coRequisites.filter((code) => code !== values.code),
		};

		if (values.code === originalCode) {
			upsertCourse(nextCourse);
		} else {
			const nextCourses = { ...courses };
			delete nextCourses[originalCode];
			nextCourses[values.code] = nextCourse;
			setCourses(nextCourses);
		}

		setEditingCourseCode(null);
	};

	const handleSaveClass = (
		courseCode: string,
		values: ClassFormValues,
		previousClassCode?: string,
	) => {
		const course = courses[courseCode];
		if (!course) {
			return;
		}

		const hasConflict = course.classes.some(
			(courseClass) =>
				courseClass.classCode === values.classCode &&
				courseClass.classCode !== previousClassCode,
		);

		if (hasConflict) {
			window.alert("Ja existe uma turma com esse codigo.");
			return;
		}

		const previousClass = previousClassCode
			? course.classes.find(
					(courseClass) => courseClass.classCode === previousClassCode,
				)
			: undefined;

		const nextClass: CourseClass = {
			classCode: values.classCode,
			courseCode,
			professorName: values.professorName,
			distanceHours: values.distanceHours,
			SHFHours: values.SHFHours,
			schedule: parseScheduleFromCSV(values.scheduleText),
			offerings:
				previousClass?.offerings.map((offering) => ({
					...offering,
					classCode: values.classCode,
				})) ?? [],
		};

		const nextCourse: Course = {
			...course,
			classes: previousClassCode
				? course.classes.map((courseClass) =>
						courseClass.classCode === previousClassCode
							? nextClass
							: courseClass,
					)
				: [...course.classes, nextClass],
		};

		upsertCourse(nextCourse);
		setClassDialog(null);
	};

	const handleDeleteClass = (courseCode: string, classCode: string) => {
		const course = courses[courseCode];
		if (!course) {
			return;
		}

		if (!window.confirm(`Remover a turma ${classCode}?`)) {
			return;
		}

		upsertCourse({
			...course,
			classes: course.classes.filter(
				(courseClass) => courseClass.classCode !== classCode,
			),
		});
	};

	const handleSaveOffering = (
		courseCode: string,
		classCode: string,
		values: OfferingFormValues,
		previousDestCode?: string,
	) => {
		const course = courses[courseCode];
		if (!course) {
			return;
		}

		const nextCourse: Course = {
			...course,
			classes: course.classes.map((courseClass) => {
				if (courseClass.classCode !== classCode) {
					return courseClass;
				}

				const hasConflict = courseClass.offerings.some(
					(offering) =>
						offering.destCode === values.destCode &&
						offering.destCode !== previousDestCode,
				);

				if (hasConflict) {
					throw new Error("Ja existe uma oferta com esse codigo de destino.");
				}

				const nextOffering: ClassOffering = {
					classCode,
					courseCode,
					destCode: values.destCode,
					vacancyCount: values.vacancyCount,
				};

				return {
					...courseClass,
					offerings: previousDestCode
						? courseClass.offerings.map((offering) =>
								offering.destCode === previousDestCode
									? nextOffering
									: offering,
							)
						: [...courseClass.offerings, nextOffering],
				};
			}),
		};

		upsertCourse(nextCourse);
		setOfferingDialog(null);
	};

	const handleDeleteOffering = (
		courseCode: string,
		classCode: string,
		destCode: string,
	) => {
		const course = courses[courseCode];
		if (!course) {
			return;
		}

		if (!window.confirm(`Remover a oferta ${destCode}?`)) {
			return;
		}

		upsertCourse({
			...course,
			classes: course.classes.map((courseClass) =>
				courseClass.classCode === classCode
					? {
							...courseClass,
							offerings: courseClass.offerings.filter(
								(offering) => offering.destCode !== destCode,
							),
						}
					: courseClass,
			),
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-1">
					<h2 className="text-3xl font-semibold tracking-tight">
						Gerenciamento de disciplinas
					</h2>
					<p className="text-muted-foreground">
						Adicione, revise e edite disciplinas, turmas e ofertas
					</p>
				</div>
				<div className="w-full max-w-sm">
					<div className="space-y-2 text-sm font-medium">
						<span>Pesquisar</span>
						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="INF1001 ou nome da disciplina"
						/>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Nova disciplina</CardTitle>
					<CardDescription>
						Cadastre disciplinas fora do CSV importado.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CourseForm
						initialValues={{
							code: "",
							name: "",
							numCredits: 0,
							shouldHavePreRequisites: false,
							coRequisites: [],
						}}
						submitLabel="Adicionar disciplina"
						availableCourseCodes={availableCourseCodes}
						onSubmit={handleCreateCourse}
					/>
				</CardContent>
			</Card>

			<div className="space-y-4">
				{visibleCourses.map((course) => (
					<Card key={course.code}>
						<CardHeader>
							<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
								<div className="space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<CardTitle>{`${course.code} - ${course.name}`}</CardTitle>
										<Badge variant="outline">
											{`${course.numCredits.toString()} creditos`}
										</Badge>
										<Badge variant="secondary">
											{`${course.classes.length.toString()} turmas`}
										</Badge>
									</div>
									<CardDescription>
										{course.shouldHavePreRequisites
											? "Disciplina com pre-requisitos."
											: "Disciplina sem pre-requisitos."}
									</CardDescription>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setEditingCourseCode((current) =>
												current === course.code ? null : course.code,
											)
										}
									>
										{editingCourseCode === course.code
											? "Fechar edicao"
											: "Editar disciplina"}
									</Button>
									<Button
										variant="outline"
										onClick={() =>
											setClassDialog({
												courseCode: course.code,
											})
										}
									>
										Adicionar turma
									</Button>
									<Button
										variant="destructive"
										onClick={() => {
											if (
												window.confirm(`Remover a disciplina ${course.code}?`)
											) {
												deleteCourse(course.code);
											}
										}}
									>
										Remover
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							{editingCourseCode === course.code ? (
								<CourseForm
									initialValues={{
										code: course.code,
										name: course.name,
										numCredits: course.numCredits,
										shouldHavePreRequisites: course.shouldHavePreRequisites,
										coRequisites: course.coRequisites,
									}}
									submitLabel="Salvar disciplina"
									availableCourseCodes={availableCourseCodes.filter(
										(code) => code !== course.code,
									)}
									onSubmit={(values) => handleUpdateCourse(course.code, values)}
								/>
							) : null}
							<div className="space-y-4">
								<div className="space-y-1">
									<h3 className="text-lg font-medium">Turmas</h3>
									<p className="text-sm text-muted-foreground">
										Cada turma pode concentrar varias ofertas com codigos de
										destino diferentes.
									</p>
								</div>
								{course.classes.length === 0 ? (
									<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
										Nenhuma turma cadastrada ainda.
									</div>
								) : (
									<div className="space-y-4">
										{course.classes.map((courseClass) => (
											<div
												key={courseClass.classCode}
												className="rounded-lg border p-4"
											>
												<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
													<div className="space-y-1">
														<h4 className="font-medium">
															{`${courseClass.classCode} - ${courseClass.professorName}`}
														</h4>
														<p className="text-sm text-muted-foreground">
															{classSummary(courseClass)}
														</p>
														<p className="text-xs text-muted-foreground">
															{`Distancia: ${courseClass.distanceHours.toString()}h | SHF: ${courseClass.SHFHours.toString()}h`}
														</p>
													</div>
													<div className="flex flex-wrap gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																setClassDialog({
																	courseCode: course.code,
																	initialClass: courseClass,
																})
															}
														>
															Editar turma
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																setOfferingDialog({
																	courseCode: course.code,
																	classCode: courseClass.classCode,
																})
															}
														>
															Adicionar oferta
														</Button>
														<Button
															variant="destructive"
															size="sm"
															onClick={() =>
																handleDeleteClass(
																	course.code,
																	courseClass.classCode,
																)
															}
														>
															Remover turma
														</Button>
													</div>
												</div>
												<Separator className="my-4" />
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<h5 className="font-medium">Ofertas</h5>
														<Badge variant="outline">
															{`${courseClass.offerings.length.toString()} ofertas`}
														</Badge>
													</div>
													{courseClass.offerings.length === 0 ? (
														<p className="text-sm text-muted-foreground">
															Esta turma ainda nao possui ofertas.
														</p>
													) : (
														<div className="space-y-2">
															{courseClass.offerings.map((offering) => (
																<div
																	key={offering.destCode}
																	className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
																>
																	<div className="space-y-1">
																		<p className="font-medium">
																			{offering.destCode}
																		</p>
																		<p className="text-sm text-muted-foreground">
																			{`${offering.vacancyCount.toString()} vagas`}
																		</p>
																	</div>
																	<div className="flex flex-wrap gap-2">
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={() =>
																				setOfferingDialog({
																					courseCode: course.code,
																					classCode: courseClass.classCode,
																					initialOffering: offering,
																				})
																			}
																		>
																			Editar oferta
																		</Button>
																		<Button
																			variant="destructive"
																			size="sm"
																			onClick={() =>
																				handleDeleteOffering(
																					course.code,
																					courseClass.classCode,
																					offering.destCode,
																				)
																			}
																		>
																			Remover oferta
																		</Button>
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				))}
				{visibleCourses.length === 0 ? (
					<div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
						Nenhuma disciplina encontrada para a busca atual.
					</div>
				) : null}
			</div>

			<Dialog
				open={classDialog !== null}
				onOpenChange={(open) => !open && setClassDialog(null)}
			>
				{classDialog ? (
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{classDialog.initialClass ? "Editar turma" : "Adicionar turma"}
							</DialogTitle>
							<DialogDescription>
								Preencha professor, horas e horario no formato de texto simples.
							</DialogDescription>
						</DialogHeader>
						<ClassForm
							initialValues={{
								classCode: classDialog.initialClass?.classCode ?? "",
								professorName: classDialog.initialClass?.professorName ?? "",
								distanceHours: classDialog.initialClass?.distanceHours ?? 0,
								SHFHours: classDialog.initialClass?.SHFHours ?? 0,
								scheduleText: classDialog.initialClass
									? scheduleToText(classDialog.initialClass.schedule)
									: "",
							}}
							submitLabel={
								classDialog.initialClass ? "Salvar turma" : "Adicionar turma"
							}
							onSubmit={(values) =>
								handleSaveClass(
									classDialog.courseCode,
									values,
									classDialog.initialClass?.classCode,
								)
							}
						/>
					</DialogContent>
				) : null}
			</Dialog>

			<Dialog
				open={offeringDialog !== null}
				onOpenChange={(open) => !open && setOfferingDialog(null)}
			>
				{offeringDialog ? (
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{offeringDialog.initialOffering
									? "Editar oferta"
									: "Adicionar oferta"}
							</DialogTitle>
							<DialogDescription>
								Defina o codigo de destino e o numero de vagas disponiveis.
							</DialogDescription>
						</DialogHeader>
						<OfferingForm
							initialValues={{
								destCode: offeringDialog.initialOffering?.destCode ?? "",
								vacancyCount: offeringDialog.initialOffering?.vacancyCount ?? 0,
							}}
							submitLabel={
								offeringDialog.initialOffering
									? "Salvar oferta"
									: "Adicionar oferta"
							}
							onSubmit={(values) => {
								try {
									handleSaveOffering(
										offeringDialog.courseCode,
										offeringDialog.classCode,
										values,
										offeringDialog.initialOffering?.destCode,
									);
								} catch (error) {
									window.alert(
										error instanceof Error
											? error.message
											: "Falha ao salvar oferta.",
									);
								}
							}}
						/>
					</DialogContent>
				) : null}
			</Dialog>
		</div>
	);
}
