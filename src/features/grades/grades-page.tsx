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
import { GradeTable } from "@/features/grades/grade-table";
import { useAppStore } from "@/stores/app-store";

export function GradesPage() {
	const courses = useAppStore((state) => state.courses);
	const grades = useAppStore((state) => state.grades);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const visibleGrades = useMemo(() => grades.slice(0, 50), [grades]);
	const currentGrade = visibleGrades[selectedIndex];

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h2 className="text-3xl font-semibold tracking-tight">
					Grades geradas
				</h2>
			</div>

			{visibleGrades.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Nenhuma grade gerada ainda</CardTitle>
						<CardDescription>
							Importe dados, ajuste preferências e clique em gerar grades no
							cabecalho.
						</CardDescription>
					</CardHeader>
				</Card>
			) : (
				<>
					<Card>
						<CardHeader>
							<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
								<div className="space-y-1">
									<CardTitle>Navegacao das grades</CardTitle>
									<CardDescription>
										{`${visibleGrades.length.toString()} resultados carregados (limite visual de 50).`}
									</CardDescription>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setSelectedIndex((current) => Math.max(current - 1, 0))
										}
										disabled={selectedIndex === 0}
									>
										Anterior
									</Button>
									<Badge variant="secondary">
										{`Grade ${(selectedIndex + 1).toString()} de ${visibleGrades.length.toString()}`}
									</Badge>
									<Button
										variant="outline"
										onClick={() =>
											setSelectedIndex((current) =>
												Math.min(current + 1, visibleGrades.length - 1),
											)
										}
										disabled={selectedIndex === visibleGrades.length - 1}
									>
										Proxima
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-2">
							{visibleGrades.map((grade, index) => {
								const key = grade.classes
									.map(
										(courseClass) =>
											`${courseClass.courseCode}-${courseClass.classCode}`,
									)
									.sort()
									.join("|");

								return (
									<Button
										key={key}
										variant={index === selectedIndex ? "default" : "outline"}
										size="sm"
										onClick={() => setSelectedIndex(index)}
									>
										{`Opcao ${(index + 1).toString()}`}
									</Button>
								);
							})}
						</CardContent>
					</Card>

					{currentGrade ? (
						<GradeTable
							grade={currentGrade}
							allCourses={courses}
							description={`Visualizando a grade ${(selectedIndex + 1).toString()}.`}
						/>
					) : null}
				</>
			)}
		</div>
	);
}
