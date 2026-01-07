import { Button, Flex } from "@chakra-ui/react";
import type React from "react";

interface ClassActionsProps {
	onEdit: () => void;
	onDelete: () => void;
}

export const ClassActions: React.FC<ClassActionsProps> = ({
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
