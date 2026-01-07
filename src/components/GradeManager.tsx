import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { GradeControls } from "@components/GradeControls";
import { GradeViewer } from "@components/GradeViewer";
import type React from "react";
import { useGradeNavigation } from "@/hooks/useGradeNavigation";
import type { Course, Grade } from "@/types";

interface GradeManagerProps {
	grades: Grade[];
	activeGrade: Grade | null;
	setActiveGrade: (grade: Grade | null) => void;
	allCourses: Record<string, Course>;
}

export const GradeManager: React.FC<GradeManagerProps> = ({
	grades,
	activeGrade,
	setActiveGrade,
	allCourses,
}) => {
	const { currentGradeIndex, goToPrevious, goToNext } = useGradeNavigation({
		totalGrades: grades.length,
		onGradeChange: (index: number) => {
			setActiveGrade(grades[index] || null);
		},
	});

	if (grades.length === 0) {
		return (
			<Box
				bg="white"
				p={6}
				borderRadius="lg"
				shadow="sm"
				border="1px solid"
				borderColor="gray.200"
			>
				<Heading size="md" mb={2}>
					Grades Disponíveis
				</Heading>
				<Text color="gray.600">
					Nenhuma grade disponível. As grades serão geradas automaticamente
					baseadas na lógica de otimização assim que você definir suas
					preferências e clicar em &quot;Gerar Grades&quot;.
				</Text>
			</Box>
		);
	}

	return (
		<Box
			bg="gray.50"
			p={{ base: 4, sm: 6 }}
			borderRadius="lg"
			borderWidth="1px"
			borderColor="gray.200"
			shadow="md"
		>
			<Flex
				direction={{ base: "column", sm: "row" }}
				justify="space-between"
				align={{ base: "stretch", sm: "center" }}
				mb={6}
				pb={4}
				borderBottomWidth="1px"
				borderColor="gray.200"
				gap={4}
			>
				<Heading size="lg">Grades Geradas</Heading>
				<GradeControls
					currentGradeIndex={currentGradeIndex}
					totalGrades={grades.length}
					goToPrevious={goToPrevious}
					goToNext={goToNext}
				/>
			</Flex>

			<Box>
				{activeGrade ? (
					<GradeViewer grade={activeGrade} allCourses={allCourses} />
				) : (
					<Text textAlign="center" color="gray.500">
						Selecione uma grade para ver os detalhes.
					</Text>
				)}
			</Box>
		</Box>
	);
};
