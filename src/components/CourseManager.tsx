import {
	Box,
	Button,
	Card,
	Flex,
	Heading,
	Input,
	Text,
	VStack,
} from "@chakra-ui/react";
import Pagination from "@components/Pagination";
import { PrerequisiteInput } from "@components/PrerequisiteInput";
import { useMemo, useState } from "react";
import { ClassSection } from "@/components/ClassSection";
import { CourseActions } from "@/components/CourseActions";
import { CourseEditor } from "@/components/CourseEditor";
import { CourseView } from "@/components/CourseView";
import { ITEMS_PER_PAGE } from "@/constants";
import type {
	ClassIdentifier,
	ClassOffering,
	ClassOfferingIdentifier,
	Course,
	CourseClass,
} from "@/types";

interface CourseManagerProps {
	courses: Record<string, Course>;
	onCoursesChange: (courses: Record<string, Course>) => void;
	importCSV: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CourseManager({
	courses,
	onCoursesChange,
	importCSV,
}: CourseManagerProps) {
	const [editingCourse, setEditingCourse] = useState<string | null>(null);
	const [editingClass, setEditingClass] = useState<ClassIdentifier | null>(
		null,
	);
	const [newCourse, setNewCourse] = useState<Partial<Course>>({});
	const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
		new Set(),
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	const courseList = useMemo(() => Object.values(courses), [courses]);

	const filteredCourses = useMemo(() => {
		if (!searchQuery) return courseList;
		return courseList.filter(
			(course) =>
				course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
				course.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [courseList, searchQuery]);

	const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
	const paginatedCourses = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredCourses, currentPage]);

	const toggleExpanded = (courseCode: string) => {
		setExpandedCourses((prev) => {
			const newSet = new Set(prev);
			newSet.has(courseCode)
				? newSet.delete(courseCode)
				: newSet.add(courseCode);
			return newSet;
		});
	};

	const addCourse = () => {
		const code = newCourse.code?.trim().toUpperCase();
		if (!code || !newCourse.name?.trim()) {
			alert("Please provide both a course code and name.");
			return;
		}
		if (courses[code]) {
			alert("A course with this code already exists.");
			return;
		}

		const course: Course = {
			code,
			name: newCourse.name.trim(),
			shouldHavePreRequisites: newCourse.shouldHavePreRequisites || false,
			coRequisites: newCourse.coRequisites || [],
			numCredits: newCourse.numCredits || 0,
			classes: [],
		};
		onCoursesChange({ ...courses, [code]: course });
		setNewCourse({});
	};

	const updateCourse = (code: string, updated: Course) => {
		onCoursesChange({ ...courses, [code]: updated });
		setEditingCourse(null);
	};

	const deleteCourse = (code: string) => {
		if (
			!window.confirm(
				`Tem certeza que deseja deletar ${code}? Isso também deletará todas as turmas associadas.`,
			)
		) {
			return;
		}
		const newCourses = { ...courses };
		delete newCourses[code];
		onCoursesChange(newCourses);
	};

	const addClass = (
		courseCode: string,
		newClassData: Omit<CourseClass, "courseCode">,
	) => {
		const targetCourse = courses[courseCode];
		if (!targetCourse) return;

		if (
			targetCourse.classes.some((c) => c.classCode === newClassData.classCode)
		) {
			alert(
				`Class ${newClassData.classCode} already exists for ${courseCode}.`,
			);
			return;
		}

		const newClass: CourseClass = { ...newClassData, courseCode };
		const updatedCourse = {
			...targetCourse,
			classes: [...targetCourse.classes, newClass],
		};
		onCoursesChange({ ...courses, [courseCode]: updatedCourse });
	};

	const updateClass = (
		{ courseCode, classCode }: ClassIdentifier,
		updatedData: CourseClass,
	) => {
		const targetCourse = courses[courseCode];
		if (!targetCourse) return;

		const updatedCourse = {
			...targetCourse,
			classes: targetCourse.classes.map((c) =>
				c.classCode === classCode ? updatedData : c,
			),
		};
		onCoursesChange({ ...courses, [courseCode]: updatedCourse });
		setEditingClass(null);
	};

	const deleteClass = (classId: ClassIdentifier) => {
		const { courseCode, classCode } = classId;
		const targetCourse = courses[courseCode];
		if (!targetCourse) return;

		if (
			window.confirm(
				`Are you sure you want to delete class ${classCode} for ${courseCode}?`,
			)
		) {
			const updatedCourse = {
				...targetCourse,
				classes: targetCourse.classes.filter((c) => c.classCode !== classCode),
			};
			onCoursesChange({ ...courses, [courseCode]: updatedCourse });
		}
	};

	const addOffering = (
		{ courseCode, classCode }: ClassIdentifier,
		newOfferingData: Omit<ClassOffering, "courseCode" | "classCode">,
	) => {
		const targetCourse = courses[courseCode];
		if (!targetCourse) return;

		const updatedCourse = {
			...targetCourse,
			classes: targetCourse.classes.map((c) => {
				if (c.classCode === classCode) {
					if (
						c.offerings.some((o) => o.destCode === newOfferingData.destCode)
					) {
						alert(
							`Offering for destination ${newOfferingData.destCode} already exists.`,
						);
						return c;
					}
					const newOffering: ClassOffering = {
						...newOfferingData,
						courseCode,
						classCode,
					};
					return { ...c, offerings: [...c.offerings, newOffering] };
				}
				return c;
			}),
		};
		onCoursesChange({ ...courses, [courseCode]: updatedCourse });
	};

	const updateOffering = (
		{ courseCode, classCode, destCode }: ClassOfferingIdentifier,
		updatedData: Partial<Pick<ClassOffering, "vacancyCount">>,
	) => {
		const targetCourse = courses[courseCode];
		if (!targetCourse) return;

		const updatedCourse = {
			...targetCourse,
			classes: targetCourse.classes.map((c) => {
				if (c.classCode === classCode) {
					return {
						...c,
						offerings: c.offerings.map((o) =>
							o.destCode === destCode ? { ...o, ...updatedData } : o,
						),
					};
				}
				return c;
			}),
		};
		onCoursesChange({ ...courses, [courseCode]: updatedCourse });
	};

	const deleteOffering = ({
		courseCode,
		classCode,
		destCode,
	}: ClassOfferingIdentifier) => {
		const targetCourse = courses[courseCode];
		if (!targetCourse) return;

		if (
			!window.confirm(`Delete offering for ${destCode} in class ${classCode}?`)
		)
			return;

		const updatedCourse = {
			...targetCourse,
			classes: targetCourse.classes.map((c) => {
				if (c.classCode === classCode) {
					return {
						...c,
						offerings: c.offerings.filter((o) => o.destCode !== destCode),
					};
				}
				return c;
			}),
		};
		onCoursesChange({ ...courses, [courseCode]: updatedCourse });
	};

	return (
		<Box p={{ base: 4, sm: 6 }} bg="gray.50" minH="100vh">
			<VStack gap={6} align="stretch">
				{/* Header and Actions */}
				<Flex wrap="wrap" align="center" gap={4}>
					<Heading size="xl" flex={1}>
						Gerenciamento de Disciplinas
					</Heading>
					<Button as="label" colorPalette="blue" cursor="pointer">
						Import PUC-Rio CSV
						<Input
							type="file"
							accept=".csv"
							onChange={importCSV}
							display="none"
						/>
					</Button>
					<Input
						type="text"
						placeholder="Pesquisar disciplinas..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						w={{ base: "full", md: "72" }}
					/>
				</Flex>

				{/* Add New Course Form */}
				<Box
					bg="white"
					p={6}
					borderRadius="lg"
					shadow="sm"
					border="1px solid"
					borderColor="gray.200"
				>
					<Heading size="md" mb={4}>
						Adicionar Nova Disciplina
					</Heading>
					<VStack gap={6} align="stretch">
						<Flex direction={{ base: "column", md: "row" }} gap={4}>
							<Input
								placeholder="Código da Disciplina (e.g., INF1007)"
								value={newCourse.code || ""}
								onChange={(e) => {
									setNewCourse((prev) => ({ ...prev, code: e.target.value }));
								}}
								flex={1}
							/>
							<Input
								placeholder="Nome da Disciplina (e.g., Programação I)"
								value={newCourse.name || ""}
								onChange={(e) => {
									setNewCourse((prev) => ({ ...prev, name: e.target.value }));
								}}
								flex={1}
							/>
						</Flex>
						<PrerequisiteInput
							courses={courses}
							selected={newCourse.coRequisites || []}
							onChange={(coRequisites) => {
								setNewCourse((prev) => ({ ...prev, coRequisites }));
							}}
							label="Co-requisitos"
							placeholder="Disciplinas que devem ser cursadas com esta (se A requer B, adicione B à lista de A)"
						/>
						<Button
							onClick={addCourse}
							colorPalette="blue"
							alignSelf="flex-start"
						>
							Adicionar Disciplina
						</Button>
					</VStack>
				</Box>

				{/* Courses List */}
				<VStack gap={4} align="stretch">
					{paginatedCourses.map((course) => (
						<Card.Root key={course.code} overflow="hidden">
							<Box
								p={4}
								cursor="pointer"
								_hover={{ bg: "gray.50" }}
								onClick={() => {
									toggleExpanded(course.code);
								}}
							>
								<Flex justify="space-between" align="center">
									<Box>
										<Heading size="md" color="gray.800">
											{course.code} - {course.name}
										</Heading>
										<Text fontSize="sm" color="gray.600">
											{course.classes.length} turmas
										</Text>
									</Box>
									<CourseActions
										onEdit={() => {
											setEditingCourse(course.code);
										}}
										onDelete={() => {
											deleteCourse(course.code);
										}}
									/>
								</Flex>
							</Box>

							{expandedCourses.has(course.code) && (
								<Box
									bg="gray.50"
									p={6}
									borderTopWidth="1px"
									borderColor="gray.200"
								>
									{editingCourse === course.code ? (
										<CourseEditor
											course={course}
											onSave={(updated) => {
												updateCourse(course.code, updated);
											}}
											onCancel={() => {
												setEditingCourse(null);
											}}
											courses={courses}
										/>
									) : (
										<CourseView course={course} allCourses={courses} />
									)}

									<ClassSection
										courseCode={course.code}
										classes={course.classes}
										editingClassId={editingClass}
										onAddClass={(newClassData) => {
											addClass(course.code, newClassData);
										}}
										onUpdateClass={updateClass}
										onDeleteClass={deleteClass}
										onSetEditingClass={setEditingClass}
										onAddOffering={addOffering}
										onUpdateOffering={updateOffering}
										onDeleteOffering={deleteOffering}
									/>
								</Box>
							)}
						</Card.Root>
					))}
				</VStack>

				{/* Pagination */}
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={setCurrentPage}
				/>
			</VStack>
		</Box>
	);
}
