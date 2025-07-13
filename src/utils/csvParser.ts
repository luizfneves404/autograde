import type { AppData, Disciplina, Turma, Schedule, DayOfWeek } from '@/types'

export const parseCSVData = (csvContent: string): AppData => {
  const lines = csvContent.split('\n')
  const disciplinas: Disciplina[] = []
  const turmas: Turma[] = []

  // Skip header lines and find the data start
  let dataStartIndex = -1
  for (let i = 0; i < lines.length; i++) {
    console.log(lines[i])
    if (lines[i].includes('Disciplina,Nome da disciplina,Professor')) {
      dataStartIndex = i + 1
      break
    }
  }

  if (dataStartIndex === -1) {
    throw new Error('Cabeçalho CSV não encontrado. Certifique-se de que este é um arquivo CSV de horário de aulas.')
  }

  // Parse each data line
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.length < 10) continue // Skip empty or very short lines

    try {
      const parts = line.split(',')
      if (parts.length < 13) continue // Skip incomplete lines

      const [
        disciplinaCode,
        disciplinaName,
        professorName,
        numCreditos,
        turmaCode,
        destino,
        vagas,
        _,
        horarioSala,
        distanceHours,
        SHFHours,
        __,
        preReq,
        ___
      ] = parts.map(p => p.trim())

      // Create or update disciplina
      const cleanDisciplinaCode = disciplinaCode.replace(/[^A-Z0-9]/g, '')
      const cleanDisciplinaName = disciplinaName.trim()

      if (cleanDisciplinaCode && cleanDisciplinaName) {
        const existingDisciplina = disciplinas.find(d => d.code === cleanDisciplinaCode)
        if (!existingDisciplina) {
          disciplinas.push({
            code: cleanDisciplinaCode,
            name: cleanDisciplinaName,
            shouldHavePreRequisites: preReq?.toLowerCase().includes('sim') || false,
            unidirCoRequisites: [],
            bidirCoRequisites: [],
            possoPuxar: false,
            numCreditos: parseInt(numCreditos) || 0
          })
        }
      }

      // Create turma
      const cleanTurmaCode = turmaCode.trim()
      const cleanProfessorName = professorName.trim()
      const numVagas = parseInt(vagas) || 0
      const cleanDestino = destino.trim()

      if (cleanTurmaCode && cleanProfessorName && cleanDisciplinaCode) {
        const schedule = parseScheduleFromCSV(horarioSala)

        turmas.push({
          turmaCode: cleanTurmaCode,
          disciplinaCode: cleanDisciplinaCode,
          destCode: cleanDestino,
          numVagas: numVagas,
          teacherName: cleanProfessorName,
          schedule: schedule,
          distanceHours: parseInt(distanceHours) || 0,
          SHFHours: parseInt(SHFHours) || 0
        })
      }
    } catch (error) {
      console.warn(`Skipping line ${i + 1}: ${error}`)
      continue
    }
  }

  return { disciplinas, turmas }
}

export const parseScheduleFromCSV = (horarioSala: string): Schedule => {
  const schedule: Schedule = []
  if (!horarioSala || horarioSala.trim() === '') return schedule

  // Map Portuguese day names to our format
  const dayMap: Record<string, DayOfWeek> = {
    'SEG': 'segunda',
    'TER': 'terça',
    'QUA': 'quarta',
    'QUI': 'quinta',
    'SEX': 'sexta',
    'SAB': 'sábado',
  }

  // Split by multiple spaces to separate different time blocks
  const timeBlocks = horarioSala.split(/\s{2,}/).filter(block => block.trim())

  for (const block of timeBlocks) {
    try {
      // Expected format: "TER 13-15" or "QUI 13-15"
      const match = block.trim().match(/^([A-Z]{3})\s+(\d{1,2})-(\d{1,2})/)
      if (match) {
        const [, dayStr, startStr, endStr] = match
        const day = dayMap[dayStr]
        const startHour = parseInt(startStr)
        const endHour = parseInt(endStr)

        if (day && startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23 && startHour < endHour) {
          schedule.push({
            day,
            startHour,
            endHour
          })
        }
      }
    } catch (error) {
      console.warn(`Error parsing schedule block "${block}":`, error)
    }
  }

  return schedule
} 