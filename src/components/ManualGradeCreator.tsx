import {
	Box,
	Button,
	Card,
	Flex,
	Heading,
	Text,
	VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useMemo, useState } from "react";
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

	return (
		<Flex direction={{ base: "column", lg: "row" }} gap={6}>
			{/* Left Panel: Controls for building the grade */}
			<Card.Root variant="outline" flex={{ base: "1", lg: "1 1 33%" }}>
				<Card.Header>
					<Heading size="md">Montar Grade</Heading>
				</Card.Header>
				<Card.Body>
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
								setEvaluationResult(null);
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
				</Card.Body>
			</Card.Root>

			{/* Right Panel: Display for the schedule and violations */}
			<Card.Root
				variant="outline"
				flex={{ base: "1", lg: "1 1 67%" }}
				layerStyle="fill.subtle"
				shadow="md"
				minH="md"
			>
				<Card.Header>
					<Heading size="lg">Visualização da Grade</Heading>
				</Card.Header>
				<Card.Body>
					{selectedClasses.length > 0 ? (
						<>
							<Box borderTopWidth="1px" borderColor="border.muted" pt={6}>
								<GradeViewer grade={displayGrade} allCourses={allCourses} />
							</Box>
							{evaluationResult && (
								<Box
									mt={6}
									borderTopWidth="1px"
									borderColor="border.muted"
									pt={6}
								>
									<Heading size="md" mb={3}>
										Resultado da Análise de Preferências
									</Heading>
									<Text color="fg.muted">
										{evaluationResult.satisfied
											? "As preferências foram atendidas."
											: "As preferências não foram atendidas."}
									</Text>
									<Box as="ul" listStyleType="disc" pl={5} mt={2}>
										{evaluationResult.reasons.map((r) => (
											<Box as="li" key={r} textStyle="sm">
												{r}
											</Box>
										))}
									</Box>
								</Box>
							)}
						</>
					) : (
						<Flex align="center" justify="center" h="full">
							<Text color="fg.subtle" textAlign="center" py={10}>
								Adicione disciplinas para começar a montar sua grade.
							</Text>
						</Flex>
					)}
				</Card.Body>
			</Card.Root>
		</Flex>
	);
};
