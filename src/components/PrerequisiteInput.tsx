import {
	Box,
	Combobox,
	Field,
	Portal,
	Text,
	useFilter,
	useListCollection,
} from "@chakra-ui/react";
import { useMemo } from "react";
import type { Course } from "@/types";

interface PrerequisiteInputProps {
	courses: Record<string, Course>;
	selected: string[];
	onChange: (codes: string[]) => void;
	label: string;
	placeholder?: string;
}

type CourseItem = {
	label: string;
	value: string;
	course: Course;
};

export function PrerequisiteInput({
	courses,
	selected,
	onChange,
	label,
	placeholder,
}: PrerequisiteInputProps) {
	const { contains } = useFilter({ sensitivity: "base" });

	const items = useMemo<CourseItem[]>(
		() =>
			Object.values(courses).map((course) => ({
				label: `${course.code} - ${course.name}`,
				value: course.code,
				course,
			})),
		[courses],
	);

	const { collection, filter } = useListCollection<CourseItem>({
		initialItems: items,
		filter: (_itemText: string, filterText: string, item: CourseItem) => {
			const queryLower = filterText.toLowerCase();
			return (
				contains(item.course.code, queryLower) ||
				contains(item.course.name, queryLower)
			);
		},
		itemToString: (item) => item.label,
		itemToValue: (item) => item.value,
	});

	const handleValueChange = (details: Combobox.ValueChangeDetails) => {
		onChange(details.value);
	};

	const handleInputValueChange = (
		details: Combobox.InputValueChangeDetails,
	) => {
		filter(details.inputValue);
	};

	return (
		<Field.Root>
			<Field.Label>{`${label}:`}</Field.Label>
			<Combobox.Root
				collection={collection}
				value={selected}
				onValueChange={handleValueChange}
				onInputValueChange={handleInputValueChange}
				multiple
				closeOnSelect
			>
				<Combobox.Control>
					<Combobox.Input placeholder={placeholder} />
					<Combobox.IndicatorGroup>
						<Combobox.ClearTrigger />
						<Combobox.Trigger />
					</Combobox.IndicatorGroup>
				</Combobox.Control>
				<Portal>
					<Combobox.Positioner>
						<Combobox.Content>
							<Combobox.Empty>Nenhum resultado encontrado.</Combobox.Empty>
							{collection.items.map((item) => (
								<Combobox.Item item={item} key={item.value}>
									<Text as="span" fontWeight="bold">
										{item.course.code}
									</Text>{" "}
									- {item.course.name}
									<Combobox.ItemIndicator />
								</Combobox.Item>
							))}
						</Combobox.Content>
					</Combobox.Positioner>
				</Portal>
			</Combobox.Root>
			{selected.length > 0 && (
				<Box mt={2} textStyle="sm" color="fg.muted">
					<Text as="span" fontWeight="semibold">
						Selecionado:
					</Text>{" "}
					{selected
						.map((code) => {
							const course = courses[code];
							return course
								? `${code} (${course.name})`
								: `${code} (não encontrada)`;
						})
						.join(", ")}
				</Box>
			)}
		</Field.Root>
	);
}
