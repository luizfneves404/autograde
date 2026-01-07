import {
	Box,
	Button,
	Flex,
	Heading,
	Input,
	NativeSelectField,
	NativeSelectRoot,
	Text,
	VStack,
} from "@chakra-ui/react";
import { formatTime } from "@utils/formatters";
import { useState } from "react";
import { DAYS } from "@/constants";

export type DayOfWeek =
	| "segunda"
	| "terça"
	| "quarta"
	| "quinta"
	| "sexta"
	| "sábado";

export interface TimeSlot {
	startHour: number;
	endHour: number;
}

export interface ClassTime {
	day: DayOfWeek;
	slot: TimeSlot;
}

export type Schedule = ClassTime[];

interface EditableClassTime {
	day?: DayOfWeek;
	slot?: Partial<TimeSlot>;
}

interface ScheduleEditorProps {
	schedule: Schedule;
	onChange: (schedule: Schedule) => void;
}

export function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
	const getInitialState = (): EditableClassTime => ({
		day: undefined,
		slot: {},
	});

	const [newClassTime, setNewClassTime] = useState<EditableClassTime>(
		getInitialState(),
	);

	const handleInputChange = (
		field: "day" | "startHour" | "endHour",
		value: string,
	) => {
		setNewClassTime((prev) => {
			if (field === "day") {
				return { ...prev, day: value as DayOfWeek };
			}

			const parsedValue = parseInt(value, 10);
			return {
				...prev,
				slot: {
					...prev.slot,
					[field]: isNaN(parsedValue) ? undefined : parsedValue,
				},
			};
		});
	};

	const addClassTime = () => {
		const { day, slot } = newClassTime;

		if (!day || slot?.startHour === undefined || slot?.endHour === undefined) {
			alert("Por favor, preencha todos os campos do horário.");
			return;
		}
		if (slot.startHour >= slot.endHour) {
			alert("A hora de início deve ser anterior à hora de término.");
			return;
		}

		onChange([...schedule, newClassTime as ClassTime]);
		setNewClassTime(getInitialState());
	};

	const removeClassTime = (index: number) => {
		onChange(schedule.filter((_, i) => i !== index));
	};

	return (
		<Box p={4} bg="gray.50" borderRadius="lg">
			<Heading size="sm" mb={3} color="gray.700">
				Horário de Aulas
			</Heading>

			<Flex
				direction={{ base: "column", sm: "row" }}
				gap={3}
				mb={4}
				p={3}
				borderWidth="1px"
				borderRadius="md"
			>
				<NativeSelectRoot flex={2}>
					<NativeSelectField
						value={newClassTime.day || ""}
						onChange={(e) => {
							handleInputChange("day", e.target.value);
						}}
					>
						<option value="">Selecione o Dia</option>
						{DAYS.map((day) => (
							<option key={day} value={day}>
								{day.charAt(0).toUpperCase() + day.slice(1)}
							</option>
						))}
					</NativeSelectField>
				</NativeSelectRoot>
				<Input
					type="number"
					min={0}
					max={23}
					placeholder="Início"
					value={newClassTime.slot?.startHour ?? ""}
					onChange={(e) => {
						handleInputChange("startHour", e.target.value);
					}}
					flex={1}
				/>
				<Input
					type="number"
					min={1}
					max={24}
					placeholder="Término"
					value={newClassTime.slot?.endHour ?? ""}
					onChange={(e) => {
						handleInputChange("endHour", e.target.value);
					}}
					flex={1}
				/>
				<Button onClick={addClassTime} colorPalette="blue">
					Adicionar
				</Button>
			</Flex>

			{schedule.length === 0 ? (
				<Box textAlign="center" py={4} color="gray.500" fontStyle="italic">
					Nenhum horário de aulas definido ainda.
				</Box>
			) : (
				<VStack gap={2} align="stretch">
					{schedule.map((ct, index) => (
						<Flex
							key={index}
							justify="space-between"
							align="center"
							px={3}
							py={2}
							bg="white"
							borderWidth="1px"
							borderColor="gray.200"
							borderRadius="md"
						>
							<Text fontWeight="medium" color="gray.800">
								{ct.day.charAt(0).toUpperCase() + ct.day.slice(1)}{" "}
								{formatTime(ct.slot.startHour)}-{formatTime(ct.slot.endHour)}
							</Text>
							<Button
								onClick={() => {
									removeClassTime(index);
								}}
								size="xs"
								colorPalette="red"
							>
								Remover
							</Button>
						</Flex>
					))}
				</VStack>
			)}
		</Box>
	);
}
