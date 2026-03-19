import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	CourseForm,
	type CourseFormValues,
	emptyCourseFormValues,
} from "@/features/courses/course-forms";
import {
	COURSES_PAGE_SIZE,
	filterCourses,
	paginateItems,
} from "@/features/courses/course-index";
import { useAppStore } from "@/stores/app-store";
import { getAvailableCourseCodes, getCourseList } from "@/stores/selectors";

const routeApi = getRouteApi("/courses");

function getVisiblePages(
	page: number,
	totalPages: number,
): Array<number | "ellipsis"> {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, index) => index + 1);
	}

	if (page <= 3) {
		return [1, 2, 3, 4, "ellipsis", totalPages];
	}

	if (page >= totalPages - 2) {
		return [
			1,
			"ellipsis",
			totalPages - 3,
			totalPages - 2,
			totalPages - 1,
			totalPages,
		];
	}

	return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

export function CoursesPage() {
	const navigate = useNavigate({ from: "/courses" });
	const { page, query } = routeApi.useSearch();
	const courses = useAppStore((state) => state.courses);
	const upsertCourse = useAppStore((state) => state.upsertCourse);
	const deleteCourse = useAppStore((state) => state.deleteCourse);

	const courseList = useMemo(
		() =>
			getCourseList(courses).sort((left, right) =>
				left.code.localeCompare(right.code),
			),
		[courses],
	);
	const availableCourseCodes = useMemo(
		() => getAvailableCourseCodes(courses),
		[courses],
	);
	const filteredCourses = useMemo(
		() => filterCourses(courseList, query),
		[courseList, query],
	);
	const paginatedCourses = useMemo(
		() => paginateItems(filteredCourses, page, COURSES_PAGE_SIZE),
		[filteredCourses, page],
	);
	const pageLinks = useMemo(
		() => getVisiblePages(paginatedCourses.page, paginatedCourses.totalPages),
		[paginatedCourses.page, paginatedCourses.totalPages],
	);

	const handleCreateCourse = (values: CourseFormValues) => {
		if (courses[values.code]) {
			window.alert("Ja existe uma disciplina com esse codigo.");
			return;
		}

		upsertCourse({
			code: values.code,
			name: values.name,
			numCredits: values.numCredits,
			shouldHavePreRequisites: values.shouldHavePreRequisites,
			coRequisites: values.coRequisites.filter((code) => code !== values.code),
			classes: [],
		});
	};

	const handleDeleteCourse = (courseCode: string) => {
		if (!window.confirm(`Remover a disciplina ${courseCode}?`)) {
			return;
		}

		deleteCourse(courseCode);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-1">
					<h2 className="text-3xl font-semibold tracking-tight">
						Gerenciamento de disciplinas
					</h2>
					<p className="text-muted-foreground">
						Use a busca e a paginacao para abrir somente a disciplina que voce
						quer editar.
					</p>
				</div>
				<div className="w-full max-w-sm space-y-2 text-sm font-medium">
					<span>Pesquisar</span>
					<Input
						value={query}
						onChange={(event) =>
							void navigate({
								search: (current) => ({
									...current,
									page: 1,
									query: event.target.value,
								}),
							})
						}
						placeholder="INF1001 ou nome da disciplina"
					/>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Nova disciplina</CardTitle>
					<CardDescription>
						Cadastre disciplinas fora do CSV importado.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CourseForm
						initialValues={emptyCourseFormValues}
						submitLabel="Adicionar disciplina"
						availableCourseCodes={availableCourseCodes}
						showCoRequisites={false}
						onSubmit={handleCreateCourse}
					/>
				</CardContent>
			</Card>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-muted-foreground">
					{`${filteredCourses.length.toString()} disciplinas encontradas`}
				</p>
				<p className="text-sm text-muted-foreground">
					{`Pagina ${paginatedCourses.page.toString()} de ${paginatedCourses.totalPages.toString()}`}
				</p>
			</div>

			<div className="space-y-4">
				{paginatedCourses.items.map((course) => (
					<Card key={course.code}>
						<CardHeader>
							<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
								<div className="space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<CardTitle>{`${course.code} - ${course.name}`}</CardTitle>
										<Badge variant="outline">
											{`${course.numCredits.toString()} creditos`}
										</Badge>
										<Badge variant="secondary">
											{`${course.classes.length.toString()} turmas`}
										</Badge>
									</div>
									<CardDescription>
										{course.shouldHavePreRequisites
											? "Disciplina com pre-requisitos."
											: "Disciplina sem pre-requisitos."}
									</CardDescription>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button asChild variant="outline">
										<Link
											to="/courses/$courseCode"
											params={{ courseCode: course.code }}
											search={{ page: paginatedCourses.page, query }}
										>
											Abrir disciplina
										</Link>
									</Button>
									<Button
										variant="destructive"
										onClick={() => handleDeleteCourse(course.code)}
									>
										Remover
									</Button>
								</div>
							</div>
						</CardHeader>
					</Card>
				))}

				{filteredCourses.length === 0 ? (
					<div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
						Nenhuma disciplina encontrada para a busca atual.
					</div>
				) : null}
			</div>

			{paginatedCourses.totalPages > 1 ? (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<div
								className={
									paginatedCourses.page <= 1
										? "pointer-events-none opacity-50"
										: undefined
								}
							>
								<PaginationPrevious
									onClick={() =>
										paginatedCourses.page > 1 &&
										void navigate({
											search: (current) => ({
												...current,
												page: Math.max(1, paginatedCourses.page - 1),
											}),
										})
									}
								/>
							</div>
						</PaginationItem>
						{pageLinks.map((item, index) => (
							<PaginationItem key={`${String(item)}-${index.toString()}`}>
								{item === "ellipsis" ? (
									<PaginationEllipsis />
								) : (
									<PaginationLink
										isActive={item === paginatedCourses.page}
										onClick={() =>
											void navigate({
												search: (current) => ({
													...current,
													page: item,
												}),
											})
										}
									>
										{item.toString()}
									</PaginationLink>
								)}
							</PaginationItem>
						))}
						<PaginationItem>
							<div
								className={
									paginatedCourses.page >= paginatedCourses.totalPages
										? "pointer-events-none opacity-50"
										: undefined
								}
							>
								<PaginationNext
									onClick={() =>
										paginatedCourses.page < paginatedCourses.totalPages &&
										void navigate({
											search: (current) => ({
												...current,
												page: Math.min(
													paginatedCourses.totalPages,
													paginatedCourses.page + 1,
												),
											}),
										})
									}
								/>
							</div>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			) : null}
		</div>
	);
}
