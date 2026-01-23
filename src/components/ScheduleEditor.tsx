import {
	Box,
	Button,
	Combobox,
	createListCollection,
	Field,
	Flex,
	Heading,
	Input,
	Portal,
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

	const dayCollection = createListCollection({
		items: DAYS.map((day) => ({
			label: day.charAt(0).toUpperCase() + day.slice(1),
			value: day,
		})),
	});

	const handleDayChange = (details: Combobox.ValueChangeDetails) => {
		if (details.value.length > 0) {
			setNewClassTime((prev) => ({
				...prev,
				day: details.value[0] as DayOfWeek,
			}));
		} else {
			setNewClassTime((prev) => ({ ...prev, day: undefined }));
		}
	};

	const handleInputChange = (field: "startHour" | "endHour", value: string) => {
		const parsedValue = parseInt(value, 10);
		setNewClassTime((prev) => ({
			...prev,
			slot: {
				...prev.slot,
				[field]: Number.isNaN(parsedValue) ? undefined : parsedValue,
			},
		}));
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
		<Box p={4} layerStyle="fill.subtle" borderRadius="lg">
			<Heading size="sm" mb={3}>
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
				<Box flex={2}>
					<Combobox.Root
						collection={dayCollection}
						value={newClassTime.day ? [newClassTime.day] : []}
						onValueChange={handleDayChange}
						placeholder="Selecione o Dia"
					>
						<Combobox.Control>
							<Combobox.Input />
							<Combobox.IndicatorGroup>
								<Combobox.ClearTrigger />
								<Combobox.Trigger />
							</Combobox.IndicatorGroup>
						</Combobox.Control>
						<Portal>
							<Combobox.Positioner>
								<Combobox.Content>
									{dayCollection.items.map((item) => (
										<Combobox.Item item={item} key={item.value}>
											{item.label}
											<Combobox.ItemIndicator />
										</Combobox.Item>
									))}
								</Combobox.Content>
							</Combobox.Positioner>
						</Portal>
					</Combobox.Root>
				</Box>
				<Field.Root flex={1}>
					<Field.Label srOnly>Hora de Início</Field.Label>
					<Input
						type="number"
						min={0}
						max={23}
						placeholder="Início"
						value={newClassTime.slot?.startHour ?? ""}
						onChange={(e) => {
							handleInputChange("startHour", e.target.value);
						}}
					/>
				</Field.Root>
				<Field.Root flex={1}>
					<Field.Label srOnly>Hora de Término</Field.Label>
					<Input
						type="number"
						min={1}
						max={24}
						placeholder="Término"
						value={newClassTime.slot?.endHour ?? ""}
						onChange={(e) => {
							handleInputChange("endHour", e.target.value);
						}}
					/>
				</Field.Root>
				<Button onClick={addClassTime} colorPalette="blue">
					Adicionar
				</Button>
			</Flex>

			{schedule.length === 0 ? (
				<Box textAlign="center" py={4} color="fg.subtle" fontStyle="italic">
					Nenhum horário de aulas definido ainda.
				</Box>
			) : (
				<VStack gap={2} align="stretch">
					{schedule.map((ct, index) => (
						<Flex
							key={`${ct.day}-${ct.slot.startHour}-${ct.slot.endHour}`}
							justify="space-between"
							align="center"
							px={3}
							py={2}
							bg="bg"
							borderWidth="1px"
							borderColor="border.muted"
							borderRadius="md"
						>
							<Text fontWeight="medium">
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
