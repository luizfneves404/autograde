import {
	Alert,
	Badge,
	Button,
	Card,
	Collapsible,
	Heading,
	HStack,
	Input,
	Stack,
	Switch,
	Textarea,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import type { UIConstraint } from "@/types";
import { isExprNode } from "@/utils/isExprNode";

interface PreferenceCardProps {
	constraint: UIConstraint;
	onRemove: () => void;
	onUpdate: (updates: Partial<UIConstraint>) => void;
}

// ✅ FIX: Move helper function OUTSIDE the component.
// It is now stable and won't trigger re-renders or lint errors.
const safeParse = (str: string) => {
	try {
		return JSON.parse(str);
	} catch {
		return null;
	}
};

function PreferenceCard({
	constraint,
	onRemove,
	onUpdate,
}: PreferenceCardProps) {
	// 1. LOCAL STATE BUFFER
	const [localName, setLocalName] = useState(constraint.name);
	const [localDesc, setLocalDesc] = useState(constraint.description);

	// JSON State
	const [jsonString, setJsonString] = useState(
		JSON.stringify(constraint.expression, null, 2),
	);
	const [isJsonValid, setIsJsonValid] = useState(true);

	// 2. SYNC FROM PROPS
	useEffect(() => {
		setLocalName(constraint.name);
	}, [constraint.name]);

	useEffect(() => {
		setLocalDesc(constraint.description);
	}, [constraint.description]);

	// Ref pattern for JSON
	const jsonStringRef = useRef(jsonString);
	jsonStringRef.current = jsonString;

	useEffect(() => {
		// safeParse is now external and stable, so the linter is happy.
		const currentParsed = safeParse(jsonStringRef.current);

		if (
			JSON.stringify(currentParsed) !== JSON.stringify(constraint.expression)
		) {
			setJsonString(JSON.stringify(constraint.expression, null, 2));
		}
	}, [constraint.expression]); // Clean dependency array

	// 3. HANDLERS
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);

	const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newJsonString = e.target.value;
		setJsonString(newJsonString);

		if (debounceTimer.current) clearTimeout(debounceTimer.current);

		// Validate immediately
		const parsedJson = safeParse(newJsonString); // We can use the helper here too

		if (parsedJson && isExprNode(parsedJson)) {
			setIsJsonValid(true);
			// Only sync to parent after 600ms of inactivity
			debounceTimer.current = setTimeout(() => {
				onUpdate({ expression: parsedJson });
			}, 600);
		} else {
			setIsJsonValid(false);
		}
	};

	return (
		<Card.Root variant="outline">
			<Card.Body>
				<Stack gap={4}>
					<HStack justify="space-between" align="flex-start">
						<Badge colorPalette={constraint.enabled ? "green" : "gray"}>
							{constraint.enabled ? "Ativo" : "Inativo"}
						</Badge>
						<HStack gap={3}>
							<Switch.Root
								checked={constraint.enabled}
								onCheckedChange={(e) => {
									onUpdate({ enabled: e.checked });
								}}
							>
								<Switch.HiddenInput />
								<Switch.Control />
								<Switch.Label>Ativo</Switch.Label>
							</Switch.Root>
							<Button
								onClick={onRemove}
								size="sm"
								colorPalette="red"
								variant="subtle"
							>
								Remover
							</Button>
						</HStack>
					</HStack>

					<Stack gap={3}>
						<Input
							value={localName}
							onChange={(e) => setLocalName(e.target.value)}
							onBlur={() => {
								if (localName !== constraint.name) {
									onUpdate({ name: localName });
								}
							}}
							placeholder="Nome da Preferência"
						/>
						<Textarea
							value={localDesc}
							onChange={(e) => setLocalDesc(e.target.value)}
							onBlur={() => {
								if (localDesc !== constraint.description) {
									onUpdate({ description: localDesc });
								}
							}}
							placeholder="Descrição"
							rows={2}
							resize="none"
						/>
					</Stack>

					<Collapsible.Root>
						<Collapsible.Trigger asChild alignSelf="flex-start">
							<Button size="sm" variant="outline">
								<Collapsible.Context>
									{(api) => (api.open ? "Ocultar Detalhes" : "Ver Detalhes")}
								</Collapsible.Context>
							</Button>
						</Collapsible.Trigger>
						<Collapsible.Content>
							<Stack mt={3} gap={2}>
								<Heading size="xs">Expressão da Restrição (JSON)</Heading>
								<Textarea
									value={jsonString}
									onChange={handleJsonChange}
									fontFamily="mono"
									textStyle="xs"
									rows={10}
									spellCheck={false}
								/>
								{!isJsonValid && (
									<Alert.Root status="error" variant="outline" size="sm">
										<Alert.Indicator />
										<Alert.Title>A sintaxe do JSON é inválida.</Alert.Title>
									</Alert.Root>
								)}
							</Stack>
						</Collapsible.Content>
					</Collapsible.Root>
				</Stack>
			</Card.Body>
		</Card.Root>
	);
}

export default PreferenceCard;
