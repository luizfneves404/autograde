import {
	Box,
	Button,
	Flex,
	Heading,
	Input,
	Textarea,
	VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { UIConstraint } from "@/types";
import { isExprNode } from "@/utils/isExprNode";

interface PreferenceCardProps {
	constraint: UIConstraint;
	onRemove: () => void;
	onUpdate: (updates: Partial<UIConstraint>) => void;
}

function PreferenceCard({
	constraint,
	onRemove,
	onUpdate,
}: PreferenceCardProps) {
	const [isAdvancedViewOpen, setAdvancedViewOpen] = useState(false);

	const [jsonString, setJsonString] = useState(
		JSON.stringify(constraint.expression, null, 2),
	);
	const [isJsonValid, setIsJsonValid] = useState(true);

	useEffect(() => {
		setJsonString(JSON.stringify(constraint.expression, null, 2));
		setIsJsonValid(true);
	}, [constraint.expression]);

	const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newJsonString = e.target.value;
		setJsonString(newJsonString);

		try {
			const parsedJson: unknown = JSON.parse(newJsonString);

			if (isExprNode(parsedJson)) {
				onUpdate({ expression: parsedJson });
				setIsJsonValid(true);
			} else {
				setIsJsonValid(false);
			}
		} catch (_) {
			setIsJsonValid(false);
		}
	};

	return (
		<Box
			bg="white"
			p={4}
			borderRadius="lg"
			shadow="sm"
			borderWidth="1px"
			borderLeftWidth="4px"
			borderColor="gray.200"
			borderLeftColor={constraint.enabled ? "green.500" : "gray.300"}
			opacity={constraint.enabled ? 1 : 0.6}
		>
			<Flex
				direction={{ base: "column", lg: "row" }}
				justify="space-between"
				align="flex-start"
				gap={4}
			>
				<VStack flex={1} align="stretch" gap={2} mb={2}>
					<Input
						value={constraint.name}
						onChange={(e) => {
							onUpdate({ name: e.target.value });
						}}
						fontSize="lg"
						fontWeight="semibold"
						color="gray.800"
						bg="transparent"
						borderBottomWidth="1px"
						borderColor="transparent"
						_focus={{ borderColor: "blue.500" }}
						placeholder="Nome da Preferência"
						variant="outline"
					/>
					<Textarea
						value={constraint.description}
						onChange={(e) => {
							onUpdate({ description: e.target.value });
						}}
						fontSize="sm"
						color="gray.700"
						bg="transparent"
						borderBottomWidth="1px"
						borderColor="transparent"
						_focus={{ borderColor: "blue.500" }}
						placeholder="Descrição"
						rows={2}
						resize="none"
						variant="outline"
					/>
					<Button
						onClick={() => {
							setAdvancedViewOpen((prev) => !prev);
						}}
						size="sm"
						colorPalette={isAdvancedViewOpen ? "blue" : "gray"}
						alignSelf="flex-start"
					>
						{isAdvancedViewOpen ? "Ocultar Detalhes" : "Ver Detalhes"}
					</Button>
				</VStack>
				<Flex direction={{ base: "row", sm: "row" }} gap={3}>
					<Button
						onClick={() => {
							onUpdate({ enabled: !constraint.enabled });
						}}
						size="sm"
						w="24"
						colorPalette={constraint.enabled ? "green" : "gray"}
					>
						{constraint.enabled ? "Ativo" : "Inativo"}
					</Button>
					<Button onClick={onRemove} size="sm" colorPalette="red">
						Remover
					</Button>
				</Flex>
			</Flex>

			{isAdvancedViewOpen && (
				<Box mt={4} p={3} bg="gray.100" borderRadius="md">
					<Heading size="xs" color="gray.700" mb={2}>
						Expressão da Restrição (JSON)
					</Heading>
					<Textarea
						value={jsonString}
						onChange={handleJsonChange}
						fontFamily="mono"
						fontSize="xs"
						bg="gray.800"
						color="gray.200"
						borderRadius="lg"
						rows={10}
						spellCheck={false}
						borderWidth={isJsonValid ? "1px" : "2px"}
						borderColor={isJsonValid ? "gray.600" : "red.500"}
						_focus={{
							borderColor: isJsonValid ? "blue.500" : "red.500",
						}}
					/>
					{!isJsonValid && (
						<Box fontSize="xs" color="red.500" mt={1}>
							A sintaxe do JSON é inválida.
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
}

export default PreferenceCard;
