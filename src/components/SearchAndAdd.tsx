import {
	Badge,
	Box,
	Button,
	Combobox,
	Flex,
	Portal,
	Text,
	useFilter,
	useListCollection,
} from "@chakra-ui/react";
import { useMemo } from "react";

interface SearchAndAddProps {
	label: string;
	placeholder: string;
	allItems: readonly string[];
	selectedItems: readonly string[];
	onSelectionChange: (newSelection: string[]) => void;
}

function SearchAndAdd({
	label,
	placeholder,
	allItems,
	selectedItems,
	onSelectionChange,
}: SearchAndAddProps) {
	const { contains } = useFilter({ sensitivity: "base" });

	const items = useMemo(
		() =>
			allItems.map((item) => ({
				label: item,
				value: item,
			})),
		[allItems],
	);

	const { collection, filter } = useListCollection({
		initialItems: items,
		filter: contains,
		itemToString: (item) => item.label,
		itemToValue: (item) => item.value,
	});

	const handleValueChange = (details: Combobox.ValueChangeDetails) => {
		onSelectionChange(details.value);
	};

	const handleInputValueChange = (
		details: Combobox.InputValueChangeDetails,
	) => {
		filter(details.inputValue);
	};

	return (
		<Box>
			<Text textStyle="sm" fontWeight="medium" mb={2}>
				{label}
			</Text>
			{selectedItems.length > 0 && (
				<Flex wrap="wrap" gap={2} mb={2} minH="8">
					{selectedItems.map((item) => (
						<Badge key={item} size="lg" colorPalette="blue">
							{item}
							<Button
								type="button"
								onClick={() => {
									onSelectionChange(selectedItems.filter((i) => i !== item));
								}}
								size="xs"
								variant="ghost"
								ml={1}
							>
								✕
							</Button>
						</Badge>
					))}
				</Flex>
			)}

			<Combobox.Root
				collection={collection}
				value={[...selectedItems]}
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
									{item.label}
									<Combobox.ItemIndicator />
								</Combobox.Item>
							))}
						</Combobox.Content>
					</Combobox.Positioner>
				</Portal>
			</Combobox.Root>
		</Box>
	);
}

export default SearchAndAdd;
