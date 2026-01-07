import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { useState } from "react";
import type { ClassOffering } from "@/types";

interface OfferingEditorProps {
	offering: ClassOffering;
	onSave: (updatedData: Partial<Pick<ClassOffering, "vacancyCount">>) => void;
	onCancel: () => void;
}

function OfferingEditor({ offering, onSave, onCancel }: OfferingEditorProps) {
	const [vacancies, setVacancies] = useState(offering.vacancyCount);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave({ vacancyCount: vacancies });
	};

	return (
		<Box
			as="form"
			onSubmit={handleSubmit}
			p={2}
			bg="blue.50"
			borderWidth="1px"
			borderColor="blue.200"
			borderRadius="lg"
		>
			<Flex justify="space-between" align="center">
				<Flex gap={3} align="center">
					<Text fontWeight="bold" color="blue.800">
						{offering.destCode}:
					</Text>
					<Input
						type="number"
						value={vacancies}
						onChange={(e) => {
							setVacancies(parseInt(e.target.value, 10) || 0);
						}}
						w="24"
						textAlign="center"
						autoFocus
					/>
					<Text fontSize="sm" color="blue.700">
						vagas
					</Text>
				</Flex>

				<Flex gap={2}>
					<Button type="submit" size="sm" colorPalette="green">
						✅
					</Button>
					<Button type="button" onClick={onCancel} size="sm" colorPalette="red">
						❌
					</Button>
				</Flex>
			</Flex>
		</Box>
	);
}

export default OfferingEditor;
