import { useState } from 'react'
import type { Turma } from '@/types'
import { ScheduleEditor } from '@components/ScheduleEditor'

interface TurmaEditorProps {
  turma: Turma
  onSave: (turma: Turma) => void
  onCancel: () => void
}

export function TurmaEditor({ turma, onSave, onCancel }: TurmaEditorProps) {
  const [edited, setEdited] = useState<Turma>({ ...turma })

  const handleSave = () => {
    if (!edited.turmaCode.trim() || !edited.teacherName.trim()) {
      alert('Por favor, preencha o código da turma e o nome do professor.')
      return
    }
    onSave(edited)
  }

  const inputClass =
    'px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-blue-200">
      <h5 className="text-lg font-semibold mb-4 text-neutral-800">
        Editando Turma: {turma.turmaCode} ({turma.disciplinaCode})
      </h5>
      <div className="grid gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={edited.turmaCode}
            onChange={e =>
              setEdited(prev => ({ ...prev, turmaCode: e.target.value }))
            }
            placeholder="Código da Turma"
            className={inputClass}
          />
          <input
            value={edited.teacherName}
            onChange={e =>
              setEdited(prev => ({ ...prev, teacherName: e.target.value }))
            }
            placeholder="Nome do Professor"
            className={inputClass}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={edited.destCode}
            onChange={e =>
              setEdited(prev => ({ ...prev, destCode: e.target.value }))
            }
            placeholder="Código do Destino"
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            value={edited.numVagas}
            onChange={e =>
              setEdited(prev => ({
                ...prev,
                numVagas: parseInt(e.target.value) || 0,
              }))
            }
            placeholder="Número de Vagas"
            className={inputClass}
          />
        </div>

        <ScheduleEditor
          schedule={edited.schedule}
          onChange={schedule => setEdited(prev => ({ ...prev, schedule }))}
        />

        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-md hover:bg-neutral-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  )
} 