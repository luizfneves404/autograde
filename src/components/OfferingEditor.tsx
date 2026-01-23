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
			layerStyle="fill.subtle"
			borderWidth="1px"
			borderColor="blue.border"
			borderRadius="lg"
		>
			<Flex justify="space-between" align="center">
				<Flex gap={3} align="center">
					<Text fontWeight="bold">{offering.destCode}:</Text>
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
					<Text textStyle="sm">vagas</Text>
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
