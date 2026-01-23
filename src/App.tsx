import {
	Accordion,
	Box,
	Button,
	Container,
	DownloadTrigger,
	FileUpload,
	Flex,
	Heading,
	Span,
	Tabs,
	Text,
	VStack,
} from "@chakra-ui/react";

import { CourseManager } from "@components/CourseManager";
import { GradeManager } from "@components/GradeManager";
import { ManualGradeCreator } from "@components/ManualGradeCreator";
import { PreferenceManager } from "@components/PreferenceManager";
import { HiUpload } from "react-icons/hi";
import { useAppData } from "@/hooks/useAppData";
import type { AppData } from "@/types";

function App() {
	const {
		courses,
		setCourses,
		preferenceSet,
		setPreferenceSet,
		grades,
		handleJsonImport,
		handleCsvImport,
		handleGenerateGrades,
		availableCourseCodes,
		availableClasses,
		availableProfessors,
		availableDestCodes,
	} = useAppData();

	const dataToExport: AppData = { courses, preferenceSet };
	const appDataBlob = new Blob([JSON.stringify(dataToExport, null, 2)], {
		type: "application/json",
	});

	const items = [
		{ value: "a", title: "First Item", text: "gvugutgkcvugkcvhjtk" },
		{ value: "b", title: "Second Item", text: "gvjhtydfchgc" },
		{ value: "c", title: "Third Item", text: "hgylguiyfgvf" },
	];
	<Accordion.Root collapsible defaultValue={["b"]}>
		{items.map((item, index) => (
			<Accordion.Item key={index} value={item.value}>
				<Box position="relative">
					<Accordion.ItemTrigger>
						<Span flex="1">{item.title}</Span>
						<Accordion.ItemIndicator />
					</Accordion.ItemTrigger>
				</Box>
				<Accordion.ItemContent>
					<Accordion.ItemBody>
						<Flex direction={"column"}>
							<Text>{item.text}</Text>
							<Button variant="subtle" colorPalette="blue">
								Action
							</Button>
						</Flex>
					</Accordion.ItemBody>
				</Accordion.ItemContent>
			</Accordion.Item>
		))}
	</Accordion.Root>;

	return (
		<Container py={8}>
			<VStack gap={8} align="stretch">
				{/* Header */}
				<Box textAlign="center">
					<Heading size="2xl">AutoGrade</Heading>
					<Text fontSize="xl" color="fg.muted">
						Seu assistente inteligente para otimização de grades horárias
					</Text>
				</Box>

				{/* Navigation and Content */}
				<Tabs.Root defaultValue="courses">
					<Flex justify="space-between">
						<Tabs.List>
							<Tabs.Trigger value="courses">📚 Disciplinas</Tabs.Trigger>
							<Tabs.Trigger value="grades">
								⚡ Grades & Preferências
							</Tabs.Trigger>
							<Tabs.Trigger value="manual">✏️ Grade Manual</Tabs.Trigger>
						</Tabs.List>

						<Flex>
							<FileUpload.Root
								accept={["application/json", ".json"]}
								maxFiles={1}
							>
								<FileUpload.HiddenInput onChange={handleJsonImport} />
								<FileUpload.Trigger asChild>
									<Button variant="outline">
										<HiUpload /> Importar
									</Button>
								</FileUpload.Trigger>
							</FileUpload.Root>
							<DownloadTrigger
								data={appDataBlob}
								fileName={`autograde_data_${new Date().toISOString()}.json`}
								mimeType="application/json"
								asChild
							>
								<Button variant="outline">💾 Exportar</Button>
							</DownloadTrigger>
							<Button onClick={handleGenerateGrades} colorPalette="blue">
								⚡ Gerar Grades
							</Button>
						</Flex>
					</Flex>

					{/* Main Content Area */}
					<Tabs.Content value="courses">
						<CourseManager
							courses={courses}
							onCoursesChange={setCourses}
							importCSV={handleCsvImport}
						/>
					</Tabs.Content>

					<Tabs.Content value="grades">
						<Flex direction={{ base: "column", xl: "row" }} gap={8}>
							<GradeManager grades={grades} allCourses={courses} />
							<PreferenceManager
								preferenceSet={preferenceSet}
								onPreferenceSetChange={setPreferenceSet}
								availableCourseCodes={availableCourseCodes}
								availableProfessors={availableProfessors}
								availableDestCodes={availableDestCodes}
							/>
						</Flex>
					</Tabs.Content>

					<Tabs.Content value="manual">
						<ManualGradeCreator
							allCourses={courses}
							availableClasses={availableClasses}
							preferenceSet={preferenceSet}
						/>
					</Tabs.Content>
				</Tabs.Root>
			</VStack>
		</Container>
	);
}

export default App;
