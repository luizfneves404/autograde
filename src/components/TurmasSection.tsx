import type { Turma } from '@/types'
import { TurmaView } from '@components/TurmaView'
import { TurmaEditor } from '@components/TurmaEditor'
import { AddTurmaForm } from '@components/AddTurmaForm'
import { TurmaActions } from '@components/TurmaActions'

interface TurmasSectionProps {
  disciplinaCode: string
  turmas: Turma[]
  editingTurma: string | null
  onAddTurma: (turma: Omit<Turma, 'disciplinaCode'>) => void
  onUpdateTurma: (turmaKey: string, updated: Turma) => void
  onDeleteTurma: (turmaKey: string) => void
  onSetEditingTurma: (turmaKey: string | null) => void
}

export function TurmasSection({
  disciplinaCode,
  turmas,
  editingTurma,
  onAddTurma,
  onUpdateTurma,
  onDeleteTurma,
  onSetEditingTurma,
}: TurmasSectionProps) {
  return (
    <div className="mt-6 pl-4 border-l-2 border-neutral-200">
      <h4 className="text-lg font-semibold mb-4 text-neutral-800">
        Turmas de {disciplinaCode}
      </h4>

      <AddTurmaForm onAddTurma={onAddTurma} />

      <div className="space-y-4 mt-4">
        {turmas.length === 0 ? (
          <div className="text-center text-neutral-500 p-4 bg-neutral-50 rounded-md">
            Nenhuma turma cadastrada para esta disciplina.
          </div>
        ) : (
          turmas.map(turma => {
            const turmaKey = `${turma.turmaCode}-${turma.disciplinaCode}`
            return (
              <div key={turmaKey} className="p-4 bg-neutral-50 rounded-md shadow-sm">
                {editingTurma === turmaKey ? (
                  <TurmaEditor
                    turma={turma}
                    onSave={updated => onUpdateTurma(turmaKey, updated)}
                    onCancel={() => onSetEditingTurma(null)}
                  />
                ) : (
                  <div className="flex justify-between items-center">
                    <TurmaView turma={turma} />
                    <TurmaActions
                      onEdit={() => onSetEditingTurma(turmaKey)}
                      onDelete={() => onDeleteTurma(turmaKey)}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
} 