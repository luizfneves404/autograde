import { Box, Heading, Table, Text } from "@chakra-ui/react";
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
			return <Table.Cell key={key} bg="gray.50" />;
		}

		return (
			<Table.Cell key={key} textAlign="center" bg="white">
				<Box>
					<Text
						fontWeight="bold"
						fontSize="xs"
						color="blue.700"
						lineHeight="tight"
						wordBreak="break-all"
					>
						{courseClass.courseCode}
					</Text>
					<Text
						fontSize="xs"
						color="gray.600"
						lineHeight="tight"
						wordBreak="break-all"
					>
						{courseClass.classCode}
					</Text>
				</Box>
			</Table.Cell>
		);
	};

	return (
		<Box
			bg="white"
			p={6}
			borderRadius="lg"
			shadow="sm"
			border="1px solid"
			borderColor="gray.200"
		>
			<Box mb={4}>
				<Heading size="lg" color="gray.800">
					Detalhes da Grade
				</Heading>
				<Text fontSize="md" color="gray.600">
					<Text as="span" fontWeight="semibold">
						Número de créditos:
					</Text>{" "}
					{totalCreditos}
				</Text>
			</Box>

			<Box overflowX="auto">
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
									p={2}
									fontWeight="semibold"
									textAlign="center"
									color="gray.700"
									bg="gray.100"
								>
									{`${hour.toString()}:00 - ${(hour + 1).toString()}:00`}
								</Table.Cell>
								{DAYS.map((day) => renderCell(day, hour))}
							</Table.Row>
						))}
					</Table.Body>
				</Table.Root>
			</Box>
		</Box>
	);
};
