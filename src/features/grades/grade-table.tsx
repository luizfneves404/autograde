import type { ReactNode } from "react";
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
import { cn } from "@/lib/utils";
import type { Course, DayOfWeek, Grade } from "@/types";

const dayLabels: Record<DayOfWeek, string> = {
	segunda: "Segunda",
	terça: "Terca",
	quarta: "Quarta",
	quinta: "Quinta",
	sexta: "Sexta",
	sábado: "Sabado",
};

const cellDivider = "border-r border-border last:border-r-0";

/** Fixed geometry so switching grades does not shift row/column sizes. */
const rowHeight = "h-8";
const slotInner =
	"flex min-h-0 h-full max-h-8 flex-col justify-center gap-0 overflow-hidden px-0.5 py-0";

function ScheduleSlotCell({ children }: { children: ReactNode }) {
	return <div className={slotInner}>{children}</div>;
}

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
				<div className="overflow-hidden rounded-md border border-border">
					<Table className="table-fixed w-full border-collapse text-xs">
						<colgroup>
							<col style={{ width: "5.25rem" }} />
							{DAYS.map((day) => (
								<col
									key={day}
									style={{ width: "calc((100% - 5.25rem) / 6)" }}
								/>
							))}
						</colgroup>
						<TableHeader>
							<TableRow className="h-7 border-b border-border hover:bg-transparent">
								<TableHead
									className={cn(
										cellDivider,
										"h-7 px-1 py-0 align-middle text-xs font-medium tabular-nums bg-muted/40 text-foreground",
									)}
								>
									Hora
								</TableHead>
								{DAYS.map((day) => (
									<TableHead
										key={day}
										className={cn(
											cellDivider,
											"h-7 px-1 py-0 align-middle text-xs font-medium bg-muted/40 text-foreground",
										)}
									>
										{dayLabels[day]}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{hourSlots.map((hour) => (
								<TableRow
									key={hour}
									className={cn("border-b border-border", rowHeight)}
								>
									<TableCell
										className={cn(
											cellDivider,
											"p-1 align-middle font-medium tabular-nums whitespace-nowrap",
										)}
									>
										<ScheduleSlotCell>
											{`${hour.toString()}:00-${(hour + 1).toString()}:00`}
										</ScheduleSlotCell>
									</TableCell>
									{DAYS.map((day) => {
										const courseClass = scheduleMap.get(
											`${day}-${hour.toString()}`,
										);
										return (
											<TableCell
												key={`${day}-${hour.toString()}`}
												className={cn(cellDivider, "p-1 align-middle")}
											>
												<ScheduleSlotCell>
													{courseClass ? (
														<>
															<div className="truncate leading-none font-medium">
																{courseClass.courseCode}
															</div>
															<div className="truncate text-[0.65rem] leading-none text-muted-foreground">
																{courseClass.classCode}
															</div>
														</>
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</ScheduleSlotCell>
											</TableCell>
										);
									})}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
