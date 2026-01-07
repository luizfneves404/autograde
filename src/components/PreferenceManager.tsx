import {
	Badge,
	Box,
	Button,
	Checkbox,
	Flex,
	Grid,
	Heading,
	Separator,
	Text,
	VStack,
} from "@chakra-ui/react";
import AddPreferenceForm from "@components/AddPreferenceForm";
import { useMemo, useState } from "react";
import type { PreferenceSet, UIConstraint } from "@/types";
import { getDestCodeName } from "@/utils/destCodes";
import PreferenceCard from "./PreferenceCard";

interface PreferenceManagerProps {
	preferenceSet: PreferenceSet;
	onPreferenceSetChange: (preferenceSet: PreferenceSet) => void;
	availableDestCodes: string[];
	availableProfessors: string[];
	availableCourseCodes: string[];
}

export function PreferenceManager({
	preferenceSet,
	onPreferenceSetChange,
	availableDestCodes,
	availableProfessors,
	availableCourseCodes,
}: PreferenceManagerProps) {
	const [pendingDestCodes, setPendingDestCodes] = useState<string[]>(
		preferenceSet.userDestCodes,
	);

	const addConstraint = (constraint: UIConstraint) => {
		onPreferenceSetChange({
			...preferenceSet,
			hardConstraints: [...preferenceSet.hardConstraints, constraint],
		});
	};

	const removeConstraint = (id: string) => {
		onPreferenceSetChange({
			...preferenceSet,
			hardConstraints: preferenceSet.hardConstraints.filter((c) => c.id !== id),
		});
	};

	const updateConstraint = (id: string, updates: Partial<UIConstraint>) => {
		onPreferenceSetChange({
			...preferenceSet,
			hardConstraints: preferenceSet.hardConstraints.map((c) =>
				c.id === id ? { ...c, ...updates } : c,
			),
		});
	};

	const clearConstraints = () => {
		if (window.confirm("Tem certeza que deseja remover todas as restrições?")) {
			onPreferenceSetChange({
				...preferenceSet,
				hardConstraints: [],
			});
		}
	};

	const sortedAvailableDestCodes = useMemo(() => {
		return [...availableDestCodes].sort((a, b) =>
			getDestCodeName(a).localeCompare(getDestCodeName(b)),
		);
	}, [availableDestCodes]);

	const handleDestCodeToggle = (code: string) => {
		setPendingDestCodes((current) =>
			current.includes(code)
				? current.filter((c) => c !== code)
				: [...current, code],
		);
	};

	const handleSaveDestCodes = () => {
		onPreferenceSetChange({
			...preferenceSet,
			userDestCodes: pendingDestCodes,
		});
	};

	const summary = useMemo(
		() => ({
			total: preferenceSet.hardConstraints.length,
			active: preferenceSet.hardConstraints.filter((p) => p.enabled).length,
		}),
		[preferenceSet],
	);

	return (
		<VStack gap={6} align="stretch">
			<Heading size="xl">Gerenciador de Preferências</Heading>

			{/* DestCode Selection */}
			<Box
				bg="white"
				p={6}
				borderRadius="lg"
				shadow="sm"
				border="1px solid"
				borderColor="gray.200"
			>
				<Heading size="md" mb={4}>
					Códigos de Destino
				</Heading>

				<Box>
					<Heading size="sm" color="gray.700" mb={2}>
						Códigos Salvos:
					</Heading>
					<Flex wrap="wrap" gap={2}>
						{preferenceSet.userDestCodes.length > 0 ? (
							preferenceSet.userDestCodes.map((code) => (
								<Badge key={code} size="lg" colorPalette="blue">
									{getDestCodeName(code)}
								</Badge>
							))
						) : (
							<Text fontSize="sm" color="gray.500" fontStyle="italic">
								Nenhum código de destino salvo.
							</Text>
						)}
					</Flex>
				</Box>

				<Separator my={4} />

				<Box>
					<Heading size="sm" color="gray.700" mb={2}>
						Selecione seus códigos:
					</Heading>
					<Box
						maxH="48"
						overflowY="auto"
						borderWidth="1px"
						borderRadius="lg"
						p={3}
						bg="gray.50"
					>
						<VStack gap={2} align="stretch">
							{sortedAvailableDestCodes.map((code) => (
								<Checkbox.Root
									key={code}
									checked={pendingDestCodes.includes(code)}
									onCheckedChange={() => {
										handleDestCodeToggle(code);
									}}
								>
									<Checkbox.HiddenInput />
									<Checkbox.Control />
									<Checkbox.Label>{getDestCodeName(code)}</Checkbox.Label>
								</Checkbox.Root>
							))}
						</VStack>
					</Box>
				</Box>

				<Flex mt={4} justify="flex-end">
					<Button onClick={handleSaveDestCodes} colorPalette="blue">
						Salvar Códigos
					</Button>
				</Flex>
			</Box>

			<Box
				bg="white"
				p={6}
				borderRadius="lg"
				shadow="sm"
				border="1px solid"
				borderColor="gray.200"
			>
				<Heading size="md" mb={4}>
					Adicionar Nova Restrição
				</Heading>
				<AddPreferenceForm
					onAddConstraint={addConstraint}
					availableCourseCodes={availableCourseCodes}
					availableProfessors={availableProfessors}
				/>
			</Box>

			<Box
				bg="white"
				p={6}
				borderRadius="lg"
				shadow="sm"
				border="1px solid"
				borderColor="gray.200"
			>
				<Flex wrap="wrap" justify="space-between" align="center" mb={4} gap={4}>
					<Heading size="md">
						Restrições ({preferenceSet.hardConstraints.length})
					</Heading>
					{preferenceSet.hardConstraints.length > 0 && (
						<Button onClick={clearConstraints} colorPalette="red" size="sm">
							Limpar Todas
						</Button>
					)}
				</Flex>

				{preferenceSet.hardConstraints.length === 0 ? (
					<Text color="gray.500" fontStyle="italic" fontSize="sm">
						Nenhuma restrição configurada. ☝️
					</Text>
				) : (
					<VStack gap={4} align="stretch">
						{preferenceSet.hardConstraints.map((constraint) => (
							<PreferenceCard
								key={constraint.id}
								constraint={constraint}
								onRemove={() => {
									removeConstraint(constraint.id);
								}}
								onUpdate={(updates) => {
									updateConstraint(constraint.id, updates);
								}}
							/>
						))}
					</VStack>
				)}
			</Box>

			<Box
				bg="gray.50"
				p={6}
				borderRadius="lg"
				shadow="sm"
				border="1px solid"
				borderColor="gray.200"
			>
				<Heading size="md" color="gray.800" mb={4}>
					Resumo
				</Heading>
				<Grid
					templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
					gap={4}
					fontSize="sm"
				>
					<Box fontWeight="medium" color="gray.600">
						<Text as="span" fontWeight="semibold">
							Total de Restrições:
						</Text>{" "}
						{summary.total}
					</Box>
					<Box fontWeight="medium" color="gray.600">
						<Text as="span" fontWeight="semibold">
							Restrições Ativas:
						</Text>{" "}
						{summary.active}
					</Box>
				</Grid>
			</Box>
		</VStack>
	);
}
