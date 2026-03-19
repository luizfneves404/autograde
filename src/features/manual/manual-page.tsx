import { useMemo, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppForm } from "@/features/forms/use-app-form";
import { GradeTable } from "@/features/grades/grade-table";
import { useAppStore } from "@/stores/app-store";
import { getAvailableClasses } from "@/stores/selectors";
import type { CourseClass, Grade } from "@/types";
import {
	type EvaluationResult,
	enrichClass,
	evaluateConstraint,
} from "@/utils/gradeOptimizer";

const manualGradeSchema = z.object({
	selectedClassIds: z
		.array(z.string())
		.min(1, "Selecione pelo menos uma turma."),
});

function classId(courseClass: CourseClass): string {
	return `${courseClass.courseCode}-${courseClass.classCode}`;
}

export function ManualPage() {
	const courses = useAppStore((state) => state.courses);
	const preferenceSet = useAppStore((state) => state.preferenceSet);
	const availableClasses = useMemo(
		() => getAvailableClasses(courses),
		[courses],
	);
	const [evaluationResult, setEvaluationResult] =
		useState<EvaluationResult | null>(null);
	const [selectedClasses, setSelectedClasses] = useState<CourseClass[]>([]);

	const classOptions = availableClasses.map((courseClass) => ({
		label: `${courseClass.courseCode}-${courseClass.classCode}`,
		value: classId(courseClass),
		description: courseClass.professorName,
	}));

	const classMap = useMemo(
		() =>
			new Map<string, CourseClass>(
				availableClasses.map((courseClass) => [
					classId(courseClass),
					courseClass,
				]),
			),
		[availableClasses],
	);

	const form = useAppForm({
		defaultValues: {
			selectedClassIds: selectedClasses.map(classId),
		},
		validators: {
			onChange: manualGradeSchema,
		},
		onSubmit: ({ value }) => {
			const classes = value.selectedClassIds.flatMap((id) => {
				const found = classMap.get(id);
				return found ? [found] : [];
			});

			const evaluation = evaluateConstraint(
				{
					op: "and",
					children: preferenceSet.hardConstraints
						.filter((constraint) => constraint.enabled)
						.map((constraint) => constraint.expression),
				},
				classes.map((courseClass) => enrichClass(courseClass, courses)),
				"explain",
			);

			setSelectedClasses(classes);
			setEvaluationResult(evaluation);
		},
	});

	const displayGrade: Grade = {
		classes: selectedClasses,
	};

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h2 className="text-3xl font-semibold tracking-tight">Grade manual</h2>
				<p className="text-muted-foreground">
					Monte combinacoes manualmente e compare o resultado com as restricoes
					ativas.
				</p>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
				<Card>
					<CardHeader>
						<CardTitle>Selecionar turmas</CardTitle>
						<CardDescription>
							As turmas escolhidas sao avaliadas contra as restricoes ativas.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							className="space-y-4"
							onSubmit={(event) => {
								event.preventDefault();
								void form.handleSubmit();
							}}
						>
							<form.AppField name="selectedClassIds">
								{(field) => (
									<field.CheckboxGroupField
										label="Turmas disponiveis"
										options={classOptions}
										emptyMessage="Importe disciplinas antes de montar uma grade."
									/>
								)}
							</form.AppField>
							<form.AppForm>
								<form.SubmitButton>Analisar grade manual</form.SubmitButton>
							</form.AppForm>
						</form>
					</CardContent>
				</Card>

				<div className="space-y-6">
					{selectedClasses.length > 0 ? (
						<GradeTable
							grade={displayGrade}
							allCourses={courses}
							description="Visualizacao da grade montada manualmente."
						/>
					) : (
						<Card>
							<CardHeader>
								<CardTitle>Nenhuma grade montada</CardTitle>
								<CardDescription>
									Escolha turmas no painel lateral para montar a grade.
								</CardDescription>
							</CardHeader>
						</Card>
					)}

					{evaluationResult ? (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<CardTitle>Analise das restricoes</CardTitle>
									<Badge
										variant={
											evaluationResult.satisfied ? "default" : "destructive"
										}
									>
										{evaluationResult.satisfied ? "Aprovada" : "Com conflitos"}
									</Badge>
								</div>
								<CardDescription>
									{evaluationResult.satisfied
										? "A grade atende as restricoes ativas."
										: "A grade viola uma ou mais restricoes ativas."}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{evaluationResult.reasons.map((reason, index) => (
									<div
										key={`${reason}-${index.toString()}`}
										className="space-y-3"
									>
										<p className="text-sm">{reason}</p>
										{index < evaluationResult.reasons.length - 1 ? (
											<Separator />
										) : null}
									</div>
								))}
							</CardContent>
						</Card>
					) : null}
				</div>
			</div>
		</div>
	);
}
