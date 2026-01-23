import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import type { Course } from "@/types";

interface CourseViewProps {
	course: Course;
	allCourses: Record<string, Course>;
}

function getRelationshipType(
	courseA: Course,
	courseBCode: string,
	allCourses: Record<string, Course>,
): "bidirectional" | "unidirectional" | "none" {
	const courseB = allCourses[courseBCode];
	if (!courseB) return "none";

	const aCoReqs = courseA.coRequisites || [];
	const bCoReqs = courseB.coRequisites || [];

	const aRequiresB = aCoReqs.includes(courseBCode);
	const bRequiresA = bCoReqs.includes(courseA.code);

	if (aRequiresB && bRequiresA) return "bidirectional";
	if (aRequiresB) return "unidirectional";
	return "none";
}

export function CourseView({ course, allCourses }: CourseViewProps) {
	const getNameByCode = (code: string) =>
		allCourses[code]?.name || `${code} (not found)`;

	const detailItem = (label: string, value: React.ReactNode) => (
		<Flex direction={{ base: "column", sm: "row" }}>
			<Text
				fontWeight="semibold"
				color="fg.muted"
				w={{ base: "full", sm: "33%" }}
			>
				{label}:
			</Text>
			<Text w={{ base: "full", sm: "67%" }}>{value}</Text>
		</Flex>
	);

	const coRequisitesWithTypes = (course.coRequisites || []).map((code) => {
		const relationshipType = getRelationshipType(course, code, allCourses);
		const name = getNameByCode(code);
		const symbol = relationshipType === "bidirectional" ? "↔" : "→";
		return { code, name, relationshipType, symbol };
	});

	const bidirectional = coRequisitesWithTypes.filter(
		(item) => item.relationshipType === "bidirectional",
	);
	const unidirectional = coRequisitesWithTypes.filter(
		(item) => item.relationshipType === "unidirectional",
	);

	return (
		<Box flex={1}>
			<Box mb={4}>
				<Heading size="lg">{course.name}</Heading>
				<Text textStyle="md" color="fg.subtle">
					{course.code}
				</Text>
			</Box>

			<VStack gap={3} align="stretch" textStyle="sm">
				{detailItem("Créditos", course.numCredits)}
				{detailItem(
					"Requer pré-requisitos",
					course.shouldHavePreRequisites ? "Sim" : "Não",
				)}
				{detailItem(
					"Co-requisitos",
					(course.coRequisites || []).length > 0 ? (
						<VStack gap={1} align="stretch">
							{bidirectional.length > 0 && (
								<Box>
									<Text as="span" fontWeight="medium">
										Bidirecionais (↔):
									</Text>{" "}
									{bidirectional
										.map((item) => `${item.name} (${item.code})`)
										.join(", ")}
								</Box>
							)}
							{unidirectional.length > 0 && (
								<Box>
									<Text as="span" fontWeight="medium">
										Unidirecionais (→):
									</Text>{" "}
									{unidirectional
										.map((item) => `${item.name} (${item.code})`)
										.join(", ")}
								</Box>
							)}
						</VStack>
					) : (
						"Nenhum"
					),
				)}
			</VStack>
		</Box>
	);
}
