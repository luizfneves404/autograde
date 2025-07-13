export type DayOfWeek = 'segunda' | 'terça' | 'quarta' | 'quinta' | 'sexta' | 'sábado'

export type ClassTime = {
    day: DayOfWeek
    startHour: number // 24-hour format, e.g., 9 for 9:00
    endHour: number   // 24-hour format, e.g., 11 for 11:00
}

export type Schedule = ClassTime[]

export type Disciplina = {
    code: string // unique
    name: string
    shouldHavePreRequisites: boolean
    bidirCoRequisites: string[]
    unidirCoRequisites: string[]
    numCreditos: number
    possoPuxar: boolean
}

export type Turma = {
    // turmaCode, disciplinaCode and destCode combination is unique
    turmaCode: string
    disciplinaCode: string
    destCode: string
    numVagas: number
    teacherName: string
    distanceHours: number // horas à distância
    SHFHours: number // horas sem horário fixo (SHF)
    schedule: Schedule
}

export type TurmaIdentifier = Pick<Turma, 'turmaCode' | 'disciplinaCode' | 'destCode'>


export type Grade = {
    turmas: Turma[]
    score: number
    preferences: string[] // placeholder for preferences met by this grade
}

export type AppData = {
    disciplinas: Disciplina[]
    turmas: Turma[]
}


export interface BasePreference {
    id: string
    enabled: boolean
    type: 'hard' | 'soft' // Hard: must be met. Soft: contributes to a score.
    weight?: number       // For soft preferences, defines its importance (e.g., 1-10).
}

/**
 * A discriminated union of all possible user preferences.
 * The 'kind' property clearly defines the intent of the rule.
 */
export type Preference = (
    // --- Content Preferences: Rules about which courses and classes to take ---
    {
        kind: 'require_disciplinas'
        name: string
        description: string
        disciplinaCodes: string[] // These courses MUST be included.
    }
    | {
        kind: 'avoid_disciplinas'
        name: string
        description: string
        disciplinaCodes: string[] // These courses MUST NOT be included.
    }
    | {
        kind: 'prefer_turmas'
        name: string
        description: string
        turmas: TurmaIdentifier[] // Prefer these specific classes over others.
    }
    | {
        kind: 'avoid_turmas'
        name: string
        description: string
        turmas: TurmaIdentifier[] // Avoid these specific classes.
    }

    // --- Teacher Preferences ---
    | {
        kind: 'prefer_teacher'
        name: string
        description: string
        teacherNames: string[]
        disciplinaCode?: string // Optional: apply only to a specific course.
    }
    | {
        kind: 'avoid_teacher'
        name: string
        description: string
        teacherNames: string[]
        disciplinaCode?: string // Optional: apply only to a specific course.
    }

    // --- Schedule & Time Preferences: Rules about the schedule's structure ---
    | {
        kind: 'time_window' // Prefer taking all classes within this window.
        name: string
        description: string
        days: DayOfWeek[]
        startHour: number
        endHour: number
    }
    | {
        kind: 'avoid_time_window' // Avoid classes during this window (e.g., for lunch).
        name: string
        description: string
        days: DayOfWeek[]
        startHour: number
        endHour: number
    }
    | {
        kind: 'limit_campus_days'
        name: string
        description: string
        maxDays: number // Set a maximum number of days with classes.
    }
    | {
        kind: 'require_free_days' // These days must have no classes.
        name: string
        description: string
        days: DayOfWeek[]
    }
    | {
        kind: 'prefer_compact_schedule' // Penalize gaps between classes. The 'weight' determines the penalty.
        name: string
        description: string
    }

    // --- Undergrad course Preferences ---
    | {
        kind: 'my_dest_codes'
        name: string
        description: string
        destCodes: string[]
    }

    // --- Workload Preferences ---
    | {
        kind: 'credit_load'
        name: string
        description: string
        min?: number // Define a minimum and/or maximum credit load.
        max?: number
    }
) & BasePreference

export interface GlobalSettings {
  softConstraintAggregation: 'sum' | 'weighted_average' | 'max' | 'min'
  maxViolations: number
}

export interface PreferenceSet {
  id: string
  name: string
  description: string
  preferences: Preference[]
  globalSettings: GlobalSettings
}