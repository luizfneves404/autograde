import { Box, Button, Field, Input, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { Course } from "@/types";

interface PrerequisiteInputProps {
	courses: Record<string, Course>;
	selected: string[];
	onChange: (codes: string[]) => void;
	label: string;
	placeholder?: string;
}

export function PrerequisiteInput({
	courses,
	selected,
	onChange,
	label,
	placeholder,
}: PrerequisiteInputProps) {
	const [inputValue, setInputValue] = useState(selected.join(", "));
	const [suggestions, setSuggestions] = useState<Course[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);

	useEffect(() => {
		setInputValue(selected.join(", "));
	}, [selected]);

	const handleInputChange = (value: string) => {
		setInputValue(value);

		const codes = value
			.split(",")
			.map((code) => code.trim().toUpperCase())
			.filter((code) => code.length > 0);

		onChange(codes);

		const lastCode = value.split(",").pop()?.trim() || "";
		if (lastCode.length > 0) {
			const filtered = Object.values(courses)
				.filter(
					(d) =>
						d.code.toLowerCase().includes(lastCode.toLowerCase()) ||
						d.name.toLowerCase().includes(lastCode.toLowerCase()),
				)
				.slice(0, 5);
			setSuggestions(filtered);
			setShowSuggestions(filtered.length > 0);
		} else {
			setShowSuggestions(false);
		}
	};

	const addSuggestion = (course: Course) => {
		const currentCodes = inputValue
			.split(",")
			.map((c) => c.trim())
			.filter((c) => c.length > 0);
		currentCodes.pop();
		currentCodes.push(course.code);
		const newValue = currentCodes.join(", ") + ", ";
		setInputValue(newValue);
		onChange(currentCodes);
		setShowSuggestions(false);
	};

	return (
		<Box position="relative">
			<Field.Root>
				<Field.Label>{`${label}:`}</Field.Label>
				<Input
					value={inputValue}
					onChange={(e) => {
						handleInputChange(e.target.value);
					}}
					placeholder={placeholder}
					onFocus={() => {
						handleInputChange(inputValue);
					}}
					onBlur={() =>
						setTimeout(() => {
							setShowSuggestions(false);
						}, 200)
					}
				/>
			</Field.Root>

			{showSuggestions && suggestions.length > 0 && (
				<Box
					position="absolute"
					top="full"
					left={0}
					right={0}
					bg="white"
					borderWidth="1px"
					borderColor="gray.300"
					borderBottomRadius="md"
					shadow="lg"
					maxH="60"
					overflowY="auto"
					zIndex={10}
				>
					{suggestions.map((course) => (
						<Button
							key={course.code}
							onClick={() => {
								addSuggestion(course);
							}}
							w="full"
							variant="ghost"
							justifyContent="flex-start"
							textAlign="left"
						>
							<Text as="span" fontWeight="bold">
								{course.code}
							</Text>{" "}
							- {course.name}
						</Button>
					))}
				</Box>
			)}

			{selected.length > 0 && (
				<Box mt={2} fontSize="sm" color="gray.600">
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
		</Box>
	);
}
