import {
	Box,
	Button,
	ButtonGroup,
	Card,
	FileUpload,
	Flex,
	Heading,
	IconButton,
	Input,
	Pagination,
	Span,
	Text,
	VStack,
} from "@chakra-ui/react";
import { PrerequisiteInput } from "@components/PrerequisiteInput";
import { useEffect, useMemo, useState } from "react";
import { HiChevronLeft, HiChevronRight, HiUpload } from "react-icons/hi";
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
	const [page, setPage] = useState(1);

	const courseList = useMemo(() => Object.values(courses), [courses]);

	const filteredCourses = useMemo(() => {
		if (!searchQuery) return courseList;
		return courseList.filter(
			(course) =>
				course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
				course.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [courseList, searchQuery]);

	const maxPage = Math.max(
		1,
		Math.ceil(filteredCourses.length / ITEMS_PER_PAGE),
	);

	useEffect(() => {
		setPage((prev) => Math.min(prev, maxPage));
	}, [maxPage]);

	const startRange = (page - 1) * ITEMS_PER_PAGE;
	const endRange = startRange + ITEMS_PER_PAGE;
	const visibleCourses = filteredCourses.slice(startRange, endRange);

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
		<VStack gap={6} align="stretch">
			{/* Header and Actions */}
			<Flex align="center">
				<Heading size="xl" flex={1}>
					Gerenciamento de Disciplinas
				</Heading>
				<Flex gap={4}>
					<FileUpload.Root accept={["text/csv", ".csv"]} maxFiles={1}>
						<FileUpload.HiddenInput onChange={importCSV} />
						<FileUpload.Trigger asChild>
							<Button variant="outline">
								<HiUpload /> Importar CSV da PUC-Rio
							</Button>
						</FileUpload.Trigger>
					</FileUpload.Root>
				</Flex>
				<Input
					type="text"
					placeholder="Pesquisar disciplinas..."
					value={searchQuery}
					onChange={(e) => {
						const nextQuery = e.target.value;
						setSearchQuery(nextQuery);
						setPage(1);
					}}
					w={{ md: "72" }}
				/>
			</Flex>

			{/* Add New Course Form */}
			<Card.Root variant="outline">
				<Card.Header>
					<Card.Title>Adicionar Nova Disciplina</Card.Title>
					<Card.Description>
						Adicione uma disciplina que não se encontra no CSV da PUC-Rio
					</Card.Description>
				</Card.Header>
				<Card.Body>
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
				</Card.Body>
			</Card.Root>

			{/* Quando eu clico em um dos courses, ele chama setExpandedCourses, 
			o que trigger um re render de todo o CourseManager. Preciso mudar isso pra usar um componente 
			do chakra de forma que não afete o estado do CourseManager, afetando somente o pequeno card do course,
			 que deve abrir e fechar sem impactar nada de fora dele. */}

			<VStack gap={4} align="stretch">
				{visibleCourses.map((course) => (
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
									<Heading size="md">
										{course.code} - {course.name}
									</Heading>
									<Text textStyle="sm" color="fg.muted">
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
								layerStyle="fill.subtle"
								p={6}
								borderTopWidth="1px"
								borderColor="border.muted"
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

			{filteredCourses.length > ITEMS_PER_PAGE && (
				<Flex justify="center" mt={6}>
					<Pagination.Root
						count={filteredCourses.length}
						pageSize={ITEMS_PER_PAGE}
						page={page}
						onPageChange={(e) => {
							setPage(e.page);
						}}
						siblingCount={1}
					>
						<ButtonGroup variant="ghost" size="sm">
							<Pagination.PrevTrigger asChild>
								<IconButton aria-label="Página anterior">
									<HiChevronLeft />
								</IconButton>
							</Pagination.PrevTrigger>

							<Pagination.Items
								render={(page) => (
									<IconButton variant={{ base: "ghost", _selected: "outline" }}>
										{page.value}
									</IconButton>
								)}
							/>

							<Pagination.NextTrigger asChild>
								<IconButton aria-label="Próxima página">
									<HiChevronRight />
								</IconButton>
							</Pagination.NextTrigger>
						</ButtonGroup>
					</Pagination.Root>
				</Flex>
			)}
		</VStack>
	);
}
