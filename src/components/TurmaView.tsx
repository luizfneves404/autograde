import type { Turma } from '@/types'
import { formatSchedule } from '@utils/formatters'

interface TurmaViewProps {
  turma: Turma
}

export function TurmaView({ turma }: TurmaViewProps) {
  return (
    <div>
      <div className="mb-2">
        <strong className="font-semibold text-neutral-800">
          {turma.turmaCode}
        </strong>
      </div>

      <div className="text-sm text-neutral-600">
        <p>
          <strong>Professor:</strong> {turma.teacherName}
        </p>
        <p>
          <strong>Vagas:</strong> {turma.numVagas}
        </p>
        {turma.destCode && (
          <p>
            <strong>Destino:</strong> {turma.destCode}
          </p>
        )}
        <p>
          <strong>Horário:</strong> {formatSchedule(turma.schedule)}
        </p>
      </div>
    </div>
  )
} 