import { z } from "zod";

// ============================================================================
// GROUP 1: Zod-First (No duplication) - Simple types inferred from schemas
// ============================================================================

export const DayOfWeekSchema = z.enum([
	"segunda",
	"terça",
	"quarta",
	"quinta",
	"sexta",
	"sábado",
]);
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;

export const TimeSlotSchema = z.object({
	startHour: z.number(),
	endHour: z.number(),
});
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const ClassTimeSchema = z.object({
	day: DayOfWeekSchema,
	slot: TimeSlotSchema,
});
export type ClassTime = z.infer<typeof ClassTimeSchema>;

export const ClassOfferingSchema = z.object({
	classCode: z.string(),
	courseCode: z.string(),
	destCode: z.string(),
	vacancyCount: z.number(),
});
export type ClassOffering = z.infer<typeof ClassOfferingSchema>;

export const CourseClassSchema = z.object({
	classCode: z.string(),
	courseCode: z.string(),
	professorName: z.string(),
	distanceHours: z.number(),
	SHFHours: z.number(),
	schedule: z.array(ClassTimeSchema),
	offerings: z.array(ClassOfferingSchema),
});
export type CourseClass = z.infer<typeof CourseClassSchema>;

export const CourseSchema = z.object({
	code: z.string(),
	name: z.string(),
	shouldHavePreRequisites: z.boolean(),
	coRequisites: z.array(z.string()).default([]),
	numCredits: z.number(),
	classes: z.array(CourseClassSchema),
});
export type Course = z.infer<typeof CourseSchema>;

// ============================================================================
// GROUP 2: Type-First (Recursive/Complex) - ExprNode with schema bound to type
// ============================================================================

export type CourseClassForEval = CourseClass & {
	numCredits: number;
	shouldHavePreRequisites: boolean;
	coRequisites: string[];
};

// Core constraint language - minimal and complete
export type ExprNode =
	// ─── Boolean Logic ───────────────────────────────────
	| { op: "and" | "or"; children: ExprNode[] }
	| { op: "not"; child: ExprNode }

	// ─── Class‐level Predicate ───────────────────────────
	| {
			op: "==" | "!=" | ">" | "<" | ">=" | "<=";
			property: keyof CourseClassForEval;
			value: string | number;
	  }
	| {
			op: "in";
			property: keyof CourseClassForEval;
			value: string[] | number[];
	  }
	| {
			op: "contains";
			property: keyof CourseClassForEval;
			value: string | number;
	  }

	// ─── Schedule‐level Quantifier ───────────────────────
	| {
			op: "some" | "all"; // ∃ or ∀
			predicate: ExprNode; // evaluated per-class
	  }

	// ─── Aggregation ────────────────────────────────────
	| {
			op: "sum"; // sum of a property, or count of classes
			property: keyof CourseClassForEval;
			operator: "==" | "!=" | ">" | "<" | ">=" | "<=";
			value: number;
			predicate?: ExprNode; // optional filter on which classes to include
	  }
	| {
			op: "count";
			predicate: ExprNode; // evaluated per-class
			operator: "==" | "!=" | ">" | "<" | ">=" | "<=";
			value: number;
	  }

	// ─── Custom Node ────────────────────────────────────
	| {
			op: "custom";
			id: "no_gaps_by_day";
	  }
	| {
			op: "custom";
			id: "forbid_classes_on_days";
			params: { days: DayOfWeek[] };
	  };

// Bind the schema to the ExprNode type
export const ExprNodeSchema: z.ZodType<ExprNode> = z.lazy(() =>
	z.union([
		// Boolean Logic
		z.object({
			op: z.enum(["and", "or"]),
			children: z.array(ExprNodeSchema),
		}),
		z.object({
			op: z.literal("not"),
			child: ExprNodeSchema,
		}),

		// Class-level Predicate
		z.object({
			op: z.enum(["==", "!=", ">", "<", ">=", "<="]),
			property: z.enum([
				"numCredits",
				"shouldHavePreRequisites",
				"classCode",
				"courseCode",
				"professorName",
				"distanceHours",
				"SHFHours",
				"schedule",
				"offerings",
				"coRequisites",
			]),
			value: z.union([z.string(), z.number()]),
		}),
		z.object({
			op: z.literal("in"),
			property: z.enum([
				"numCredits",
				"shouldHavePreRequisites",
				"classCode",
				"courseCode",
				"professorName",
				"distanceHours",
				"SHFHours",
				"schedule",
				"offerings",
				"coRequisites",
			]),
			value: z.union([z.array(z.string()), z.array(z.number())]),
		}),
		z.object({
			op: z.literal("contains"),
			property: z.enum([
				"numCredits",
				"shouldHavePreRequisites",
				"classCode",
				"courseCode",
				"professorName",
				"distanceHours",
				"SHFHours",
				"schedule",
				"offerings",
				"coRequisites",
			]),
			value: z.union([z.string(), z.number()]),
		}),

		// Schedule-level Quantifier
		z.object({
			op: z.enum(["some", "all"]),
			predicate: ExprNodeSchema,
		}),

		// Aggregation
		z.object({
			op: z.literal("sum"),
			property: z.enum([
				"numCredits",
				"shouldHavePreRequisites",
				"classCode",
				"courseCode",
				"professorName",
				"distanceHours",
				"SHFHours",
				"schedule",
				"offerings",
				"coRequisites",
			]),
			operator: z.enum(["==", "!=", ">", "<", ">=", "<="]),
			value: z.number(),
			predicate: ExprNodeSchema.optional(),
		}),
		z.object({
			op: z.literal("count"),
			predicate: ExprNodeSchema,
			operator: z.enum(["==", "!=", ">", "<", ">=", "<="]),
			value: z.number(),
		}),

		// Custom Nodes
		z.object({
			op: z.literal("custom"),
			id: z.literal("no_gaps_by_day"),
		}),
		z.object({
			op: z.literal("custom"),
			id: z.literal("forbid_classes_on_days"),
			params: z.object({ days: z.array(DayOfWeekSchema) }),
		}),
	]),
);

// ============================================================================
// GROUP 3: Root App Data - Inferred from schemas
// ============================================================================

export const UIConstraintSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	enabled: z.boolean(),
	expression: ExprNodeSchema,
});
export type UIConstraint = z.infer<typeof UIConstraintSchema>;

export const PreferenceSetSchema = z.object({
	hardConstraints: z.array(UIConstraintSchema),
	userDestCodes: z.array(z.string()),
});
export type PreferenceSet = z.infer<typeof PreferenceSetSchema>;

export const AppDataSchema = z.object({
	courses: z.record(z.string(), CourseSchema),
	preferenceSet: PreferenceSetSchema,
});
export type AppData = z.infer<typeof AppDataSchema>;

// ============================================================================
// Helper Types (not in schemas, derived from base types)
// ============================================================================

export type Schedule = ClassTime[];

export type ClassIdentifier = Pick<CourseClass, "classCode" | "courseCode">;

export type ClassOfferingIdentifier = Pick<
	ClassOffering,
	"classCode" | "courseCode" | "destCode"
>;

export type Grade = {
	classes: CourseClass[];
};
