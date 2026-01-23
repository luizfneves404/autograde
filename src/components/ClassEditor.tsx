import {
	Box,
	Button,
	Flex,
	Grid,
	Heading,
	Input,
	VStack,
} from "@chakra-ui/react";
import { ScheduleEditor } from "@components/ScheduleEditor";
import { useState } from "react";
import type { CourseClass } from "@/types";

interface ClassEditorProps {
	courseClass: CourseClass;
	onSave: (courseClass: CourseClass) => void;
	onCancel: () => void;
}

export function ClassEditor({
	courseClass,
	onSave,
	onCancel,
}: ClassEditorProps) {
	const [edited, setEdited] = useState<CourseClass>({ ...courseClass });

	const handleSave = () => {
		if (!edited.classCode.trim() || !edited.professorName.trim()) {
			alert("Please provide the class code and professor name.");
			return;
		}
		onSave(edited);
	};

	const handleOfferingChange = (
		field: "destCode" | "vacancyCount",
		value: string | number,
	) => {
		const newOfferings = [...edited.offerings];

		if (newOfferings[0]) {
			newOfferings[0] = { ...newOfferings[0], [field]: value };
			setEdited((prev) => ({ ...prev, offerings: newOfferings }));
		}
	};

	return (
		<Box
			p={4}
			layerStyle="fill.subtle"
			borderRadius="lg"
			borderWidth="1px"
			borderColor="blue.border"
		>
			<Heading size="md" mb={4}>
				Editing Class: {courseClass.classCode} ({courseClass.courseCode})
			</Heading>
			<VStack gap={4} align="stretch">
				<Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
					<Input
						value={edited.classCode}
						onChange={(e) => {
							setEdited((prev) => ({ ...prev, classCode: e.target.value }));
						}}
						placeholder="Class Code"
					/>
					<Input
						value={edited.professorName}
						onChange={(e) => {
							setEdited((prev) => ({ ...prev, professorName: e.target.value }));
						}}
						placeholder="Professor Name"
					/>
				</Grid>

				<Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
					<Input
						value={edited.offerings[0]?.destCode || ""}
						onChange={(e) => {
							handleOfferingChange("destCode", e.target.value);
						}}
						placeholder="Código de destino"
					/>
					<Input
						type="number"
						min={0}
						value={edited.offerings[0]?.vacancyCount || ""}
						onChange={(e) => {
							handleOfferingChange(
								"vacancyCount",
								parseInt(e.target.value, 10) || 0,
							);
						}}
						placeholder="Vagas"
					/>
				</Grid>

				<ScheduleEditor
					schedule={edited.schedule}
					onChange={(schedule) => {
						setEdited((prev) => ({ ...prev, schedule }));
					}}
				/>

				<Flex justify="flex-end" gap={4} mt={4}>
					<Button onClick={onCancel} variant="outline">
						Cancelar
					</Button>
					<Button onClick={handleSave} colorPalette="blue">
						Salvar Alterações
					</Button>
				</Flex>
			</VStack>
		</Box>
	);
}
