import { Box, Button, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import type { Course, CourseClass, Grade, PreferenceSet } from "@/types";
import {
	type EvaluationResult,
	enrichClass,
	evaluateConstraint,
} from "@/utils/gradeOptimizer";
import { GradeViewer } from "./GradeViewer";
import SearchAndAdd from "./SearchAndAdd";

interface ManualGradeCreatorProps {
	allCourses: Record<string, Course>;
	availableClasses: CourseClass[];
	preferenceSet: PreferenceSet;
}

export const ManualGradeCreator: React.FC<ManualGradeCreatorProps> = ({
	allCourses,
	availableClasses,
	preferenceSet,
}) => {
	const [selectedClasses, setSelectedClasses] = useState<CourseClass[]>([]);

	const [evaluationResult, setEvaluationResult] =
		useState<EvaluationResult | null>(null);

	const displayGrade: Grade = {
		classes: selectedClasses,
	};

	const classMap = useMemo(() => {
		return new Map<string, CourseClass>(
			availableClasses.map((c) => {
				return [`${c.courseCode}-${c.classCode}`, c];
			}),
		);
	}, [availableClasses]);

	const handleCheckPreferences = () => {
		const evaluation = evaluateConstraint(
			{
				op: "and",
				children: preferenceSet.hardConstraints.map((c) => c.expression),
			},
			displayGrade.classes.map((c) => enrichClass(c, allCourses)),
			"explain",
		);
		setEvaluationResult(evaluation);
	};

	React.useEffect(() => {
		setEvaluationResult(null);
	}, [selectedClasses]);

	return (
		<Flex direction={{ base: "column", lg: "row" }} gap={6}>
			{/* Left Panel: Controls for building the grade */}
			<Box
				flex={{ base: "1", lg: "1 1 33%" }}
				bg="white"
				p={6}
				borderRadius="lg"
				shadow="sm"
				border="1px solid"
				borderColor="gray.200"
			>
				<Heading size="md" mb={4}>
					Montar Grade
				</Heading>
				<VStack gap={6} align="stretch">
					<SearchAndAdd
						label="Adicionar Turmas"
						placeholder="Buscar por código da disciplina e turma..."
						allItems={availableClasses.map((c) => {
							return `${c.courseCode}-${c.classCode}`;
						})}
						selectedItems={selectedClasses.map((c) => {
							return `${c.courseCode}-${c.classCode}`;
						})}
						onSelectionChange={(newSelection: string[]) => {
							const selected = newSelection.flatMap((id) => {
								const foundClass = classMap.get(id);
								return foundClass ? [foundClass] : [];
							});
							setSelectedClasses(selected);
						}}
					/>
					<Button
						onClick={handleCheckPreferences}
						colorPalette="blue"
						w="full"
						disabled={selectedClasses.length === 0}
					>
						Analisar Preferências
					</Button>
				</VStack>
			</Box>

			{/* Right Panel: Display for the schedule and violations */}
			<Box
				flex={{ base: "1", lg: "1 1 67%" }}
				bg="gray.50"
				p={{ base: 4, sm: 6 }}
				borderRadius="lg"
				borderWidth="1px"
				borderColor="gray.200"
				shadow="md"
				minH="md"
			>
				<Heading size="lg" mb={4}>
					Visualização da Grade
				</Heading>
				{selectedClasses.length > 0 ? (
					<>
						<Box borderTopWidth="1px" borderColor="gray.200" pt={6}>
							<GradeViewer grade={displayGrade} allCourses={allCourses} />
						</Box>
						{evaluationResult && (
							<Box mt={6} borderTopWidth="1px" borderColor="gray.200" pt={6}>
								<Heading size="md" mb={3} color="gray.800">
									Resultado da Análise de Preferências
								</Heading>
								<Text color="gray.600">
									{evaluationResult.satisfied
										? "As preferências foram atendidas."
										: "As preferências não foram atendidas."}
								</Text>
								<Box as="ul" listStyleType="disc" pl={5} mt={2}>
									{evaluationResult.reasons.map((r, index) => (
										<Box as="li" key={index} fontSize="sm" color="gray.700">
											{r}
										</Box>
									))}
								</Box>
							</Box>
						)}
					</>
				) : (
					<Flex align="center" justify="center" h="full">
						<Text color="gray.500" textAlign="center" py={10}>
							Adicione disciplinas para começar a montar sua grade.
						</Text>
					</Flex>
				)}
			</Box>
		</Flex>
	);
};
