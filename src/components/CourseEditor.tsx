import {
	Box,
	Button,
	Field,
	Flex,
	Grid,
	Heading,
	Input,
	VStack,
} from "@chakra-ui/react";
import { PrerequisiteInput } from "@components/PrerequisiteInput";
import { useState } from "react";
import type { Course } from "@/types";

interface CourseEditorProps {
	course: Course;
	courses: Record<string, Course>;
	onSave: (course: Course) => void;
	onCancel: () => void;
}

export function CourseEditor({
	course,
	courses,
	onSave,
	onCancel,
}: CourseEditorProps) {
	const [edited, setEdited] = useState<Course>({ ...course });

	const handleSave = () => {
		if (!edited.code.trim() || !edited.name.trim()) {
			alert("Por favor, preencha ambos o código e o nome");
			return;
		}
		if (isNaN(edited.numCredits) || edited.numCredits <= 0) {
			alert("Por favor, insira um número de créditos válido.");
			return;
		}
		onSave(edited);
	};

	return (
		<Box
			p={4}
			bg="gray.50"
			borderRadius="lg"
			borderWidth="1px"
			borderColor="blue.200"
		>
			<Heading size="md" mb={4} color="gray.800">
				Editando: {course.code}
			</Heading>
			<VStack gap={4} align="stretch">
				<Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
					<Field.Root>
						<Field.Label>Código</Field.Label>
						<Input
							value={edited.code}
							onChange={(e) => {
								setEdited((prev) => ({ ...prev, code: e.target.value }));
							}}
							placeholder="Ex: MAB123"
						/>
					</Field.Root>

					<Field.Root>
						<Field.Label>Nome da Disciplina</Field.Label>
						<Input
							value={edited.name}
							onChange={(e) => {
								setEdited((prev) => ({ ...prev, name: e.target.value }));
							}}
							placeholder="Ex: Cálculo I"
						/>
					</Field.Root>

					<Field.Root>
						<Field.Label>Créditos</Field.Label>
						<Input
							type="number"
							value={edited.numCredits}
							onChange={(e) => {
								const credits = parseInt(e.target.value, 10) || 0;
								setEdited((prev) => ({ ...prev, numCredits: credits }));
							}}
							min={0}
						/>
					</Field.Root>
				</Grid>

				<PrerequisiteInput
					courses={courses}
					selected={edited.coRequisites}
					onChange={(coRequisites) => {
						setEdited((prev) => ({ ...prev, coRequisites }));
					}}
					label="Co-requisitos"
					placeholder="Códigos de disciplinas que devem ser puxadas com esta (se A requer B, adicione B à lista de A)"
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
