import {
	Card,
	Carousel,
	Flex,
	Heading,
	IconButton,
	Text,
} from "@chakra-ui/react";
import { GradeViewer } from "@components/GradeViewer";
import type React from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import type { Course, Grade } from "@/types";

interface GradeManagerProps {
	grades: Grade[];
	allCourses: Record<string, Course>;
}

export const GradeManager: React.FC<GradeManagerProps> = ({
	grades,
	allCourses,
}) => {
	if (grades.length === 0) {
		return (
			<Card.Root variant="outline">
				<Card.Header>
					<Heading size="md">Grades Disponíveis</Heading>
				</Card.Header>
				<Card.Body>
					<Text color="fg.muted">
						Nenhuma grade disponível. As grades serão geradas automaticamente
						baseadas na lógica de otimização assim que você definir suas
						preferências e clicar em &quot;Gerar Grades&quot;.
					</Text>
				</Card.Body>
			</Card.Root>
		);
	}

	return (
		<Flex direction="column" gap={4} w="full" minW="0">
			<Heading size="lg">Grades Geradas ({grades.length})</Heading>
			<Carousel.Root slideCount={Math.min(grades.length, 50)}>
				<Carousel.Control justifyContent="center">
					<Carousel.ProgressText />
					<Carousel.PrevTrigger asChild>
						<IconButton variant="ghost">
							<LuChevronLeft />
						</IconButton>
					</Carousel.PrevTrigger>
					<Carousel.NextTrigger asChild>
						<IconButton variant="ghost">
							<LuChevronRight />
						</IconButton>
					</Carousel.NextTrigger>
				</Carousel.Control>
				<Carousel.ItemGroup>
					{grades.slice(0, 50).map((grade, index) => {
						const gradeKey = grade.classes
							.map((c) => `${c.courseCode}-${c.classCode}`)
							.sort()
							.join("|");
						return (
							<Carousel.Item key={gradeKey} index={index}>
								<GradeViewer grade={grade} allCourses={allCourses} />
							</Carousel.Item>
						);
					})}
				</Carousel.ItemGroup>
			</Carousel.Root>
		</Flex>
	);
};
