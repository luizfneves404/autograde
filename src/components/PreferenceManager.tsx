import {
	Badge,
	Box,
	Button,
	Card,
	createListCollection,
	Flex,
	Grid,
	Heading,
	Listbox,
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

	const destCodeCollection = useMemo(
		() =>
			createListCollection({
				items: sortedAvailableDestCodes.map((code) => ({
					label: getDestCodeName(code),
					value: code,
				})),
			}),
		[sortedAvailableDestCodes],
	);

	const handleDestCodeChange = (details: Listbox.ValueChangeDetails) => {
		setPendingDestCodes(details.value);
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
			<Card.Root variant="outline">
				<Card.Header>
					<Heading size="md">Códigos de Destino</Heading>
				</Card.Header>
				<Card.Body>
					<Box>
						<Heading size="sm" mb={2}>
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
								<Text textStyle="sm" color="fg.subtle" fontStyle="italic">
									Nenhum código de destino salvo.
								</Text>
							)}
						</Flex>
					</Box>

					<Separator my={4} />

					<Listbox.Root
						collection={destCodeCollection}
						selectionMode="multiple"
						value={pendingDestCodes}
						onValueChange={handleDestCodeChange}
					>
						<Listbox.Label fontWeight="semibold" mb={2}>
							Selecione seus códigos:
						</Listbox.Label>
						<Listbox.Content
							maxH="48"
							overflowY="auto"
							borderWidth="1px"
							borderRadius="lg"
							layerStyle="fill.subtle"
						>
							{destCodeCollection.items.map((item) => (
								<Listbox.Item item={item} key={item.value}>
									<Listbox.ItemText>{item.label}</Listbox.ItemText>
									<Listbox.ItemIndicator />
								</Listbox.Item>
							))}
						</Listbox.Content>
					</Listbox.Root>

					<Flex mt={4} justify="flex-end">
						<Button onClick={handleSaveDestCodes} colorPalette="blue">
							Salvar Códigos
						</Button>
					</Flex>
				</Card.Body>
			</Card.Root>

			<Card.Root variant="outline">
				<Card.Header>
					<Heading size="md">Adicionar Nova Restrição</Heading>
				</Card.Header>
				<Card.Body>
					<AddPreferenceForm
						onAddConstraint={addConstraint}
						availableCourseCodes={availableCourseCodes}
						availableProfessors={availableProfessors}
					/>
				</Card.Body>
			</Card.Root>

			<Card.Root variant="outline">
				<Card.Header>
					<Flex wrap="wrap" justify="space-between" align="center" gap={4}>
						<Heading size="md">
							Restrições ({preferenceSet.hardConstraints.length})
						</Heading>
						{preferenceSet.hardConstraints.length > 0 && (
							<Button onClick={clearConstraints} colorPalette="red" size="sm">
								Limpar Todas
							</Button>
						)}
					</Flex>
				</Card.Header>
				<Card.Body>
					{preferenceSet.hardConstraints.length === 0 ? (
						<Text color="fg.subtle" fontStyle="italic" textStyle="sm">
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
				</Card.Body>
			</Card.Root>

			<Card.Root variant="outline" layerStyle="fill.subtle">
				<Card.Header>
					<Heading size="md">Resumo</Heading>
				</Card.Header>
				<Card.Body>
					<Grid
						templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
						gap={4}
						textStyle="sm"
					>
						<Box fontWeight="medium" color="fg.muted">
							<Text as="span" fontWeight="semibold">
								Total de Restrições:
							</Text>{" "}
							{summary.total}
						</Box>
						<Box fontWeight="medium" color="fg.muted">
							<Text as="span" fontWeight="semibold">
								Restrições Ativas:
							</Text>{" "}
							{summary.active}
						</Box>
					</Grid>
				</Card.Body>
			</Card.Root>
		</VStack>
	);
}
