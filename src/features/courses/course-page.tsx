import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
	ClassForm,
	type ClassFormValues,
	CourseForm,
	type CourseFormValues,
	classSummary,
	emptyClassFormValues,
	emptyOfferingFormValues,
	OfferingForm,
	type OfferingFormValues,
	scheduleToText,
	updateCourseCodeReferences,
} from "@/features/courses/course-forms";
import { useAppStore } from "@/stores/app-store";
import { getAvailableCourseCodes } from "@/stores/selectors";
import type { ClassOffering, Course, CourseClass } from "@/types";
import { parseScheduleFromCSV } from "@/utils/csvParser";

const routeApi = getRouteApi("/courses/$courseCode");

function getCourseFormKey(course: Course): string {
	return [
		course.code,
		course.name,
		course.numCredits,
		course.shouldHavePreRequisites,
		course.coRequisites.join("|"),
	].join("::");
}

function getClassFormKey(courseClass: CourseClass): string {
	return [
		courseClass.classCode,
		courseClass.professorName,
		courseClass.distanceHours,
		courseClass.SHFHours,
		scheduleToText(courseClass.schedule),
	].join("::");
}

function getOfferingFormKey(offering: ClassOffering): string {
	return [offering.classCode, offering.destCode, offering.vacancyCount].join(
		"::",
	);
}

export function CoursePage() {
	const navigate = useNavigate();
	const { courseCode } = routeApi.useParams();
	const search = routeApi.useSearch();
	const courses = useAppStore((state) => state.courses);
	const setCourses = useAppStore((state) => state.setCourses);
	const upsertCourse = useAppStore((state) => state.upsertCourse);
	const deleteCourse = useAppStore((state) => state.deleteCourse);
	const [newClassFormKey, setNewClassFormKey] = useState(0);
	const [newOfferingFormKeys, setNewOfferingFormKeys] = useState<
		Record<string, number>
	>({});

	const course = courses[courseCode];
	const availableCourseCodes = useMemo(
		() => getAvailableCourseCodes(courses),
		[courses],
	);

	const resetNewOfferingForm = (classCode: string) => {
		setNewOfferingFormKeys((current) => ({
			...current,
			[classCode]: (current[classCode] ?? 0) + 1,
		}));
	};

	if (!course) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Disciplina nao encontrada</CardTitle>
					<CardDescription>
						A disciplina solicitada nao existe mais ou o codigo informado e
						invalido.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild>
						<Link to="/courses" search={search}>
							Voltar para disciplinas
						</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const handleUpdateCourse = (values: CourseFormValues) => {
		if (values.code !== courseCode && courses[values.code]) {
			window.alert("Ja existe uma disciplina com o codigo informado.");
			return;
		}

		const updatedCourse = updateCourseCodeReferences(course, values.code);
		const nextCourse: Course = {
			...updatedCourse,
			name: values.name,
			numCredits: values.numCredits,
			shouldHavePreRequisites: values.shouldHavePreRequisites,
			coRequisites: values.coRequisites.filter((code) => code !== values.code),
		};

		if (values.code === courseCode) {
			upsertCourse(nextCourse);
			return;
		}

		const nextCourses = { ...courses };
		delete nextCourses[courseCode];
		nextCourses[values.code] = nextCourse;
		setCourses(nextCourses);
		void navigate({
			to: "/courses/$courseCode",
			params: { courseCode: values.code },
			search,
		});
	};

	const handleDeleteCourse = () => {
		if (!window.confirm(`Remover a disciplina ${course.code}?`)) {
			return;
		}

		deleteCourse(course.code);
		void navigate({ to: "/courses", search });
	};

	const handleSaveClass = (
		values: ClassFormValues,
		previousClassCode?: string,
	) => {
		const currentCourse = courses[courseCode];
		if (!currentCourse) {
			return;
		}

		const hasConflict = currentCourse.classes.some(
			(courseClass) =>
				courseClass.classCode === values.classCode &&
				courseClass.classCode !== previousClassCode,
		);
		if (hasConflict) {
			window.alert("Ja existe uma turma com esse codigo.");
			return;
		}

		const previousClass = previousClassCode
			? currentCourse.classes.find(
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

		upsertCourse({
			...currentCourse,
			classes: previousClassCode
				? currentCourse.classes.map((courseClass) =>
						courseClass.classCode === previousClassCode
							? nextClass
							: courseClass,
					)
				: [...currentCourse.classes, nextClass],
		});

		if (!previousClassCode) {
			setNewClassFormKey((current) => current + 1);
		}
	};

	const handleDeleteClass = (classCode: string) => {
		const currentCourse = courses[courseCode];
		if (!currentCourse) {
			return;
		}

		if (!window.confirm(`Remover a turma ${classCode}?`)) {
			return;
		}

		upsertCourse({
			...currentCourse,
			classes: currentCourse.classes.filter(
				(courseClass) => courseClass.classCode !== classCode,
			),
		});
	};

	const handleSaveOffering = (
		classCode: string,
		values: OfferingFormValues,
		previousDestCode?: string,
	) => {
		const currentCourse = courses[courseCode];
		if (!currentCourse) {
			return;
		}

		const nextCourse: Course = {
			...currentCourse,
			classes: currentCourse.classes.map((courseClass) => {
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

		if (!previousDestCode) {
			resetNewOfferingForm(classCode);
		}
	};

	const handleDeleteOffering = (classCode: string, destCode: string) => {
		const currentCourse = courses[courseCode];
		if (!currentCourse) {
			return;
		}

		if (!window.confirm(`Remover a oferta ${destCode}?`)) {
			return;
		}

		upsertCourse({
			...currentCourse,
			classes: currentCourse.classes.map((courseClass) =>
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
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-2">
					<Button asChild variant="outline">
						<Link to="/courses" search={search}>
							Voltar para disciplinas
						</Link>
					</Button>
					<div className="space-y-1">
						<h2 className="text-3xl font-semibold tracking-tight">
							{`${course.code} - ${course.name}`}
						</h2>
						<p className="text-muted-foreground">
							Visualize e edite a disciplina, suas turmas e suas ofertas.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">{`${course.numCredits.toString()} creditos`}</Badge>
						<Badge variant="secondary">{`${course.classes.length.toString()} turmas`}</Badge>
					</div>
				</div>
				<Button variant="destructive" onClick={handleDeleteCourse}>
					Remover disciplina
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Dados da disciplina</CardTitle>
					<CardDescription>
						Atualize os campos e envie para salvar as alteracoes da disciplina.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CourseForm
						key={getCourseFormKey(course)}
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
						onSubmit={handleUpdateCourse}
					/>
				</CardContent>
			</Card>

			<div className="space-y-4">
				<div className="space-y-1">
					<h3 className="text-2xl font-semibold tracking-tight">Turmas</h3>
					<p className="text-muted-foreground">
						Cada turma pode concentrar varias ofertas com codigos de destino
						diferentes.
					</p>
				</div>

				{course.classes.length === 0 ? (
					<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
						Nenhuma turma cadastrada ainda.
					</div>
				) : null}

				{course.classes.map((courseClass) => (
					<Card key={courseClass.classCode}>
						<CardHeader>
							<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
								<div className="space-y-1">
									<CardTitle>{courseClass.classCode}</CardTitle>
									<CardDescription>{classSummary(courseClass)}</CardDescription>
								</div>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => handleDeleteClass(courseClass.classCode)}
								>
									Remover turma
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							<ClassForm
								key={getClassFormKey(courseClass)}
								initialValues={{
									classCode: courseClass.classCode,
									professorName: courseClass.professorName,
									distanceHours: courseClass.distanceHours,
									SHFHours: courseClass.SHFHours,
									scheduleText: scheduleToText(courseClass.schedule),
								}}
								submitLabel="Salvar turma"
								onSubmit={(values) =>
									handleSaveClass(values, courseClass.classCode)
								}
							/>

							<div className="space-y-4">
								<div className="space-y-1">
									<h4 className="text-lg font-medium">Ofertas</h4>
									<p className="text-sm text-muted-foreground">
										Edite cada oferta diretamente e salve quando terminar.
									</p>
								</div>

								{courseClass.offerings.length === 0 ? (
									<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
										Esta turma ainda nao possui ofertas.
									</div>
								) : null}

								{courseClass.offerings.map((offering) => (
									<div
										key={offering.destCode}
										className="space-y-4 rounded-lg border p-4"
									>
										<div className="flex items-center justify-between gap-3">
											<div className="space-y-1">
												<p className="font-medium">{offering.destCode}</p>
												<p className="text-sm text-muted-foreground">
													{`${offering.vacancyCount.toString()} vagas`}
												</p>
											</div>
											<Button
												variant="destructive"
												size="sm"
												onClick={() =>
													handleDeleteOffering(
														courseClass.classCode,
														offering.destCode,
													)
												}
											>
												Remover oferta
											</Button>
										</div>
										<OfferingForm
											key={getOfferingFormKey(offering)}
											initialValues={{
												destCode: offering.destCode,
												vacancyCount: offering.vacancyCount,
											}}
											submitLabel="Salvar oferta"
											onSubmit={(values) => {
												try {
													handleSaveOffering(
														courseClass.classCode,
														values,
														offering.destCode,
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
									</div>
								))}

								<div className="rounded-lg border border-dashed p-4">
									<div className="mb-4 space-y-1">
										<h5 className="font-medium">Nova oferta</h5>
										<p className="text-sm text-muted-foreground">
											Cadastre uma nova oferta para esta turma.
										</p>
									</div>
									<OfferingForm
										key={`${courseClass.classCode}-${newOfferingFormKeys[courseClass.classCode] ?? 0}`}
										initialValues={emptyOfferingFormValues}
										submitLabel="Adicionar oferta"
										onSubmit={(values) => {
											try {
												handleSaveOffering(courseClass.classCode, values);
											} catch (error) {
												window.alert(
													error instanceof Error
														? error.message
														: "Falha ao salvar oferta.",
												);
											}
										}}
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				))}

				<Card>
					<CardHeader>
						<CardTitle>Nova turma</CardTitle>
						<CardDescription>
							Adicione uma nova turma para esta disciplina.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ClassForm
							key={newClassFormKey}
							initialValues={emptyClassFormValues}
							submitLabel="Adicionar turma"
							onSubmit={(values) => handleSaveClass(values)}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
