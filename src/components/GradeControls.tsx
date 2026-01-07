import { Button, Flex, Text } from "@chakra-ui/react";
import type React from "react";

interface GradeControlsProps {
	currentGradeIndex: number;
	totalGrades: number;
	goToPrevious: () => void;
	goToNext: () => void;
}

export const GradeControls: React.FC<GradeControlsProps> = ({
	currentGradeIndex,
	totalGrades,
	goToPrevious,
	goToNext,
}) => {
	const isControlDisabled = totalGrades <= 1;

	return (
		<Flex align="center" gap={4}>
			<Button
				onClick={goToPrevious}
				disabled={isControlDisabled}
				variant="outline"
			>
				← Anterior
			</Button>

			<Text fontWeight="semibold" color="gray.700" fontSize="sm">
				Grade {currentGradeIndex + 1} de {totalGrades}
			</Text>

			<Button onClick={goToNext} disabled={isControlDisabled} variant="outline">
				Próxima →
			</Button>
		</Flex>
	);
};
