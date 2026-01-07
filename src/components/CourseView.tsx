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

	const aRequiresB = courseA.coRequisites.includes(courseBCode);
	const bRequiresA = courseB.coRequisites.includes(courseA.code);

	if (aRequiresB && bRequiresA) return "bidirectional";
	if (aRequiresB) return "unidirectional";
	return "none";
}

export function CourseView({ course, allCourses }: CourseViewProps) {
	const getNameByCode = (code: string) =>
		allCourses[code]?.name || `${code} (not found)`;

	const detailItem = (label: string, value: React.ReactNode) => (
		<div className="flex flex-col sm:flex-row">
			<strong className="w-full sm:w-1/3 text-neutral-600">{label}:</strong>
			<span className="w-full sm:w-2/3 text-neutral-800">{value}</span>
		</div>
	);

	const coRequisitesWithTypes = course.coRequisites.map((code) => {
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
		<div className="flex-1">
			<div className="mb-4">
				<h3 className="text-xl font-bold text-neutral-900">{course.name}</h3>
				<p className="text-md text-neutral-500">{course.code}</p>
			</div>

			<div className="space-y-3 text-sm">
				{detailItem("Créditos", course.numCredits)}
				{detailItem(
					"Requer pré-requisitos",
					course.shouldHavePreRequisites ? "Sim" : "Não",
				)}
				{detailItem(
					"Co-requisitos",
					course.coRequisites.length > 0 ? (
						<div className="space-y-1">
							{bidirectional.length > 0 && (
								<div>
									<span className="font-medium">Bidirecionais (↔):</span>{" "}
									{bidirectional
										.map((item) => `${item.name} (${item.code})`)
										.join(", ")}
								</div>
							)}
							{unidirectional.length > 0 && (
								<div>
									<span className="font-medium">Unidirecionais (→):</span>{" "}
									{unidirectional
										.map((item) => `${item.name} (${item.code})`)
										.join(", ")}
								</div>
							)}
						</div>
					) : (
						"Nenhum"
					),
				)}
			</div>
		</div>
	);
}
