import { Button, Flex } from "@chakra-ui/react";
import type React from "react";

interface CourseActionsProps {
	onEdit: () => void;
	onDelete: () => void;
}

export const CourseActions: React.FC<CourseActionsProps> = ({
	onEdit,
	onDelete,
}) => {
	return (
		<Flex gap={2}>
			<Button onClick={onEdit} colorPalette="blue" size="sm">
				Editar
			</Button>
			<Button onClick={onDelete} colorPalette="red" size="sm">
				Deletar
			</Button>
		</Flex>
	);
};
