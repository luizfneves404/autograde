export type DayOfWeek =
  | 'segunda'
  | 'terça'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sábado';

export type TimeSlot = {
  startHour: number; // 24-hour format
  endHour: number; // 24-hour format
};

export type ClassTime = {
  day: DayOfWeek;
  slot: TimeSlot;
};

export type Schedule = ClassTime[];

export type Course = {
  code: string; // unique
  name: string;
  shouldHavePreRequisites: boolean;
  bidirCoRequisites: string[];
  unidirCoRequisites: string[];
  numCredits: number;
  classes: CourseClass[];
};

export type CourseClass = {
  classCode: string;
  courseCode: string;
  professorName: string;
  distanceHours: number; // horas à distância
  SHFHours: number; // horas sem horário fixo (SHF)
  schedule: Schedule;
  offerings: ClassOffering[];
};

export type CourseClassForEval = CourseClass & {
  numCredits: number;
  shouldHavePreRequisites: boolean;
  bidirCoRequisites: string[];
  unidirCoRequisites: string[];
};

export type ClassOffering = {
  classCode: string;
  courseCode: string;
  destCode: string;
  vacancyCount: number;
};

export type ClassIdentifier = Pick<CourseClass, 'classCode' | 'courseCode'>;

export type ClassOfferingIdentifier = Pick<
  ClassOffering,
  'classCode' | 'courseCode' | 'destCode'
>;

export type Grade = {
  classes: CourseClass[];
};

export type AppData = {
  courses: Record<string, Course>;
  preferenceSet: PreferenceSet;
};

// Core constraint language - minimal and complete
export type ExprNode =
  // ─── Boolean Logic ───────────────────────────────────
  | { op: 'and' | 'or'; children: ExprNode[] }
  | { op: 'not'; child: ExprNode }

  // ─── Class‐level Predicate ───────────────────────────
  | {
      op: '==' | '!=' | '>' | '<' | '>=' | '<=';
      property: keyof CourseClassForEval;
      value: string | number;
    }
  | {
      op: 'in';
      property: keyof CourseClassForEval;
      value: string[] | number[];
    }
  | {
      op: 'contains';
      property: keyof CourseClassForEval;
      value: string | number;
    }

  // ─── Schedule‐level Quantifier ───────────────────────
  | {
      op: 'some' | 'all'; // ∃ or ∀
      predicate: ExprNode; // evaluated per-class
    }

  // ─── Aggregation ────────────────────────────────────
  | {
      op: 'sum'; // sum of a property, or count of classes
      property: keyof CourseClassForEval;
      operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
      value: number;
      predicate?: ExprNode; // optional filter on which classes to include
    }
  | {
      op: 'count';
      predicate: ExprNode; // evaluated per-class
      operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
      value: number;
    }

  // ─── Custom Node ────────────────────────────────────
  | {
      op: 'custom';
      id: 'no_gaps_by_day';
    }
  | {
      op: 'custom';
      id: 'forbid_classes_on_days';
      params: { days: DayOfWeek[] };
    };

export type UIConstraint = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  expression: ExprNode;
};

export type PreferenceSet = {
  hardConstraints: UIConstraint[];
  userDestCodes: string[];
};
