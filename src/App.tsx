import {
	Box,
	Button,
	Container,
	Flex,
	Heading,
	Input,
	Text,
	VStack,
} from "@chakra-ui/react";
import { CourseManager } from "@components/CourseManager";
import { GradeManager } from "@components/GradeManager";
import { ManualGradeCreator } from "@components/ManualGradeCreator";
import { PreferenceManager } from "@components/PreferenceManager";
import { useAppData } from "@/hooks/useAppData";

function App() {
	const {
		view,
		setView,
		courses,
		setCourses,
		preferenceSet,
		setPreferenceSet,
		grades,
		activeGrade,
		setActiveGrade,
		handleJsonImport,
		handleCsvImport,
		handleExport,
		handleGenerateGrades,
		availableCourseCodes,
		availableClasses,
		availableProfessors,
		availableDestCodes,
	} = useAppData();

	return (
		<Box minH="100vh" bg="gray.50">
			<Container maxW="container.xl" py={8}>
				<VStack gap={8} align="stretch">
					{/* Header */}
					<Box textAlign="center">
						<Heading size="2xl" mb={2}>
							AutoGrade
						</Heading>
						<Text fontSize="xl" color="gray.600">
							Seu assistente inteligente para otimização de grades horárias
						</Text>
					</Box>

					{/* Navigation */}
					<Box
						bg="white"
						p={6}
						borderRadius="lg"
						shadow="sm"
						border="1px solid"
						borderColor="gray.200"
					>
						<Flex
							direction={{ base: "column", md: "row" }}
							gap={4}
							justify="space-between"
							align="center"
						>
							{/* Tab Buttons */}
							<Flex gap={2} wrap="wrap">
								<Button
									onClick={() => setView("courses")}
									variant={view === "courses" ? "solid" : "outline"}
									colorPalette={view === "courses" ? "blue" : "gray"}
								>
									📚 Disciplinas
								</Button>
								<Button
									onClick={() => setView("grades")}
									variant={view === "grades" ? "solid" : "outline"}
									colorPalette={view === "grades" ? "blue" : "gray"}
								>
									⚡ Grades & Preferências
								</Button>
								<Button
									onClick={() => setView("manual")}
									variant={view === "manual" ? "solid" : "outline"}
									colorPalette={view === "manual" ? "blue" : "gray"}
								>
									✏️ Grade Manual
								</Button>
							</Flex>

							{/* Action Buttons */}
							<Flex gap={3} wrap="wrap">
								<Button as="label" variant="outline" cursor="pointer">
									📁 Importar
									<Input
										type="file"
										display="none"
										accept=".json"
										onChange={handleJsonImport}
									/>
								</Button>

								<Button onClick={handleExport} variant="outline">
									💾 Exportar
								</Button>

								<Button
									onClick={handleGenerateGrades}
									colorPalette="blue"
									fontWeight="semibold"
								>
									⚡ Gerar Grades
								</Button>
							</Flex>
						</Flex>
					</Box>

					{/* Main Content */}
					<Box>
						{view === "courses" && (
							<CourseManager
								courses={courses}
								onCoursesChange={setCourses}
								importCSV={handleCsvImport}
							/>
						)}

						{view === "grades" && (
							<Flex direction={{ base: "column", xl: "row" }} gap={8}>
								<Box flex={1}>
									<GradeManager
										grades={grades}
										activeGrade={activeGrade}
										setActiveGrade={setActiveGrade}
										allCourses={courses}
									/>
								</Box>
								<Box flex={1}>
									<PreferenceManager
										preferenceSet={preferenceSet}
										onPreferenceSetChange={setPreferenceSet}
										availableCourseCodes={availableCourseCodes}
										availableProfessors={availableProfessors}
										availableDestCodes={availableDestCodes}
									/>
								</Box>
							</Flex>
						)}

						{view === "manual" && (
							<ManualGradeCreator
								allCourses={courses}
								availableClasses={availableClasses}
								preferenceSet={preferenceSet}
							/>
						)}
					</Box>
				</VStack>
			</Container>
		</Box>
	);
}

export default App;
