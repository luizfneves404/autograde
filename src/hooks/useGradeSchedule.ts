import { useMemo } from 'react'
import type { Grade, Turma, Disciplina } from '@/types'

interface UseGradeScheduleParams {
  grade: Grade
  allDisciplinas: Disciplina[]
}

export function useGradeSchedule({
  grade,
  allDisciplinas,
}: UseGradeScheduleParams) {
  return useMemo(() => {
    const scheduleMap = new Map<string, Turma>()
    const disciplinaMap = new Map(allDisciplinas.map(d => [d.code, d]))

    let minHour = 23
    let maxHour = 7

    grade.turmas.forEach(turma => {
      turma.schedule.forEach(classTime => {
        for (let hour = classTime.startHour; hour < classTime.endHour; hour++) {
          const key = `${classTime.day}-${hour}`
          scheduleMap.set(key, turma)

          if (hour < minHour) minHour = hour
          if (hour >= maxHour) maxHour = hour + 1
        }
      })
    })

    const hourSlots = Array.from(
      { length: Math.max(0, maxHour - minHour) },
      (_, i) => minHour + i,
    )

    const totalCreditos = grade.turmas.reduce((sum, turma) => {
      const disciplina = disciplinaMap.get(turma.disciplinaCode)
      return sum + (disciplina?.numCreditos || 0)
    }, 0)

    return { scheduleMap, hourSlots, totalCreditos }
  }, [grade, allDisciplinas])
} 