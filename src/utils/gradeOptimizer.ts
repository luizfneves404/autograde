import type {
  Grade,
  CourseClass,
  ExprNode,
  TimeSlot,
  ConstraintStatus,
  Course,
} from '@/types';

const overlapCache = new Map<string, boolean>();

// --- SUGAR ON TOP OF EXPRNODE. this is how most users will write the constraints ---

export function propertyValueIn(
  property: string,
  values: readonly (string | number)[],
): ExprNode {
  if (values.length === 0) {
    // empty set ⇒ no class is allowed
    // which is equivalent to `not some(...)`
    return {
      op: 'not',
      child: {
        op: 'some',
        predicate: { op: '==', property, value: 'dummy_never_matches' }, // dummy, never matches
      },
    } as const;
  }

  // build a big OR: (c[p]==v0) ∨ (c[p]==v1) ∨ …
  const orBranches: ExprNode[] = values.map(
    (v) =>
      ({
        op: '==',
        property,
        value: v,
      }) as const,
  );

  return {
    op: 'all',
    predicate: {
      op: 'or',
      children: orBranches,
    },
  } as const;
}

// the below ones map to the UI constraints

export function noGapsByDay(): ExprNode {
  return {
    op: 'custom',
    id: 'no_gaps_by_day',
  } as const;
}

export function noOverlaps(): ExprNode {
  return {
    op: 'pairwise',
    relation: 'overlaps',
    property1: 'schedule',
    property2: 'schedule',
  } as const;
}

export function maxCreditLoad(max: number): ExprNode {
  return {
    op: 'sum',
    property: 'numCreditos',
    operator: '<=',
    value: max,
  } as const;
}

export function courseUnique(): ExprNode {
  return {
    op: 'pairwise',
    relation: '!=',
    property1: 'courseCode',
    property2: 'courseCode',
  } as const;
}

export function availableCourses(courses: string[]): ExprNode {
  return propertyValueIn('courseCode', courses);
}

export function minimumCoursesSet(courses: string[]): ExprNode {
  // some courseCode == course[0] and
  // some courseCode == course[1] and
  // ...
  // some courseCode == course[n]
  return {
    op: 'and',
    children: courses.map((course) => ({
      op: 'some',
      predicate: { op: '==', property: 'courseCode', value: course },
    })),
  } as const;
}

export function forbidCourseCombo(courses: string[]): ExprNode {
  // not (some courseCode == course[0] and some courseCode == course[1] and ... and some courseCode == course[n])
  return {
    op: 'not',
    child: minimumCoursesSet(courses),
  } as const;
}

export function forbidEachCourse(courses: string[]): ExprNode {
  // not (some courseCode == course[0] or
  // some courseCode == course[1] or ...
  // some courseCode == course[n])
  return {
    op: 'not',
    child: {
      op: 'or',
      children: courses.map((course) => ({
        op: 'some',
        predicate: {
          op: '==',
          property: 'courseCode',
          value: course,
        },
      })),
    },
  } as const;
}

// TODO: time restrictions. day of the week, any time. specific time, no day of the week. both.

// TYPE GUARDS

function isComparisonOperator(
  op: string,
): op is '==' | '!=' | '>' | '<' | '>=' | '<=' {
  return ['==', '!=', '>', '<', '>=', '<='].includes(op);
}

function assertNever(value: never): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`,
  );
}

function compare(a: number, op: string, b: number): boolean {
  if (!isComparisonOperator(op)) {
    throw new Error(`Invalid operator: ${op}`);
  }

  switch (op) {
    case '==':
      return a === b;
    case '!=':
      return a !== b;
    case '>':
      return a > b;
    case '<':
      return a < b;
    case '>=':
      return a >= b;
    case '<=':
      return a <= b;
    default:
      return assertNever(op);
  }
}

/**
 * [OPTIMIZED & FIXED] Checks if two schedules have any overlapping times.
 * This version is memoized to avoid re-computing for the same pair of classes.
 * It also fixes a bug where overlaps on different days were not checked.
 * @param classA A Class object.
 * @param classB A Class object.
 * @returns `true` if any two slots overlap, `false` otherwise.
 */
function doSchedulesOverlap(classA: CourseClass, classB: CourseClass): boolean {
  // Create a canonical key for the pair of classes to ensure cache hits
  // regardless of the order they are passed in.
  const idA = `${classA.courseCode}-${classA.classCode}`;
  const idB = `${classB.courseCode}-${classB.classCode}`;
  const cacheKey = idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;

  if (overlapCache.has(cacheKey)) {
    return overlapCache.get(cacheKey)!;
  }

  const scheduleA = classA.schedule;
  const scheduleB = classB.schedule;

  // BUG FIX: The check must be performed on the union of days from both schedules.
  const days = new Set([
    ...scheduleA.map((s) => s.day),
    ...scheduleB.map((s) => s.day),
  ]);

  for (const day of days) {
    const slotsA = scheduleA.filter((s) => s.day === day);
    const slotsB = scheduleB.filter((s) => s.day === day);
    for (const slotA of slotsA) {
      for (const slotB of slotsB) {
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        if (
          slotA.slot.startHour < slotB.slot.endHour &&
          slotA.slot.endHour > slotB.slot.startHour
        ) {
          overlapCache.set(cacheKey, true); // Cache and return
          return true;
        }
      }
    }
  }

  overlapCache.set(cacheKey, false); // Cache and return
  return false;
}

/**
 * [NEW] Recursively traverses a constraint tree and extracts all predicates
 * from 'all' nodes that are combined with 'and'. These predicates apply to
 * individual classes and can be used to pre-filter the list of all available classes.
 */
function extractUnaryPredicates(node: ExprNode): ExprNode[] {
  const predicates: ExprNode[] = [];

  function traverse(n: ExprNode) {
    if (n.op === 'all') {
      predicates.push(n.predicate);
    } else if (n.op === 'and') {
      n.children.forEach(traverse);
    }
    // We don't descend into `or`, `not`, etc. because the logic gets complex.
    // e.g., `A or all(B)` doesn't mean `B` must be true for all classes.
    // This approach safely extracts only the universally required conditions.
  }

  traverse(node);
  return predicates;
}

/**
 * Custom constraint implementation for 'no_gaps_by_day'.
 * For partial evaluation, it can only be VIOLATED (if a gap is found) or PENDING.
 * It is only considered SATISFIED in the final `evaluate` call.
 */
function noGapsByDayImpl(
  classes: readonly CourseClass[],
  isPartial: boolean,
): ConstraintStatus {
  const byDay = new Map<string | number, TimeSlot[]>();
  for (const cls of classes) {
    for (const s of cls.schedule) {
      const daySlots = byDay.get(s.day) ?? [];
      daySlots.push(s.slot);
      byDay.set(s.day, daySlots);
    }
  }

  for (const [, slots] of byDay) {
    if (slots.length < 2) continue;
    slots.sort((a, b) => a.startHour - b.startHour);
    for (let i = 0; i < slots.length - 1; i++) {
      const currentSlot = slots[i]!;
      const nextSlot = slots[i + 1]!;
      if (currentSlot.endHour !== nextSlot.startHour) {
        return 'VIOLATED';
      }
    }
  }

  // If we are checking a partial schedule and found no violations, it's PENDING
  // because a new class could introduce a gap.
  // If we are checking a final schedule (isPartial=false), and we found no violations, it's SATISFIED.
  return isPartial ? 'PENDING' : 'SATISFIED';
}

// --- CONSTRAINT EVALUATION ---

function evalClassPredicate(pred: ExprNode, c: CourseClass): boolean {
  switch (pred.op) {
    case 'and':
      return pred.children.every((ch) => evalClassPredicate(ch, c));
    case 'or':
      return pred.children.some((ch) => evalClassPredicate(ch, c));
    case 'not':
      return !evalClassPredicate(pred.child, c);
    case '==':
      return c[pred.property as keyof CourseClass] === pred.value;
    case '!=':
      return c[pred.property as keyof CourseClass] !== pred.value;
    case '>':
      return (
        (c[pred.property as keyof CourseClass] as number) >
        (pred.value as number)
      );
    case '<':
      return (
        (c[pred.property as keyof CourseClass] as number) <
        (pred.value as number)
      );
    case '>=':
      return (
        (c[pred.property as keyof CourseClass] as number) >=
        (pred.value as number)
      );
    case '<=':
      return (
        (c[pred.property as keyof CourseClass] as number) <=
        (pred.value as number)
      );
    default:
      throw new Error(`Invalid class-level op ${(pred as any).op}`);
  }
}

/**
 * Evaluates a constraint against a complete schedule, returning a simple boolean.
 * This is used for the final validation of a potential solution.
 */
export function evaluate(node: ExprNode, S: readonly CourseClass[]): boolean {
  switch (node.op) {
    case 'and':
      return node.children.every((c) => evaluate(c, S));
    case 'or':
      return node.children.some((c) => evaluate(c, S));
    case 'not':
      return !evaluate(node.child, S);
    case 'some':
      return S.some((c) => evalClassPredicate(node.predicate, c));
    case 'all':
      return S.every((c) => evalClassPredicate(node.predicate, c));
    case 'sum': {
      const pool = node.predicate
        ? S.filter((c) => evalClassPredicate(node.predicate!, c))
        : S;
      const agg = pool.reduce(
        (sum, c) =>
          sum + ((c[node.property as keyof CourseClass] as number) || 0),
        0,
      );
      return compare(agg, node.operator, node.value);
    }
    case 'count': {
      const pool = node.predicate
        ? S.filter((c) => evalClassPredicate(node.predicate!, c))
        : S;
      return compare(pool.length, node.operator, node.value);
    }
    case 'pairwise': {
      const p2 = node.property2 ?? node.property1;
      for (let i = 0; i < S.length; i++) {
        for (let j = i + 1; j < S.length; j++) {
          const classA = S[i]!;
          const classB = S[j]!;
          if (node.relation === '!=') {
            if (
              classA[node.property1 as keyof CourseClass] ===
              classB[p2 as keyof CourseClass]
            )
              return false;
          } else if (node.relation === 'overlaps') {
            if (doSchedulesOverlap(classA, classB)) return false;
          }
        }
      }
      return true;
    }
    case 'custom':
      return noGapsByDayImpl(S, false) === 'SATISFIED';
    case '==':
    case '!=':
    case '>':
    case '<':
    case '>=':
    case '<=':
      throw new Error(
        `Cannot evaluate standalone comparison operator '${node.op}' at the top level.`,
      );
    default:
      return assertNever(node);
  }
}

/**
 * Evaluates a constraint against a partial (in-progress) schedule.
 * This is the core of the pruning logic. It determines if a branch of the search
 * is already invalid and can be abandoned.
 */
export function evaluatePartial(
  node: ExprNode,
  S: readonly CourseClass[],
): ConstraintStatus {
  if (S.length === 0) return 'PENDING';

  switch (node.op) {
    case 'and': {
      let isPending = false;
      for (const child of node.children) {
        const status = evaluatePartial(child, S);
        if (status === 'VIOLATED') return 'VIOLATED';
        if (status === 'PENDING') isPending = true;
      }
      return isPending ? 'PENDING' : 'SATISFIED';
    }

    case 'or': {
      let isPending = false;
      for (const child of node.children) {
        const status = evaluatePartial(child, S);
        if (status === 'SATISFIED') return 'SATISFIED';
        if (status === 'PENDING') isPending = true;
      }
      return isPending ? 'PENDING' : 'VIOLATED';
    }

    case 'not': {
      const childResult = evaluatePartial(node.child, S);
      if (childResult === 'SATISFIED') return 'VIOLATED';
      if (childResult === 'VIOLATED') return 'SATISFIED';
      return 'PENDING';
    }

    case 'some':
      // If any class satisfies it, it's SATISFIED forever.
      // Otherwise, it's PENDING because a future class might satisfy it.
      return S.some((c) => evalClassPredicate(node.predicate, c))
        ? 'SATISFIED'
        : 'PENDING';

    case 'all':
      // If any class fails, it's VIOLATED forever.
      // Otherwise, it's PENDING because a future class might fail.
      return S.every((c) => evalClassPredicate(node.predicate, c))
        ? 'PENDING'
        : 'VIOLATED';

    case 'sum': {
      const pool = node.predicate
        ? S.filter((c) => evalClassPredicate(node.predicate!, c))
        : S;
      const agg = pool.reduce(
        (sum, c) =>
          sum + ((c[node.property as keyof CourseClass] as number) || 0),
        0,
      );

      if (node.operator === '<=' || node.operator === '<') {
        return compare(agg, node.operator, node.value) ? 'PENDING' : 'VIOLATED';
      }
      if (node.operator === '>=' || node.operator === '>') {
        return compare(agg, node.operator, node.value)
          ? 'SATISFIED'
          : 'PENDING';
      }
      // For '==' or '!=', we can't know the final result until the end.
      return 'PENDING';
    }

    case 'count': {
      const pool = node.predicate
        ? S.filter((c) => evalClassPredicate(node.predicate!, c))
        : S;
      if (node.operator === '<=' || node.operator === '<') {
        return compare(pool.length, node.operator, node.value)
          ? 'PENDING'
          : 'VIOLATED';
      }
      if (node.operator === '>=' || node.operator === '>') {
        return compare(pool.length, node.operator, node.value)
          ? 'SATISFIED'
          : 'PENDING';
      }
      return 'PENDING';
    }

    case 'pairwise': {
      const p2 = node.property2 ?? node.property1;
      for (let i = 0; i < S.length; i++) {
        for (let j = i + 1; j < S.length; j++) {
          const classA = S[i]!;
          const classB = S[j]!;
          if (node.relation === '!=') {
            if (
              classA[node.property1 as keyof CourseClass] ===
              classB[p2 as keyof CourseClass]
            )
              return 'VIOLATED';
          } else if (node.relation === 'overlaps') {
            if (doSchedulesOverlap(classA, classB)) return 'VIOLATED';
          }
        }
      }
      // If no violations found yet, it's pending because a new class could cause one.
      return 'PENDING';
    }

    case 'custom':
      switch (node.id) {
        case 'no_gaps_by_day':
          // For partial evaluation, this can only be VIOLATED or PENDING.
          return noGapsByDayImpl(S, true);
        default:
          throw new Error(`Unknown custom constraint: ${node.id}`);
      }

    case '==':
    case '!=':
    case '>':
    case '<':
    case '>=':
    case '<=':
      throw new Error(
        `Cannot evaluate standalone comparison operator '${node.op}' at the top level.`,
      );

    default:
      return assertNever(node);
  }
}

const systemConstraints: ExprNode[] = [
  noOverlaps(),
  maxCreditLoad(30),
  courseUnique(),
  // full classes are handled by generateOptimizedGrades
];

// --- MAIN GRADE GENERATION LOGIC ---

/**
 * Main function to generate optimized class schedules (grades).
 * It filters the classes to only those that have at least one vacant offering with destCode equal to any of the userDestCodes
 * Then it uses a backtracking algorithm that explores combinations of classes to find solutions that satisfy the user preferences
 * Crucially, it uses `evaluatePartial` to prune branches of the search tree
 * that are guaranteed to violate constraints, dramatically improving performance.
 *
 * Receives:
 * - allCourses: a map of all courses, with their classes and offerings
 * - userPreferences: a list of constraints that the user has provided
 * - userDestCodes: a list of destination codes that the user has provided
 * - onProgress: a callback function that is called with the progress of the grade generation
 *
 * Returns:
 * - a list of grades, each with a list of classes
 *
 * Should do basic optimizations, like:
 * - Organizing classes by course to implicitly fulfill courseUnique constraint
 * - filtering classes based on unary constraints
 * - sorting classes by course to prune more effectively
 */
export const generateOptimizedGrades = (
  allCourses: Record<string, Course>,
  userPreferences: ExprNode[],
  userDestCodes: string[],
  onProgress?: (progress: number) => void,
): Grade[] => {
  const allConstraintsNode: ExprNode = {
    op: 'and',
    children: [...systemConstraints, ...userPreferences],
  };
  // TODO: add the constraints that are intrinsic to the courses, like co requisites
  const solutions: Grade[] = [];

  const allClasses = Object.values(allCourses).flatMap(
    (course) => course.classes,
  );
  const filteredClasses = allClasses.filter((courseClass) =>
    courseClass.offerings.some(
      (offering) =>
        userDestCodes.includes(offering.destCode) && offering.vacancyCount > 0,
    ),
  );

  // --- OPTIMIZATION 1: Pre-filter classes based on unary constraints ---
  const unaryPredicates = extractUnaryPredicates(allConstraintsNode);
  const combinedUnaryPredicate: ExprNode = {
    op: 'and',
    children: unaryPredicates,
  };

  const viableClasses =
    unaryPredicates.length > 0
      ? filteredClasses.filter((courseClass) =>
          evalClassPredicate(combinedUnaryPredicate, courseClass),
        )
      : filteredClasses;

  // --- OPTIMIZATION 2: Clear memoization cache from any previous runs ---
  overlapCache.clear();

  // --- OPTIMIZATION 3: Organize classes by course code ---
  // This is crucial for the courseUnique constraint - we can only pick one class per course
  const courseGroups: CourseClass[][] = [];
  const classesByCourse = new Map<string, CourseClass[]>();

  // Group viable classes by course code
  for (const courseClass of viableClasses) {
    const courseCode = courseClass.courseCode;
    if (!classesByCourse.has(courseCode)) {
      classesByCourse.set(courseCode, []);
    }
    classesByCourse.get(courseCode)!.push(courseClass);
  }

  // Convert to array of arrays for easier processing
  for (const [_, classes] of classesByCourse) {
    courseGroups.push(classes);
  }

  // --- OPTIMIZATION 4: Sort class groups to prune more effectively ---
  // Process groups with fewer choices first to keep the search tree narrow at the top.
  // This is a heuristic that can often lead to faster pruning.
  courseGroups.sort((a, b) => a.length - b.length);

  const totalCombinations = courseGroups.reduce(
    (acc, group) => acc * (group.length + 1),
    1,
  );
  console.log('Generating grades with', totalCombinations, 'combinations');
  let combinationsChecked = 0;

  function findCombinations(groupIndex: number, currentGrade: CourseClass[]) {
    // Base Case: We have considered all discipline groups.
    if (groupIndex === courseGroups.length) {
      combinationsChecked++;
      if (onProgress) {
        onProgress(combinationsChecked / totalCombinations);
      }
      // A final, full evaluation is needed because some constraints might still be PENDING.
      if (
        currentGrade.length > 0 &&
        evaluate(allConstraintsNode, currentGrade)
      ) {
        solutions.push({
          classes: [...currentGrade],
          score: 0, // Score can be calculated later if needed
          preferences: [], // This can be populated based on which preferences are met
        });
      }
      return;
    }

    const currentGroup = courseGroups[groupIndex]!;

    // Path 1: Explore combinations WITHOUT adding a class from the current group.
    findCombinations(groupIndex + 1, currentGrade);

    // Path 2: Explore combinations by adding EACH class from the current group.
    for (const courseClass of currentGroup) {
      currentGrade.push(courseClass);

      // PRUNING LOGIC: Evaluate the partial schedule.
      const status = evaluatePartial(allConstraintsNode, currentGrade);

      // Only continue down this path if it hasn't been definitively violated.
      if (status !== 'VIOLATED') {
        findCombinations(groupIndex + 1, currentGrade);
      } else {
        // This entire branch is invalid. We can skip all sub-combinations.
        const remainingGroups = courseGroups.slice(groupIndex + 1);
        const prunedCount = remainingGroups.reduce(
          (acc, group) => acc * (group.length + 1),
          1,
        );
        combinationsChecked += prunedCount;
      }

      // Backtrack: Remove the class to explore other options.
      currentGrade.pop();
    }
  }

  findCombinations(0, []);
  if (onProgress) onProgress(1); // Ensure progress bar completes
  return solutions;
};
