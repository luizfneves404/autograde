import { Badge, Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";

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
	const [query, setQuery] = useState("");

	const handleAddItem = (item: string) => {
		if (!selectedItems.includes(item)) {
			onSelectionChange([...selectedItems, item]);
		}
		setQuery("");
	};

	const handleRemoveItem = (itemToRemove: string) => {
		onSelectionChange(selectedItems.filter((item) => item !== itemToRemove));
	};

	const filteredItems = useMemo(() => {
		if (!query) return [];
		return allItems
			.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
			.filter((item) => !selectedItems.includes(item))
			.slice(0, 7);
	}, [query, allItems, selectedItems]);

	return (
		<Box>
			<Text fontSize="sm" fontWeight="medium" mb={2}>
				{label}
			</Text>
			<Flex wrap="wrap" gap={2} mb={2} minH="8">
				{selectedItems.map((item) => (
					<Badge key={item} size="lg" colorPalette="blue">
						{item}
						<Button
							type="button"
							onClick={() => {
								handleRemoveItem(item);
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

			<Box position="relative">
				<Input
					type="text"
					placeholder={placeholder}
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
					}}
				/>
				{query && (
					<Box
						position="absolute"
						zIndex={10}
						w="full"
						bg="white"
						borderWidth="1px"
						borderRadius="md"
						mt={1}
						shadow="lg"
						maxH="60"
						overflowY="auto"
					>
						{filteredItems.length > 0 ? (
							filteredItems.map((item) => (
								<Box key={item}>
									<Button
										type="button"
										onClick={() => {
											handleAddItem(item);
										}}
										w="full"
										textAlign="left"
										p={2}
										variant="ghost"
										justifyContent="flex-start"
									>
										{item}
									</Button>
								</Box>
							))
						) : (
							<Box p={2} fontSize="sm" color="gray.500">
								Nenhum resultado encontrado.
							</Box>
						)}
					</Box>
				)}
			</Box>
		</Box>
	);
}

export default SearchAndAdd;
