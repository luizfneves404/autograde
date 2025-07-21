import type {
  Grade,
  CourseClass,
  ExprNode,
  TimeSlot,
  ConstraintStatus,
  Course,
  CourseClassWithCourseInfo,
} from '@/types';

const overlapCache = new Map<string, boolean>();

// --- CONSTRAINT BUILDER FUNCTIONS (SUGAR) ---

export function propertyValueIn(
  property: keyof CourseClassWithCourseInfo,
  values: readonly (string | number)[],
): ExprNode {
  if (values.length === 0) {
    return {
      op: 'not',
      child: {
        op: 'some',
        predicate: { op: '==', property, value: 'dummy_never_matches' },
      },
    } as const;
  }

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

export function noGapsByDay(): ExprNode {
  return { op: 'custom', id: 'no_gaps_by_day' } as const;
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
    property: 'numCredits',
    operator: '<=',
    value: max,
  } as const;
}

export function minCreditLoad(min: number): ExprNode {
  return {
    op: 'sum',
    property: 'numCredits',
    operator: '>=',
    value: min,
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
  return {
    op: 'and',
    children: courses.map((course) => ({
      op: 'some',
      predicate: { op: '==', property: 'courseCode', value: course },
    })),
  } as const;
}

export function forbidCourseCombo(courses: string[]): ExprNode {
  return {
    op: 'not',
    child: minimumCoursesSet(courses),
  } as const;
}

export function forbidEachCourse(courses: string[]): ExprNode {
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

// --- UTILITY FUNCTIONS ---

export function enrichClass(
  courseClass: CourseClass,
  allCourses: Record<string, Course>,
): CourseClassWithCourseInfo {
  const course = allCourses[courseClass.courseCode];
  if (!course) {
    throw new Error(`Course ${courseClass.courseCode} not found`);
  }

  return {
    ...courseClass,
    numCredits: course.numCredits,
    shouldHavePreRequisites: course.shouldHavePreRequisites,
    bidirCoRequisites: course.bidirCoRequisites,
    unidirCoRequisites: course.unidirCoRequisites,
  };
}

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

function doSchedulesOverlap(classA: CourseClass, classB: CourseClass): boolean {
  const idA = `${classA.courseCode}-${classA.classCode}`;
  const idB = `${classB.courseCode}-${classB.classCode}`;
  const cacheKey = idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;

  const cached = overlapCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const scheduleA = classA.schedule;
  const scheduleB = classB.schedule;

  const days = new Set([
    ...scheduleA.map((s) => s.day),
    ...scheduleB.map((s) => s.day),
  ]);

  for (const day of days) {
    const slotsA = scheduleA.filter((s) => s.day === day);
    const slotsB = scheduleB.filter((s) => s.day === day);
    for (const slotA of slotsA) {
      for (const slotB of slotsB) {
        if (
          slotA.slot.startHour < slotB.slot.endHour &&
          slotA.slot.endHour > slotB.slot.startHour
        ) {
          overlapCache.set(cacheKey, true);
          return true;
        }
      }
    }
  }

  overlapCache.set(cacheKey, false);
  return false;
}

function extractUnaryPredicates(node: ExprNode): ExprNode[] {
  const predicates: ExprNode[] = [];

  function traverse(n: ExprNode) {
    if (n.op === 'all') {
      predicates.push(n.predicate);
    } else if (n.op === 'and') {
      n.children.forEach(traverse);
    }
  }

  traverse(node);
  return predicates;
}

// --- UNIFIED CONSTRAINT EVALUATION ENGINE ---

type EvaluationMode = 'boolean' | 'partial' | 'explain';

type EvaluationContext = {
  mode: EvaluationMode;
  isPartialSchedule: boolean;
  classes: readonly CourseClassWithCourseInfo[];
};

type UnifiedResult = {
  boolean: boolean;
  status: ConstraintStatus;
  reasons: string[];
};

function createResult(
  success: boolean,
  status: ConstraintStatus,
  reasons: string | string[] = [],
): UnifiedResult {
  return {
    boolean: success,
    status,
    reasons: Array.isArray(reasons) ? reasons : [reasons],
  };
}

function evalClassPredicate(
  pred: ExprNode,
  c: CourseClassWithCourseInfo,
): boolean {
  switch (pred.op) {
    case 'and':
      return pred.children.every((ch) => evalClassPredicate(ch, c));
    case 'or':
      return pred.children.some((ch) => evalClassPredicate(ch, c));
    case 'not':
      return !evalClassPredicate(pred.child, c);
    case '==':
    case '!=':
    case '>':
    case '<':
    case '>=':
    case '<=':
      return (
        compare(c[pred.property] as number, pred.op, pred.value as number) ||
        (c[pred.property] === pred.value &&
          (pred.op === '==' || pred.op === '!='))
      );
    default:
      throw new Error(`Invalid class-level op ${pred.op}`);
  }
}

// Custom constraint implementations
const customConstraints = {
  no_gaps_by_day: (
    classes: readonly CourseClassWithCourseInfo[],
    context: EvaluationContext,
  ): UnifiedResult => {
    type DayScheduleInfo = {
      slot: TimeSlot;
      classInfo: string;
    };

    const byDay = new Map<string | number, DayScheduleInfo[]>();

    for (const cls of classes) {
      for (const s of cls.schedule) {
        const daySlots = byDay.get(s.day) ?? [];
        daySlots.push({
          slot: s.slot,
          classInfo: `${cls.courseCode}-${cls.classCode}`,
        });
        byDay.set(s.day, daySlots);
      }
    }

    for (const [day, daySchedule] of byDay) {
      if (daySchedule.length < 2) continue;

      daySchedule.sort((a, b) => a.slot.startHour - b.slot.startHour);

      for (const [i, current] of daySchedule.entries()) {
        const next = daySchedule[i + 1];
        if (!next) break;

        if (current.slot.endHour !== next.slot.startHour) {
          const reason = `Schedule has a gap on day '${day.toString()}' between ${current.classInfo} (ends at ${current.slot.endHour.toString()}:00) and ${next.classInfo} (starts at ${next.slot.startHour.toString()}:00).`;
          return createResult(false, 'VIOLATED', reason);
        }
      }
    }

    if (context.isPartialSchedule) {
      return createResult(
        true,
        'PENDING',
        'No gaps found in partial schedule.',
      );
    }

    return createResult(
      true,
      'SATISFIED',
      'Schedule has no gaps between classes on any day.',
    );
  },
};

function evaluateUnified(
  node: ExprNode,
  context: EvaluationContext,
): UnifiedResult {
  const { classes } = context;

  if (classes.length === 0) {
    return createResult(
      true,
      'PENDING',
      'Empty schedule - pending evaluation.',
    );
  }

  switch (node.op) {
    case 'and': {
      const childResults = node.children.map((child) =>
        evaluateUnified(child, context),
      );

      if (context.mode === 'boolean') {
        const success = childResults.every((r) => r.boolean);
        return createResult(success, success ? 'SATISFIED' : 'VIOLATED');
      }

      if (context.mode === 'partial') {
        const violated = childResults.find((r) => r.status === 'VIOLATED');
        if (violated) return violated;

        const hasPending = childResults.some((r) => r.status === 'PENDING');
        return createResult(true, hasPending ? 'PENDING' : 'SATISFIED');
      }

      // explain mode
      const violations = childResults.filter((r) => r.status === 'VIOLATED');
      if (violations.length > 0) {
        const allReasons = violations.flatMap((r) => r.reasons);
        return createResult(false, 'VIOLATED', allReasons);
      }
      return createResult(
        true,
        'SATISFIED',
        'All sub-constraints are satisfied.',
      );
    }

    case 'or': {
      const childResults = node.children.map((child) =>
        evaluateUnified(child, context),
      );

      if (context.mode === 'boolean') {
        const success = childResults.some((r) => r.boolean);
        return createResult(success, success ? 'SATISFIED' : 'VIOLATED');
      }

      if (context.mode === 'partial') {
        const satisfied = childResults.find((r) => r.status === 'SATISFIED');
        if (satisfied) return satisfied;

        const hasPending = childResults.some((r) => r.status === 'PENDING');
        return createResult(false, hasPending ? 'PENDING' : 'VIOLATED');
      }

      // explain mode
      const satisfied = childResults.find((r) => r.status === 'SATISFIED');
      if (satisfied) {
        return createResult(
          true,
          'SATISFIED',
          'At least one sub-constraint is satisfied.',
        );
      }

      const violationReasons = childResults.flatMap((r) => r.reasons);
      return createResult(false, 'VIOLATED', [
        'No sub-constraints were satisfied. Reasons for failure include:',
        ...violationReasons.map((r) => `  - ${r}`),
      ]);
    }

    case 'not': {
      const childResult = evaluateUnified(node.child, context);

      if (context.mode === 'boolean') {
        return createResult(
          !childResult.boolean,
          childResult.boolean ? 'VIOLATED' : 'SATISFIED',
        );
      }

      if (context.mode === 'partial') {
        if (childResult.status === 'SATISFIED')
          return createResult(false, 'VIOLATED');
        if (childResult.status === 'VIOLATED')
          return createResult(true, 'SATISFIED');
        return createResult(true, 'PENDING');
      }

      // explain mode
      if (childResult.status === 'SATISFIED') {
        return createResult(
          false,
          'VIOLATED',
          `NOT constraint failed because the inner condition was met: "${childResult.reasons.join(' ')}"`,
        );
      }
      return createResult(
        true,
        'SATISFIED',
        `NOT constraint met because the inner condition failed: "${childResult.reasons.join(' ')}"`,
      );
    }

    case 'some': {
      const satisfyingClasses = classes.filter((c) =>
        evalClassPredicate(node.predicate, c),
      );
      const firstSatisfying = satisfyingClasses[0];
      const hasSatisfying = firstSatisfying !== undefined;

      if (context.mode === 'boolean') {
        return createResult(
          hasSatisfying,
          hasSatisfying ? 'SATISFIED' : 'VIOLATED',
        );
      }

      if (context.mode === 'partial') {
        return createResult(
          hasSatisfying,
          hasSatisfying ? 'SATISFIED' : 'PENDING',
        );
      }

      // explain mode
      if (hasSatisfying) {
        return createResult(
          true,
          'SATISFIED',
          `Condition met by class ${firstSatisfying.courseCode}-${firstSatisfying.classCode}.`,
        );
      }
      return createResult(
        false,
        'VIOLATED',
        'No class in the schedule satisfies the condition.',
      );
    }

    case 'all': {
      const failingClasses = classes.filter(
        (c) => !evalClassPredicate(node.predicate, c),
      );
      const allSatisfy = failingClasses.length === 0;

      if (context.mode === 'boolean') {
        return createResult(allSatisfy, allSatisfy ? 'SATISFIED' : 'VIOLATED');
      }

      if (context.mode === 'partial') {
        return createResult(allSatisfy, allSatisfy ? 'PENDING' : 'VIOLATED');
      }

      // explain mode
      if (!allSatisfy) {
        const reasons = failingClasses.map(
          (c) => `Class ${c.courseCode}-${c.classCode} fails the condition.`,
        );
        return createResult(false, 'VIOLATED', reasons);
      }
      return createResult(
        true,
        'SATISFIED',
        'All classes in the schedule satisfy the condition.',
      );
    }

    case 'sum': {
      let pool: readonly CourseClassWithCourseInfo[];
      if (!node.predicate) {
        pool = classes;
      } else {
        const predicate = node.predicate;
        pool = classes.filter((c) => evalClassPredicate(predicate, c));
      }

      const agg = pool.reduce(
        (sum, c) => sum + ((c[node.property] as number) || 0),
        0,
      );
      const isMet = compare(agg, node.operator, node.value);

      if (context.mode === 'boolean') {
        return createResult(isMet, isMet ? 'SATISFIED' : 'VIOLATED');
      }

      if (context.mode === 'partial') {
        if (node.operator === '<=' || node.operator === '<') {
          return createResult(isMet, isMet ? 'PENDING' : 'VIOLATED');
        }
        if (node.operator === '>=' || node.operator === '>') {
          return createResult(isMet, isMet ? 'SATISFIED' : 'PENDING');
        }
        return createResult(true, 'PENDING');
      }

      // explain mode
      const reason = `The sum of '${node.property}' is ${agg.toString()}, which ${
        isMet ? 'satisfies' : 'violates'
      } the condition to be ${node.operator} ${node.value.toString()}.`;
      return createResult(isMet, isMet ? 'SATISFIED' : 'VIOLATED', reason);
    }

    case 'count': {
      const pool = classes.filter((c) => evalClassPredicate(node.predicate, c));
      const isMet = compare(pool.length, node.operator, node.value);

      if (context.mode === 'boolean') {
        return createResult(isMet, isMet ? 'SATISFIED' : 'VIOLATED');
      }

      if (context.mode === 'partial') {
        if (node.operator === '<=' || node.operator === '<') {
          return createResult(isMet, isMet ? 'PENDING' : 'VIOLATED');
        }
        if (node.operator === '>=' || node.operator === '>') {
          return createResult(isMet, isMet ? 'SATISFIED' : 'PENDING');
        }
        return createResult(true, 'PENDING');
      }

      // explain mode
      const reason = `The class count is ${pool.length.toString()}, which ${
        isMet ? 'satisfies' : 'violates'
      } the condition to be ${node.operator} ${node.value.toString()}.`;
      return createResult(isMet, isMet ? 'SATISFIED' : 'VIOLATED', reason);
    }

    case 'pairwise': {
      const p2 = node.property2 ?? node.property1;

      for (const classA of classes) {
        for (const classB of classes) {
          if (classA === classB) continue;

          let violated = false;
          let reason = '';

          if (node.relation === '!=') {
            if (classA[node.property1] === classB[p2]) {
              violated = true;
              reason = `Classes ${classA.courseCode}-${classA.classCode} and ${classB.courseCode}-${classB.classCode} have the same '${node.property1}', which is not allowed.`;
            }
          } else {
            if (doSchedulesOverlap(classA, classB)) {
              violated = true;
              reason = `Schedules for ${classA.courseCode}-${classA.classCode} and ${classB.courseCode}-${classB.classCode} overlap.`;
            }
          }

          if (violated) {
            return createResult(false, 'VIOLATED', reason);
          }
        }
      }

      const successReason = `No pair of classes violates the '${node.relation}' rule on property '${node.property1}'.`;

      if (context.mode === 'partial') {
        return createResult(true, 'PENDING', successReason);
      }

      return createResult(true, 'SATISFIED', successReason);
    }

    case 'custom': {
      const customFn = customConstraints[node.id];
      return customFn(classes, context);
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

// --- PUBLIC API FUNCTIONS ---

export function evaluate(
  node: ExprNode,
  S: readonly CourseClassWithCourseInfo[],
): boolean {
  const context: EvaluationContext = {
    mode: 'boolean',
    isPartialSchedule: false,
    classes: S,
  };
  return evaluateUnified(node, context).boolean;
}

export function evaluatePartial(
  node: ExprNode,
  S: readonly CourseClassWithCourseInfo[],
): ConstraintStatus {
  const context: EvaluationContext = {
    mode: 'partial',
    isPartialSchedule: true,
    classes: S,
  };
  return evaluateUnified(node, context).status;
}

export type EvaluationResult = {
  status: 'SATISFIED' | 'VIOLATED';
  reasons: string[];
};

export function explain(
  node: ExprNode,
  S: readonly CourseClassWithCourseInfo[],
): EvaluationResult {
  const context: EvaluationContext = {
    mode: 'explain',
    isPartialSchedule: false,
    classes: S,
  };
  const result = evaluateUnified(node, context);
  return {
    status: result.status as 'SATISFIED' | 'VIOLATED',
    reasons: result.reasons,
  };
}

// --- SYSTEM CONSTRAINTS ---

const systemConstraints: ExprNode[] = [
  noOverlaps(),
  maxCreditLoad(30),
  courseUnique(),
];

// --- MAIN GRADE GENERATION LOGIC ---

export const generateOptimizedGrades = (
  allCourses: Record<string, Course>,
  userPreferences: ExprNode[],
  userDestCodes: string[],
  onProgress?: (progress: number) => void,
): Grade[] => {
  console.groupCollapsed(
    `[GradeGenerator] 🚀 Starting Grade Generation Process`,
  );
  console.info(
    `Received ${Object.keys(allCourses).length.toString()} courses.`,
  );
  console.info(
    `Received ${userPreferences.length.toString()} user preferences.`,
  );
  console.info(`Filtering for destination codes:`, userDestCodes);
  console.groupEnd();

  const allConstraintsNode: ExprNode = {
    op: 'and',
    children: [...systemConstraints, ...userPreferences],
  };
  // TODO: add the constraints that are intrinsic to the courses, like co requisites, etc.
  const solutions: Grade[] = [];

  const allClasses = Object.values(allCourses).flatMap(
    (course) => course.classes,
  );
  const allClassesWithCourseInfo: CourseClassWithCourseInfo[] = allClasses.map(
    (courseClass) => enrichClass(courseClass, allCourses),
  );

  // Pre-filtering by destination & vacancy
  const filteredClasses = allClassesWithCourseInfo.filter((courseClass) =>
    courseClass.offerings.some(
      (offering) =>
        userDestCodes.includes(offering.destCode) && offering.vacancyCount > 0,
    ),
  );

  console.log(
    `[GradeGenerator] 篩 Initial Filter: ${allClasses.length.toString()} classes -> ${filteredClasses.length.toString()} classes after filtering by destination and vacancy.`,
  );

  if (filteredClasses.length === 0) {
    console.error(
      '[GradeGenerator] ❌ No classes available for the selected destinations with vacancies. Cannot generate grades.',
    );
    return [];
  }

  // Pre-filter classes based on unary constraints
  const unaryPredicates = extractUnaryPredicates(allConstraintsNode);
  const combinedUnaryPredicate: ExprNode = {
    op: 'and',
    children: unaryPredicates,
  };

  let viableClasses: CourseClassWithCourseInfo[];
  if (unaryPredicates.length > 0) {
    console.groupCollapsed(
      `[GradeGenerator] 🔍 Applying ${unaryPredicates.length.toString()} unary (single-class) constraints...`,
    );
    viableClasses = filteredClasses.filter((courseClass) => {
      const isViable = evalClassPredicate(combinedUnaryPredicate, courseClass);
      if (!isViable) {
        console.log(
          `  -> ❌ Filtering out ${courseClass.courseCode} - ${courseClass.classCode}`,
        );
      }
      return isViable;
    });
    console.groupEnd();
    console.warn(
      `[GradeGenerator] Unary Filter: ${filteredClasses.length.toString()} classes -> ${viableClasses.length.toString()} classes after applying unary constraints.`,
    );
  } else {
    console.log('[GradeGenerator] No unary constraints to apply.');
    viableClasses = filteredClasses;
  }

  if (viableClasses.length === 0) {
    console.error(
      '[GradeGenerator] ❌ All classes were filtered out by unary constraints. Cannot generate grades.',
    );
    return [];
  }

  // Clear memoization cache
  overlapCache.clear();

  // Group by course and sort
  const courseGroups: CourseClassWithCourseInfo[][] = Array.from(
    Map.groupBy(viableClasses, (c) => c.courseCode).values(),
  ).sort((a, b) => a.length - b.length);

  console.log(
    `[GradeGenerator] 📚 Grouped viable classes into ${courseGroups.length.toString()} courses. Sorted groups by size to optimize pruning.`,
  );

  // Backtracking search
  const totalCombinations = courseGroups.reduce(
    (acc, group) => acc * (group.length + 1),
    1,
  );
  console.info(
    `[GradeGenerator] 🧠 Starting backtracking search. Max potential combinations: ~${totalCombinations.toExponential(2)}.`,
  );
  let combinationsChecked = 0;

  function findCombinations(
    groupIndex: number,
    currentGrade: CourseClassWithCourseInfo[],
  ) {
    const gradeCodes = currentGrade.map(
      (c) => `${c.courseCode}-${c.classCode}`,
    );
    console.groupCollapsed(
      `[Recursion] Depth: ${groupIndex.toString()}, Current Grade: [${gradeCodes.join(', ')}]`,
    );

    // Base case
    if (groupIndex === courseGroups.length) {
      combinationsChecked++;
      if (onProgress) {
        onProgress(combinationsChecked / totalCombinations);
      }

      console.log(
        `[Base Case] Reached end of path. Final evaluation for [${gradeCodes.join(', ')}]...`,
      );

      if (
        currentGrade.length > 0 &&
        evaluate(allConstraintsNode, currentGrade)
      ) {
        solutions.push({
          classes: [...currentGrade],
        });
        console.log(
          `%c🎉 SOLUTION FOUND! Added grade with ${currentGrade.length.toString()} classes.`,
          'color: #28a745; font-weight: bold;',
        );
      } else {
        console.log(` -> Final combination is invalid or empty.`);
      }
      console.groupEnd();
      return;
    }

    const currentGroup = courseGroups[groupIndex];
    if (!currentGroup || currentGroup[0] === undefined) {
      throw new Error(
        'Did not expect to have no current group or an empty group',
      );
    }

    const courseCode = currentGroup[0].courseCode;

    // Path 1: Skip this course group
    console.log(
      `Path 1: Skipping course group ${courseCode} (contains ${currentGroup.length.toString()} classes)`,
    );
    findCombinations(groupIndex + 1, currentGrade);

    // Path 2: Try each class from current group
    for (const courseClass of currentGroup) {
      console.log(
        `Path 2: Trying to add ${courseClass.courseCode} - ${courseClass.classCode}...`,
      );
      currentGrade.push(courseClass);

      // Pruning logic using unified evaluation
      const status = evaluatePartial(allConstraintsNode, currentGrade);

      if (status !== 'VIOLATED') {
        console.log(
          ` -> Status: ${status}. Looks good, proceeding to next level.`,
        );
        findCombinations(groupIndex + 1, currentGrade);
      } else {
        const remainingGroups = courseGroups.slice(groupIndex + 1);
        const prunedCount = remainingGroups.reduce(
          (acc, group) => acc * (group.length + 1),
          1,
        );
        combinationsChecked += prunedCount;
        console.warn(
          `%c -> ✂️ PRUNED! Violation detected. Skipping ~${prunedCount.toExponential(2)} combinations.`,
          'color: #dc3545;',
        );
      }

      currentGrade.pop();
    }

    console.groupEnd();
  }

  findCombinations(0, []);
  if (onProgress) onProgress(1);

  console.info(
    `[GradeGenerator] ✅ Search Complete. Found ${solutions.length.toString()} valid grade(s).`,
  );

  if (solutions.length === 0) {
    console.warn(
      `[GradeGenerator] SUMMARY: No solutions were found. Check the logs above. Common reasons include:
      1. No classes matched your destination codes or had vacancies.
      2. Overly strict user preferences filtered out all classes or combinations.
      3. Conflicting class schedules (time overlaps).`,
    );
  }

  return solutions;
};
