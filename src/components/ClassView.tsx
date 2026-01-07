import { Box, Text, VStack } from "@chakra-ui/react";
import { formatSchedule } from "@utils/formatters";
import type { CourseClass } from "@/types";

interface ClassViewProps {
	courseClass: CourseClass;
}

export function ClassView({ courseClass }: ClassViewProps) {
	return (
		<Box>
			<Box mb={2}>
				<Text fontWeight="semibold" color="gray.800">
					{courseClass.classCode}
				</Text>
			</Box>

			<VStack gap={1} align="stretch" fontSize="sm" color="gray.600">
				<Text>
					<Text as="span" fontWeight="semibold">
						Professor:
					</Text>{" "}
					{courseClass.professorName}
				</Text>
				<Text>
					<Text as="span" fontWeight="semibold">
						Horário:
					</Text>{" "}
					{formatSchedule(courseClass.schedule)}
				</Text>
			</VStack>
		</Box>
	);
}
