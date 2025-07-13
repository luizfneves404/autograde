import { useState } from 'react'
import type { Disciplina } from '@/types'
import { PrerequisiteInput } from '@components/PrerequisiteInput'

interface DisciplinaEditorProps {
  disciplina: Disciplina
  disciplinas: Disciplina[]
  onSave: (disciplina: Disciplina) => void
  onCancel: () => void
}

export function DisciplinaEditor({
  disciplina,
  disciplinas,
  onSave,
  onCancel,
}: DisciplinaEditorProps) {
  const [edited, setEdited] = useState<Disciplina>({ ...disciplina })

  const handleSave = () => {
    if (!edited.code.trim() || !edited.name.trim()) {
      alert('Por favor, preencha ambos o código e o nome')
      return
    }
    onSave(edited)
  }

  const inputClass =
    'px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'
  const buttonClass =
    'px-4 py-2 bg-neutral-200 text-neutral-800 rounded-md hover:bg-neutral-300 transition-colors'

  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-blue-200">
      <h4 className="text-lg font-semibold mb-4 text-neutral-800">
        Editando: {disciplina.code}
      </h4>
      <div className="grid gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={edited.code}
            onChange={e => setEdited(prev => ({ ...prev, code: e.target.value }))}
            placeholder="Código da Disciplina"
            className={inputClass}
          />
          <input
            value={edited.name}
            onChange={e => setEdited(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Nome da Disciplina"
            className={inputClass}
          />
        </div>

        <PrerequisiteInput
          disciplinas={disciplinas.filter(d => d.code !== disciplina.code)}
          selected={edited.unidirCoRequisites}
          onChange={unidirCoRequisites =>
            setEdited(prev => ({ ...prev, unidirCoRequisites }))
          }
          label="Co-requisitos Unidirecionais"
          placeholder="Códigos de disciplinas que devem ser puxadas antes ou junto com essa"
        />

        <PrerequisiteInput
          disciplinas={disciplinas.filter(d => d.code !== disciplina.code)}
          selected={edited.bidirCoRequisites}
          onChange={bidirCoRequisites =>
            setEdited(prev => ({ ...prev, bidirCoRequisites }))
          }
          label="Co-requisitos Bidirecionais"
          placeholder="Códigos de disciplinas que devem ser puxadas junto com essa"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`possoPuxar-${disciplina.code}`}
            checked={edited.possoPuxar}
            onChange={e =>
              setEdited(prev => ({ ...prev, possoPuxar: e.target.checked }))
            }
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-blue-500"
          />
          <label
            htmlFor={`possoPuxar-${disciplina.code}`}
            className="text-neutral-700"
          >
            Posso puxar esta disciplina no próximo semestre
          </label>
        </div>

        <div className="flex justify-end gap-4 mt-4">
          <button onClick={onCancel} className={buttonClass}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  )
} 