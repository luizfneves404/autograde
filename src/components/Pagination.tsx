import { Button, Flex, Text } from "@chakra-ui/react";
import type React from "react";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	pageNeighbours?: number;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
	pageNeighbours = 1,
}) => {
	if (totalPages <= 1) {
		return null;
	}

	const fetchPageNumbers = () => {
		const totalNumbers = pageNeighbours * 2 + 3;
		const totalBlocks = totalNumbers + 2;

		if (totalPages > totalBlocks) {
			const startPage = Math.max(2, currentPage - pageNeighbours);
			const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
			let pages: (number | string)[] = range(startPage, endPage);

			const hasLeftSpill = startPage > 2;
			const hasRightSpill = totalPages - endPage > 1;
			const spillOffset = totalNumbers - (pages.length + 1);

			switch (true) {
				case hasLeftSpill && !hasRightSpill: {
					const extraPages = range(startPage - spillOffset, startPage - 1);
					pages = ["...", ...extraPages, ...pages];
					break;
				}
				case !hasLeftSpill && hasRightSpill: {
					const extraPages = range(endPage + 1, endPage + spillOffset);
					pages = [...pages, ...extraPages, "..."];
					break;
				}
				case hasLeftSpill && hasRightSpill:
				default: {
					pages = ["...", ...pages, "..."];
					break;
				}
			}
			return [1, ...pages, totalPages];
		}

		return range(1, totalPages);
	};

	const range = (from: number, to: number, step = 1) => {
		let i = from;
		const range = [];
		while (i <= to) {
			range.push(i);
			i += step;
		}
		return range;
	};

	const pages = fetchPageNumbers();

	return (
		<Flex
			as="nav"
			aria-label="Pagination"
			mt={6}
			justify="center"
			align="center"
			gap={2}
		>
			<Button
				onClick={() => {
					onPageChange(currentPage - 1);
				}}
				disabled={currentPage === 1}
				variant="outline"
			>
				Anterior
			</Button>

			{pages.map((page, index) =>
				typeof page === "number" ? (
					<Button
						key={`page-${page}`}
						onClick={() => {
							onPageChange(page);
						}}
						disabled={currentPage === page}
						variant={currentPage === page ? "solid" : "outline"}
						colorPalette={currentPage === page ? "blue" : "gray"}
					>
						{page}
					</Button>
				) : (
					<Text key={`ellipsis-${index}`} px={3} py={2} color="gray.500">
						...
					</Text>
				),
			)}

			<Button
				onClick={() => {
					onPageChange(currentPage + 1);
				}}
				disabled={currentPage === totalPages}
				variant="outline"
			>
				Próximo
			</Button>
		</Flex>
	);
};

export default Pagination;
