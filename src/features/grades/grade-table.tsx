import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DAYS } from "@/constants";
import { useGradeSchedule } from "@/hooks/useGradeSchedule";
import type { Course, DayOfWeek, Grade } from "@/types";

const dayLabels: Record<DayOfWeek, string> = {
	segunda: "Segunda",
	terça: "Terca",
	quarta: "Quarta",
	quinta: "Quinta",
	sexta: "Sexta",
	sábado: "Sabado",
};

export function GradeTable({
	grade,
	allCourses,
	title = "Detalhes da grade",
	description,
}: {
	grade: Grade;
	allCourses: Record<string, Course>;
	title?: string;
	description?: string;
}) {
	const { scheduleMap, hourSlots, totalCreditos } = useGradeSchedule({
		grade,
		allCourses,
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>
					{description ?? `Carga total: ${totalCreditos.toString()} creditos`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Hora</TableHead>
							{DAYS.map((day) => (
								<TableHead key={day}>{dayLabels[day]}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{hourSlots.map((hour) => (
							<TableRow key={hour}>
								<TableCell className="font-medium">{`${hour.toString()}:00 - ${(hour + 1).toString()}:00`}</TableCell>
								{DAYS.map((day) => {
									const courseClass = scheduleMap.get(
										`${day}-${hour.toString()}`,
									);
									return (
										<TableCell key={`${day}-${hour.toString()}`}>
											{courseClass ? (
												<div className="space-y-1">
													<div className="font-medium">
														{courseClass.courseCode}
													</div>
													<div className="text-xs text-muted-foreground">
														{courseClass.classCode}
													</div>
												</div>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</TableCell>
									);
								})}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
