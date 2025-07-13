import type {
  Grade,
  PreferenceSet,
  Turma,
  Disciplina,
  Schedule,
  Preference,
} from '@/types'

// --- HELPER FUNCTIONS: CONSTRAINT CHECKING ---

/**
 * Checks if a new schedule conflicts with an existing one.
 */
const hasTimeConflict = (
  newSchedule: Schedule,
  existingSchedule: Schedule,
): boolean => {
  for (const newClass of newSchedule) {
    for (const existingClass of existingSchedule) {
      if (newClass.day === existingClass.day) {
        if (
          Math.max(newClass.startHour, existingClass.startHour) <
          Math.min(newClass.endHour, existingClass.endHour)
        ) {
          return true
        }
      }
    }
  }
  return false
}

/**
 * Checks a single turma against relevant hard constraints that can be evaluated early.
 */
const checkHardConstraintsForTurma = (
  turma: Turma,
  hardConstraints: Preference[],
): boolean => {
  for (const constraint of hardConstraints) {
    switch (constraint.kind) {
      case 'avoid_turmas':
        if (
          constraint.turmas.some(
            t =>
              t.turmaCode === turma.turmaCode &&
              t.disciplinaCode === turma.disciplinaCode,
          )
        ) {
          return false
        }
        break
      case 'avoid_teacher':
        if (
          constraint.teacherNames.includes(turma.teacherName) &&
          (!constraint.disciplinaCode ||
            constraint.disciplinaCode === turma.disciplinaCode)
        ) {
          return false
        }
        break
      case 'require_free_days':
        if (turma.schedule.some(s => constraint.days.includes(s.day))) {
          return false
        }
        break
      case 'avoid_time_window':
        if (
          turma.schedule.some(
            s =>
              constraint.days.includes(s.day) &&
              Math.max(s.startHour, constraint.startHour) <
                Math.min(s.endHour, constraint.endHour),
          )
        ) {
          return false
        }
        break
    }
  }
  return true
}

/**
 * Checks a complete set of turmas against constraints that apply to the entire grade.
 */
const checkAllHardConstraints = (
  turmas: Turma[],
  hardConstraints: Preference[],
  disciplinesMap: Map<string, Disciplina>,
): boolean => {
  for (const constraint of hardConstraints) {
    switch (constraint.kind) {
      case 'credit_load': {
        const totalCredits = turmas.reduce(
          (sum, turma) =>
            sum + (disciplinesMap.get(turma.disciplinaCode)?.numCreditos ?? 0),
          0,
        )
        if (
          (constraint.min != null && totalCredits < constraint.min) ||
          (constraint.max != null && totalCredits > constraint.max)
        ) {
          return false
        }
        break
      }
      case 'limit_campus_days': {
        const campusDays = new Set(turmas.flatMap(t => t.schedule.map(s => s.day)))
        if (campusDays.size > constraint.maxDays) {
          return false
        }
        break
      }
    }
  }
  return true
}

// --- HELPER FUNCTION: SCORING ---

/**
 * Calculates a score for a generated grade based on soft preferences.
 */
const calculateScore = (
  turmas: Turma[],
  softPreferences: Preference[],
  _disciplinesMap: Map<string, Disciplina>,
): { score: number; metPreferences: string[] } => {
  let score = 100 // Start with a base score
  const metPreferences: string[] = []

  for (const pref of softPreferences) {
    const weight = pref.weight ?? 5 // Default weight if not specified
    let isMet = false

    switch (pref.kind) {
      case 'prefer_turmas':
        if (
          turmas.some(turma =>
            pref.turmas.some(
              pt =>
                pt.turmaCode === turma.turmaCode &&
                pt.disciplinaCode === turma.disciplinaCode,
            ),
          )
        ) {
          isMet = true
          score += weight
        }
        break
      case 'prefer_teacher':
        if (
          turmas.some(
            turma =>
              pref.teacherNames.includes(turma.teacherName) &&
              (!pref.disciplinaCode ||
                pref.disciplinaCode === turma.disciplinaCode),
          )
        ) {
          isMet = true
          score += weight
        }
        break
      // ... (add other soft preference cases here if any)
    }

    if (isMet) {
      metPreferences.push(pref.name)
    }
  }
  return { score, metPreferences }
}

// --- MAIN GRADE GENERATION LOGIC ---

/**
 * Main function to generate optimized class schedules (grades).
 * It uses a backtracking algorithm pruned by hard constraints and scored by soft preferences.
 */
export const generateOptimizedGrades = (
  allTurmas: Turma[],
  allDisciplinas: Disciplina[],
  userPreferences: PreferenceSet | null,
): Grade[] => {
  if (allTurmas.length === 0) {
    return []
  }

  // 1. PREPROCESSING
  const disciplinesMap = new Map<string, Disciplina>(
    allDisciplinas.map(d => [d.code, d]),
  )
  const turmasByDisciplina = new Map<string, Turma[]>()
  for (const turma of allTurmas) {
    if (!turmasByDisciplina.has(turma.disciplinaCode)) {
      turmasByDisciplina.set(turma.disciplinaCode, [])
    }
    turmasByDisciplina.get(turma.disciplinaCode)!.push(turma)
  }

  const hardConstraints: Preference[] =
    userPreferences?.preferences.filter(
      p => p.enabled && p.type === 'hard',
    ) ?? []
  const softPreferences: Preference[] =
    userPreferences?.preferences.filter(
      p => p.enabled && p.type === 'soft',
    ) ?? []

  const requiredDisciplinaCodes = hardConstraints
    .filter(
      (p): p is Preference & { kind: 'require_disciplinas' } =>
        p.kind === 'require_disciplinas',
    )
    .flatMap(p => p.disciplinaCodes)

  let disciplinesToSchedule =
    requiredDisciplinaCodes.length > 0
      ? requiredDisciplinaCodes
      : Array.from(turmasByDisciplina.keys())

  const avoidedDisciplinaCodes = hardConstraints
    .filter(
      (p): p is Preference & { kind: 'avoid_disciplinas' } =>
        p.kind === 'avoid_disciplinas',
    )
    .flatMap(p => p.disciplinaCodes)
  disciplinesToSchedule = disciplinesToSchedule.filter(
    code => !avoidedDisciplinaCodes.includes(code),
  )

  disciplinesToSchedule.sort((a, b) => {
    const countA = turmasByDisciplina.get(a)?.length ?? 0
    const countB = turmasByDisciplina.get(b)?.length ?? 0
    return countA - countB
  })

  const generatedGrades: Grade[] = []
  const MAX_GRADES = 50

  // 2. CORE RECURSIVE SOLVER
  const findCombinations = (
    disciplineIndex: number,
    currentTurmas: Turma[],
    currentSchedule: Schedule,
  ) => {
    if (generatedGrades.length >= MAX_GRADES) {
      return
    }

    if (disciplineIndex === disciplinesToSchedule.length) {
      if (!checkAllHardConstraints(currentTurmas, hardConstraints, disciplinesMap)) {
        return
      }

      const { score, metPreferences } = calculateScore(
        currentTurmas,
        softPreferences,
        disciplinesMap,
      )
      generatedGrades.push({
        turmas: currentTurmas,
        score: score,
        preferences: metPreferences,
      })
      return
    }

    const disciplinaCode = disciplinesToSchedule[disciplineIndex]
    const availableTurmas = turmasByDisciplina.get(disciplinaCode) ?? []

    for (const nextTurma of availableTurmas) {
      if (
        hasTimeConflict(nextTurma.schedule, currentSchedule) ||
        !checkHardConstraintsForTurma(nextTurma, hardConstraints)
      ) {
        continue
      }

      findCombinations(
        disciplineIndex + 1,
        [...currentTurmas, nextTurma],
        [...currentSchedule, ...nextTurma.schedule],
      )
    }
  }

  findCombinations(0, [], [])

  // 3. FINAL SORTING AND RETURN
  generatedGrades.sort((a, b) => b.score - a.score)
  return generatedGrades
} 