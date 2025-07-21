import type {
  Grade,
  CourseClass,
  ExprNode,
  TimeSlot,
  Course,
  CourseClassForEval,
  DayOfWeek,
} from '@/types';

export function propertyValueIn(
  property: keyof CourseClassForEval,
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

// Time restriction functions

// TODO: THOSE WONT WORK BECAUSE THE < AND > OPS WONT WORK WITH SETS
// export function forbidClassesBefore(hour: number): ExprNode {
//   return {
//     op: 'not',
//     child: {
//       op: 'some',
//       predicate: {
//         op: '<',
//         property: 'schedule_start_hours',
//         value: hour,
//       },
//     },
//   } as const;
// }

// export function forbidClassesAfter(hour: number): ExprNode {
//   return {
//     op: 'not',
//     child: {
//       op: 'some',
//       predicate: {
//         op: '>',
//         property: 'schedule_end_hours',
//         value: hour,
//       },
//     },
//   } as const;
// }

export function forbidClassesOnDays(days: DayOfWeek[]): ExprNode {
  return {
    op: 'custom',
    id: 'forbid_classes_on_days',
    params: { days: days },
  } as const;
}

// --- UTILITY FUNCTIONS ---

export function enrichClass(
  courseClass: CourseClass,
  allCourses: Record<string, Course>,
): CourseClassForEval {
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

/**
 * Checks if two time slots overlap
 */
function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return slot1.startHour < slot2.endHour && slot1.endHour > slot2.startHour;
}

export type EvaluationMode = 'boolean' | 'explain';
export type EvaluationResult = {
  satisfied: boolean;
  reasons: string[];
};

export function evaluateConstraint(
  node: ExprNode,
  classes: readonly CourseClassForEval[],
  mode: EvaluationMode = 'boolean',
): EvaluationResult {
  switch (node.op) {
    case 'and': {
      const childResults = node.children.map((child) =>
        evaluateConstraint(child, classes, mode),
      );

      const failedResults = childResults.filter((r) => !r.satisfied);
      if (failedResults.length > 0) {
        return {
          satisfied: false,
          reasons:
            mode === 'explain'
              ? failedResults.flatMap((r) => r.reasons)
              : ['One or more AND conditions failed'],
        };
      }

      return {
        satisfied: true,
        reasons: mode === 'explain' ? ['All AND conditions are satisfied'] : [],
      };
    }

    case 'or': {
      const childResults = node.children.map((child) =>
        evaluateConstraint(child, classes, mode),
      );

      const successfulResult = childResults.find((r) => r.satisfied);
      if (successfulResult) {
        return {
          satisfied: true,
          reasons:
            mode === 'explain'
              ? [
                  `OR condition satisfied: ${successfulResult.reasons.join('; ')}`,
                ]
              : [],
        };
      }

      return {
        satisfied: false,
        reasons:
          mode === 'explain'
            ? [
                'No OR conditions were satisfied. All failed because:',
                ...childResults.flatMap((r, i) => [
                  `  Branch ${(i + 1).toString()}: ${r.reasons.join('; ')}`,
                ]),
              ]
            : ['No OR conditions were met'],
      };
    }

    case 'not': {
      const childResult = evaluateConstraint(node.child, classes, mode);
      return {
        satisfied: !childResult.satisfied,
        reasons:
          mode === 'explain'
            ? childResult.satisfied
              ? [
                  `NOT condition failed because inner condition was satisfied: ${childResult.reasons.join('; ')}`,
                ]
              : [
                  `NOT condition satisfied because inner condition failed: ${childResult.reasons.join('; ')}`,
                ]
            : childResult.satisfied
              ? ['NOT condition failed']
              : [],
      };
    }

    case 'sum': {
      let filteredClasses = classes;
      if (node.predicate) {
        const predicate = node.predicate;
        filteredClasses = classes.filter((cls) =>
          evaluateClassPredicate(predicate, cls),
        );
      }

      const sum = filteredClasses.reduce((total, cls) => {
        return total + ((cls[node.property] as number) || 0);
      }, 0);

      let satisfied = false;
      switch (node.operator) {
        case '<=':
          satisfied = sum <= node.value;
          break;
        case '>=':
          satisfied = sum >= node.value;
          break;
        case '==':
          satisfied = sum === node.value;
          break;
        case '!=':
          satisfied = sum !== node.value;
          break;
        case '<':
          satisfied = sum < node.value;
          break;
        case '>':
          satisfied = sum > node.value;
          break;
      }

      return {
        satisfied,
        reasons:
          mode === 'explain'
            ? [
                satisfied
                  ? `Sum of '${node.property}' is ${sum.toString()}, which satisfies ${node.operator} ${node.value.toString()}`
                  : `Sum of '${node.property}' is ${sum.toString()}, which violates ${node.operator} ${node.value.toString()}`,
                ...(node.predicate
                  ? [
                      `Applied to ${filteredClasses.length.toString()} filtered classes`,
                    ]
                  : []),
              ]
            : satisfied
              ? []
              : [
                  `Sum ${sum.toString()} doesn't satisfy ${node.operator} ${node.value.toString()}`,
                ],
      };
    }

    case 'count': {
      const matchingClasses = classes.filter((cls) =>
        evaluateClassPredicate(node.predicate, cls),
      );
      const count = matchingClasses.length;

      let satisfied = false;
      switch (node.operator) {
        case '<=':
          satisfied = count <= node.value;
          break;
        case '>=':
          satisfied = count >= node.value;
          break;
        case '==':
          satisfied = count === node.value;
          break;
        case '!=':
          satisfied = count !== node.value;
          break;
        case '<':
          satisfied = count < node.value;
          break;
        case '>':
          satisfied = count > node.value;
          break;
      }

      return {
        satisfied,
        reasons:
          mode === 'explain'
            ? [
                satisfied
                  ? `Count of matching classes is ${count.toString()}, which satisfies ${node.operator} ${node.value.toString()}`
                  : `Count of matching classes is ${count.toString()}, which violates ${node.operator} ${node.value.toString()}`,
                ...(matchingClasses.length > 0
                  ? [
                      `Matching classes: ${matchingClasses.map((c) => `${c.courseCode}-${c.classCode}`).join(', ')}`,
                    ]
                  : ['No classes matched the predicate']),
              ]
            : satisfied
              ? []
              : [
                  `Count ${count.toString()} doesn't satisfy ${node.operator} ${node.value.toString()}`,
                ],
      };
    }

    case 'some': {
      const matchingClasses = classes.filter((cls) =>
        evaluateClassPredicate(node.predicate, cls),
      );
      const hasSome = matchingClasses.length > 0;

      return {
        satisfied: hasSome,
        reasons:
          mode === 'explain'
            ? hasSome
              ? [
                  `Condition satisfied by: ${matchingClasses.map((c) => `${c.courseCode}-${c.classCode}`).join(', ')}`,
                ]
              : ['No class in the schedule satisfies the condition']
            : hasSome
              ? []
              : ['No class satisfies the condition'],
      };
    }

    case 'all': {
      const failingClasses = classes.filter(
        (cls) => !evaluateClassPredicate(node.predicate, cls),
      );
      const allSatisfy = failingClasses.length === 0;

      return {
        satisfied: allSatisfy,
        reasons:
          mode === 'explain'
            ? allSatisfy
              ? ['All classes in the schedule satisfy the condition']
              : [
                  'The following classes fail the condition:',
                  ...failingClasses.map(
                    (c) => `  - ${c.courseCode}-${c.classCode}`,
                  ),
                ]
            : allSatisfy
              ? []
              : [
                  `${failingClasses.length.toString()} classes fail the condition`,
                ],
      };
    }

    case 'custom': {
      switch (node.id) {
        case 'no_gaps_by_day':
          return evaluateNoGapsByDay(classes, mode);
        case 'forbid_classes_on_days':
          return evaluateForbidClassesOnDays(classes, mode, node.params);
        default:
          throw new Error(`Unsupported custom node: ${JSON.stringify(node)}`);
      }
    }

    case '==':
    case '!=':
    case '>':
    case '<':
    case '>=':
    case '<=':
    case 'in':
    case 'contains':
      throw new Error(
        `Cannot evaluate standalone comparison operator '${node.op}' at the top level.`,
      );

    default:
      throw new Error(
        `Unsupported constraint operation: ${JSON.stringify(node)}`,
      );
  }

  return {
    satisfied: true,
    reasons: mode === 'explain' ? ['Constraint satisfied'] : [],
  };
}

function evaluateClassPredicate(
  predicate: ExprNode,
  cls: CourseClassForEval,
): boolean {
  switch (predicate.op) {
    case 'and':
      return predicate.children.every((child) =>
        evaluateClassPredicate(child, cls),
      );
    case 'or':
      return predicate.children.some((child) =>
        evaluateClassPredicate(child, cls),
      );
    case 'not':
      return !evaluateClassPredicate(predicate.child, cls);
    case '==':
      return cls[predicate.property] === predicate.value;
    case '!=':
      return cls[predicate.property] !== predicate.value;
    case '>':
      return (cls[predicate.property] as number) > (predicate.value as number);
    case '<':
      return (cls[predicate.property] as number) < (predicate.value as number);
    case '>=':
      return (cls[predicate.property] as number) >= (predicate.value as number);
    case '<=':
      return (cls[predicate.property] as number) <= (predicate.value as number);
    // case 'in': {
    //   const value = predicate.value;

    //   if (value instanceof Set) {
    //     return value.has(cls[predicate.property] as string | number);
    //   } else {
    //     throw new Error(
    //       `Unsupported value type for 'in' predicate: ${typeof value}`,
    //     );
    //   }
    // }
    // case 'contains':
    //   if (cls[predicate.property] instanceof Set) {
    //     return (cls[predicate.property] as Set<string | number>).has(
    //       predicate.value,
    //     );
    //   } else {
    //     throw new Error(
    //       `Unsupported value type for 'contains' predicate: ${typeof cls[predicate.property]}`,
    //     );
    //   }
    default:
      throw new Error(`Unsupported predicate operation: ${predicate.op}`);
  }
}

function evaluateForbidClassesOnDays(
  classes: readonly CourseClassForEval[],
  mode: EvaluationMode = 'boolean',
  params: { days: DayOfWeek[] },
): EvaluationResult {
  const days = params.days;
  const daysSet = new Set(days);

  for (const cls of classes) {
    for (const classTime of cls.schedule) {
      if (daysSet.has(classTime.day)) {
        return {
          satisfied: false,
          reasons: [
            `Class ${cls.courseCode}-${cls.classCode} on day ${classTime.day}`,
          ],
        };
      }
    }
  }

  return {
    satisfied: true,
    reasons: mode === 'explain' ? ['No classes on forbidden days'] : [],
  };
}

function evaluateNoGapsByDay(
  classes: readonly CourseClassForEval[],
  mode: EvaluationMode = 'boolean',
): EvaluationResult {
  const byDay = new Map<
    DayOfWeek,
    { start: number; end: number; classInfo: string }[]
  >();

  // Group schedule items by day
  for (const cls of classes) {
    for (const scheduleItem of cls.schedule) {
      const daySchedule = byDay.get(scheduleItem.day) ?? [];
      daySchedule.push({
        start: scheduleItem.slot.startHour,
        end: scheduleItem.slot.endHour,
        classInfo: `${cls.courseCode}-${cls.classCode}`,
      });
      byDay.set(scheduleItem.day, daySchedule);
    }
  }

  const gapsFound: string[] = [];
  const continuousDays: string[] = [];

  // Check for gaps on each day
  for (const [day, daySchedule] of byDay) {
    if (daySchedule.length < 2) {
      if (mode === 'explain') {
        continuousDays.push(`${day}: Only one class, no gaps possible`);
      }
      continue;
    }

    daySchedule.sort((a, b) => a.start - b.start);

    let hasGap = false;
    for (const [i, current] of daySchedule.entries()) {
      const next = daySchedule[i + 1];
      if (!next) break;

      if (current.end !== next.start) {
        hasGap = true;
        const gap = `Gap on ${day} between ${current.classInfo} (ends ${current.end.toString()}:00) and ${next.classInfo} (starts ${next.start.toString()}:00)`;
        gapsFound.push(gap);

        if (mode === 'boolean') break; // Early exit for boolean mode
      }
    }

    if (!hasGap && mode === 'explain') {
      const classNames = daySchedule.map((s) => s.classInfo).join(' → ');
      continuousDays.push(`${day}: Continuous schedule (${classNames})`);
    }
  }

  const satisfied = gapsFound.length === 0;

  return {
    satisfied,
    reasons:
      mode === 'explain'
        ? satisfied
          ? ['No gaps found in schedule', ...continuousDays]
          : ['Gaps found in schedule:', ...gapsFound.map((gap) => `  - ${gap}`)]
        : satisfied
          ? []
          : [gapsFound[0] || 'Schedule has gaps'],
  };
}

const systemConstraints: ExprNode[] = [
  { op: 'sum', property: 'numCredits', operator: '<=', value: 30 },
  // no need for overlap checks or course uniqueness, they're guaranteed by construction
];

/**
 * DO NOT DELETE THIS, ALWAYS WRITE IT AGAIN.
 * Generates optimized grades based on the given constraints.
 * HAS TO GUARANTEE NO OVERLAPS, UNIQUE COURSECODES, AND LESS THAN 30 CREDITS TOTAL.
 * ALSO MUST SATISFY ALL USER PREFERENCES.
 * ALSO, MUST BE FAST FOR THE TYPICAL USE CASE:
 * - low thousands of courses
 * - each course has ~4 classes
 * - each class has ~4 offerings
 * - class schedules are uniformly distributed across the weekdays, focusing on the 07-19h hour range of the days
 * - user preferences are typically constraints following the sugar functions above.
 *
 * @param allCourses - The courses to generate grades for.
 * @param userPreferences - The user preferences for the grades.
 * @param userDestCodes - The user destination codes for the grades.
 * @param onProgress - The function to call with the progress of the generation.
 * @returns The optimized grades.
 */
export const generateOptimizedGrades = (
  allCourses: Record<string, Course>,
  userPreferences: ExprNode[],
  userDestCodes: string[],
  onProgress?: (progress: number) => void,
): Grade[] => {
  console.log('[OptimizedGenerator] 🚀 Starting course-first generation');

  // Phase 1: Group available classes by course (enforces uniqueness by construction)
  const courseToClasses = new Map<string, CourseClassForEval[]>();

  Object.values(allCourses).forEach((course) => {
    const availableClasses = course.classes
      .map((cls) => enrichClass(cls, allCourses))
      .filter((cls) =>
        cls.offerings.some(
          (offering) =>
            userDestCodes.includes(offering.destCode) &&
            offering.vacancyCount > 0,
        ),
      );

    if (availableClasses.length > 0) {
      courseToClasses.set(course.code, availableClasses);
    }
  });

  console.log(
    `[OptimizedGenerator] 📚 ${courseToClasses.size.toString()} courses have available classes`,
  );

  // Phase 2: Early filtering based on user constraints
  const availableCourses = Array.from(courseToClasses.keys());
  const filteredCourses = filterCoursesByConstraints(
    availableCourses,
    userPreferences,
  );

  console.log(
    `[OptimizedGenerator] 🎯 ${filteredCourses.length.toString()} courses pass initial filtering`,
  );

  // Phase 3: Generate course combinations (much smaller search space)
  const solutions: Grade[] = [];
  let combinationsChecked = 0;

  const maxCourseCombinations = Math.pow(2, filteredCourses.length);

  console.log(
    `[OptimizedGenerator] 🎯 ${maxCourseCombinations.toString()} course combinations to check`,
  );

  // Generate all possible course subsets
  const generateCourseSubsets = (
    courseIndex: number,
    selectedCourses: string[],
  ) => {
    if (courseIndex === filteredCourses.length) {
      if (selectedCourses.length === 0) return;

      // Early credit check
      const minCredits = selectedCourses.reduce((sum, courseCode) => {
        const course = allCourses[courseCode];
        return sum + (course?.numCredits || 0);
      }, 0);

      if (minCredits > 30) return; // Skip if definitely over limit

      // Phase 4: For each course subset, find compatible class combinations
      findCompatibleClassCombinations(selectedCourses, solutions);
      combinationsChecked++;

      if (onProgress && combinationsChecked % 1000 === 0) {
        onProgress(combinationsChecked / maxCourseCombinations);
      }
      return;
    }

    const course = filteredCourses[courseIndex];
    if (!course) return;

    // Don't include this course
    generateCourseSubsets(courseIndex + 1, selectedCourses);

    // Include this course (if it has classes)
    if (courseToClasses.has(course)) {
      selectedCourses.push(course);
      generateCourseSubsets(courseIndex + 1, selectedCourses);
      selectedCourses.pop();
    }
  };

  const findCompatibleClassCombinations = (
    selectedCourses: string[],
    solutions: Grade[],
  ) => {
    // Get all class options for selected courses
    const classOptionsByCourse = selectedCourses.map((courseCode) => {
      return courseToClasses.get(courseCode) || [];
    });

    // Generate all class combinations (one class per course)
    const generateClassCombinations = (
      courseIndex: number,
      currentClasses: CourseClassForEval[],
    ) => {
      if (courseIndex === classOptionsByCourse.length) {
        // Check if this combination is conflict-free and satisfies constraints
        if (isValidClassCombination(currentClasses, userPreferences)) {
          solutions.push({ classes: [...currentClasses] });
        }
        return;
      }

      const classOptions = classOptionsByCourse[courseIndex];
      if (!classOptions) return;

      for (const classOption of classOptions) {
        // Early conflict detection
        if (hasTimeConflict(currentClasses, classOption)) continue;

        currentClasses.push(classOption);
        generateClassCombinations(courseIndex + 1, currentClasses);
        currentClasses.pop();
      }
    };

    generateClassCombinations(0, []);
  };

  generateCourseSubsets(0, []);

  if (onProgress) onProgress(1);

  console.log(
    `[OptimizedGenerator] ✅ Found ${solutions.length.toString()} valid grades`,
  );
  console.log(
    `[OptimizedGenerator] 📊 Checked ${combinationsChecked.toString()} course combinations`,
  );

  return solutions;
};

function filterCoursesByConstraints(
  availableCourses: string[],
  userPreferences: ExprNode[],
): string[] {
  // Quick filtering based on availableCourses and minimumCoursesSet constraints
  for (const constraint of userPreferences) {
    if (constraint.op === 'all' && constraint.predicate.op === 'or') {
      // This is an availableCourses constraint
      const allowedCourses = constraint.predicate.children
        .map((child) => {
          if (child.op === '==' && child.property === 'courseCode') {
            return child.value as string;
          }
          return null;
        })
        .filter((code) => code !== null)
        .filter((code) => availableCourses.includes(code));
      return allowedCourses;
    }
  }

  return availableCourses;
}

function hasTimeConflict(
  existingClasses: CourseClassForEval[],
  newClass: CourseClassForEval,
): boolean {
  for (const existing of existingClasses) {
    for (const existingSchedule of existing.schedule) {
      for (const newSchedule of newClass.schedule) {
        if (
          existingSchedule.day === newSchedule.day &&
          timeSlotsOverlap(existingSchedule.slot, newSchedule.slot)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function isValidClassCombination(
  classes: CourseClassForEval[],
  userPreferences: ExprNode[],
): boolean {
  // Quick credit check first
  const totalCredits = classes.reduce((sum, cls) => sum + cls.numCredits, 0);
  if (totalCredits > 30) return false;

  // Full constraint evaluation
  const allConstraintsNode: ExprNode = {
    op: 'and',
    children: [...systemConstraints, ...userPreferences],
  };

  const result = evaluateConstraint(allConstraintsNode, classes, 'boolean');
  return result.satisfied;
}
