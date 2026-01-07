import { Box, Button, Grid, Heading, Input, VStack } from "@chakra-ui/react";
import { ScheduleEditor } from "@components/ScheduleEditor";
import { useState } from "react";
import type { ClassOffering, CourseClass } from "@/types";

interface AddClassFormProps {
	onAddClass: (newClassData: Omit<CourseClass, "courseCode">) => void;
}

export function AddClassForm({ onAddClass }: AddClassFormProps) {
	const [newClass, setNewClass] = useState<
		Partial<CourseClass & ClassOffering>
	>({
		schedule: [],
	});

	const addClass = () => {
		const trimmedClassCode = newClass.classCode?.trim();
		const trimmedProfName = newClass.professorName?.trim();

		if (!trimmedClassCode || !trimmedProfName) {
			alert("Please provide the class code and professor name.");
			return;
		}

		const newClassData: Omit<CourseClass, "courseCode"> = {
			classCode: trimmedClassCode,
			professorName: trimmedProfName,
			schedule: newClass.schedule || [],
			distanceHours: newClass.distanceHours || 0,
			SHFHours: newClass.SHFHours || 0,
			offerings: [
				{
					classCode: trimmedClassCode,
					courseCode: "",
					destCode: newClass.destCode?.trim() || "",
					vacancyCount: newClass.vacancyCount || 0,
				},
			],
		};

		onAddClass(newClassData);
		setNewClass({ schedule: [] });
	};

	return (
		<Box
			p={4}
			my={4}
			borderWidth="1px"
			borderStyle="dashed"
			borderColor="gray.300"
			borderRadius="lg"
		>
			<Heading size="md" mb={3} color="gray.700">
				Adicionar Nova Turma
			</Heading>
			<VStack gap={4} align="stretch">
				<Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
					<Input
						placeholder="Código da Turma (e.g., 3WA)"
						value={newClass.classCode || ""}
						onChange={(e) => {
							setNewClass((prev) => ({ ...prev, classCode: e.target.value }));
						}}
					/>
					<Input
						placeholder="Nome do Professor"
						value={newClass.professorName || ""}
						onChange={(e) => {
							setNewClass((prev) => ({
								...prev,
								professorName: e.target.value,
							}));
						}}
					/>
				</Grid>

				<ScheduleEditor
					schedule={newClass.schedule || []}
					onChange={(schedule) => {
						setNewClass((prev) => ({ ...prev, schedule }));
					}}
				/>

				<Box>
					<Heading size="sm" mb={3} color="gray.700">
						Oferta da Turma
					</Heading>

					<Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
						<Input
							placeholder="Código de destino"
							value={newClass.destCode || ""}
							onChange={(e) => {
								setNewClass((prev) => ({ ...prev, destCode: e.target.value }));
							}}
						/>
						<Input
							type="number"
							min={0}
							placeholder="Quantidade de Vagas"
							value={newClass.vacancyCount || ""}
							onChange={(e) => {
								setNewClass((prev) => ({
									...prev,
									vacancyCount: parseInt(e.target.value, 10) || 0,
								}));
							}}
						/>
					</Grid>
				</Box>

				<Button onClick={addClass} colorPalette="blue" w="full">
					Adicionar Turma
				</Button>
			</VStack>
		</Box>
	);
}
