export type ConstraintStatus = 'SATISFIED' | 'VIOLATED' | 'PENDING';

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
  score: number;
  preferences: string[]; // placeholder for preferences met by this grade
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
      property: string;
      value: string | number;
    }

  // ─── Schedule‐level Quantifier ───────────────────────
  | {
      op: 'some' | 'all'; // ∃ or ∀
      predicate: ExprNode; // evaluated per-class
    }

  // ─── Aggregation ────────────────────────────────────
  | {
      op: 'sum' | 'count'; // sum of a property, or count of classes
      property?: string; // required if op==='sum'
      operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
      value: number;
      predicate?: ExprNode; // optional filter on which classes to include
    }

  // ─── Pairwise Relation ──────────────────────────────
  | {
      op: 'pairwise';
      relation: '!=' | 'overlaps';
      property1: string; // e.g. 'time' or 'professorName'
      property2?: string; // defaults to property1
      predicate?: ExprNode; // optional filter on which classes to compare
    }

  // ─── Custom Node ────────────────────────────────────
  | {
      op: 'custom';
      id: string;
      params?: Record<string, unknown>;
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
