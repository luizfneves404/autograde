import { useState } from 'react'
import type { Turma } from '@/types'
import { ScheduleEditor } from '@components/ScheduleEditor'

interface AddTurmaFormProps {
  onAddTurma: (turma: Omit<Turma, 'disciplinaCode'>) => void
}

export function AddTurmaForm({ onAddTurma }: AddTurmaFormProps) {
  const [newTurma, setNewTurma] = useState<Partial<Turma>>({ schedule: [] })

  const addTurma = () => {
    if (!newTurma.turmaCode || !newTurma.teacherName) {
      alert('Por favor, preencha o código da turma e o nome do professor.')
      return
    }

    const turma: Omit<Turma, 'disciplinaCode'> = {
      turmaCode: newTurma.turmaCode.trim(),
      destCode: newTurma.destCode?.trim() || '',
      numVagas: newTurma.numVagas || 0,
      teacherName: newTurma.teacherName.trim(),
      schedule: newTurma.schedule || [],
      distanceHours: newTurma.distanceHours || 0,
      SHFHours: newTurma.SHFHours || 0,
    }

    onAddTurma(turma)
    setNewTurma({ schedule: [] })
  }

  const inputClass =
    'px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

  return (
    <div className="p-4 my-4 border border-dashed border-neutral-300 rounded-lg">
      <h5 className="text-lg font-semibold mb-3 text-neutral-700">
        Adicionar Nova Turma
      </h5>
      <div className="grid gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Código da Turma (e.g., 3WA)"
            value={newTurma.turmaCode || ''}
            onChange={e =>
              setNewTurma(prev => ({ ...prev, turmaCode: e.target.value }))
            }
            className={inputClass}
          />
          <input
            placeholder="Nome do Professor"
            value={newTurma.teacherName || ''}
            onChange={e =>
              setNewTurma(prev => ({ ...prev, teacherName: e.target.value }))
            }
            className={inputClass}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Código de Destino"
            value={newTurma.destCode || ''}
            onChange={e =>
              setNewTurma(prev => ({ ...prev, destCode: e.target.value }))
            }
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            placeholder="Número de Vagas"
            value={newTurma.numVagas || ''}
            onChange={e =>
              setNewTurma(prev => ({
                ...prev,
                numVagas: parseInt(e.target.value) || 0,
              }))
            }
            className={inputClass}
          />
        </div>

        <ScheduleEditor
          schedule={newTurma.schedule || []}
          onChange={schedule => setNewTurma(prev => ({ ...prev, schedule }))}
        />

        <button
          onClick={addTurma}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 w-full"
        >
          Adicionar Turma
        </button>
      </div>
    </div>
  )
} 