import { Box, Card, Heading, Table, Text } from "@chakra-ui/react";
import type React from "react";
import { DAYS } from "@/constants";
import { useGradeSchedule } from "@/hooks/useGradeSchedule";
import type { Course, DayOfWeek, Grade } from "@/types";

interface GradeViewerProps {
	grade: Grade;
	allCourses: Record<string, Course>;
}

const DAY_NAMES: Record<DayOfWeek, string> = {
	segunda: "Segunda",
	terça: "Terça",
	quarta: "Quarta",
	quinta: "Quinta",
	sexta: "Sexta",
	sábado: "Sábado",
};

export const GradeViewer: React.FC<GradeViewerProps> = ({
	grade,
	allCourses,
}) => {
	const { scheduleMap, hourSlots, totalCreditos } = useGradeSchedule({
		grade,
		allCourses,
	});

	const renderCell = (day: DayOfWeek, hour: number) => {
		const key = `${day}-${hour.toString()}`;
		const courseClass = scheduleMap.get(key);

		if (!courseClass) {
			return <Table.Cell key={key} layerStyle="fill.subtle" />;
		}

		return (
			<Table.Cell key={key} textAlign="center" bg="bg">
				<Box>
					<Text
						fontWeight="bold"
						textStyle="2xs"
						color="blue.fg"
						wordBreak="break-all"
						lineHeight="shorter"
					>
						{courseClass.courseCode}
					</Text>
					<Text
						textStyle="2xs"
						color="fg.muted"
						wordBreak="break-all"
						lineHeight="shorter"
					>
						{courseClass.classCode}
					</Text>
				</Box>
			</Table.Cell>
		);
	};

	return (
		<Card.Root variant="outline">
			<Card.Header>
				<Heading size="lg">Detalhes da Grade</Heading>
				<Text textStyle="md" color="fg.muted">
					<Text as="span" fontWeight="semibold">
						Número de créditos:
					</Text>{" "}
					{totalCreditos}
				</Text>
			</Card.Header>
			<Card.Body>
				<Table.Root size="sm" variant="outline">
					<Table.Header>
						<Table.Row>
							<Table.ColumnHeader textAlign="left">Hora</Table.ColumnHeader>
							{DAYS.map((day) => (
								<Table.ColumnHeader key={day} textAlign="center">
									{DAY_NAMES[day]}
								</Table.ColumnHeader>
							))}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{hourSlots.map((hour) => (
							<Table.Row key={hour}>
								<Table.Cell
									fontWeight="semibold"
									textAlign="center"
									layerStyle="fill.muted"
								>
									{`${hour.toString()}:00 - ${(hour + 1).toString()}:00`}
								</Table.Cell>
								{DAYS.map((day) => renderCell(day, hour))}
							</Table.Row>
						))}
					</Table.Body>
				</Table.Root>
			</Card.Body>
		</Card.Root>
	);
};
