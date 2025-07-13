import { useState } from 'react'
import type { Schedule, ClassTime, DayOfWeek } from '@/types'
import { DAYS } from '@/constants'
import { formatTime } from '@utils/formatters'

interface ScheduleEditorProps {
  schedule: Schedule
  onChange: (schedule: Schedule) => void
}

export function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  const [newClassTime, setNewClassTime] = useState<Partial<ClassTime>>({})

  const addClassTime = () => {
    if (
      !newClassTime.day ||
      newClassTime.startHour === undefined ||
      newClassTime.endHour === undefined
    ) {
      alert('Por favor, preencha todos os campos do horário.')
      return
    }
    if (newClassTime.startHour >= newClassTime.endHour) {
      alert('A hora de início deve ser anterior à hora de término.')
      return
    }

    const classTime: ClassTime = {
      day: newClassTime.day,
      startHour: newClassTime.startHour,
      endHour: newClassTime.endHour,
    }

    onChange([...schedule, classTime])
    setNewClassTime({})
  }

  const removeClassTime = (index: number) => {
    onChange(schedule.filter((_, i) => i !== index))
  }

  const inputClass =
    'px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

  return (
    <div className="p-4 bg-neutral-50 rounded-lg">
      <h4 className="text-md font-semibold mb-3 text-neutral-700">
        Horário de Aulas
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr,1fr,auto] gap-3 items-end mb-4 p-3 border rounded-md">
        <select
          value={newClassTime.day || ''}
          onChange={e =>
            setNewClassTime(prev => ({
              ...prev,
              day: e.target.value as DayOfWeek,
            }))
          }
          className={inputClass}
        >
          <option value="">Selecione o Dia</option>
          {DAYS.map(day => (
            <option key={day} value={day}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          max="23"
          placeholder="Início"
          value={newClassTime.startHour ?? ''}
          onChange={e =>
            setNewClassTime(prev => ({
              ...prev,
              startHour: parseInt(e.target.value),
            }))
          }
          className={inputClass}
        />
        <input
          type="number"
          min="1"
          max="24"
          placeholder="Término"
          value={newClassTime.endHour ?? ''}
          onChange={e =>
            setNewClassTime(prev => ({
              ...prev,
              endHour: parseInt(e.target.value),
            }))
          }
          className={inputClass}
        />
        <button
          onClick={addClassTime}
          className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-md hover:bg-neutral-300 h-full"
        >
          Adicionar
        </button>
      </div>

      {schedule.length === 0 ? (
        <div className="text-center py-4 text-neutral-500 italic">
          Nenhum horário de aulas definido ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {schedule.map((ct, index) => (
            <div
              key={index}
              className="flex justify-between items-center px-3 py-2 bg-white border border-neutral-200 rounded-md"
            >
              <span className="font-medium text-neutral-800">
                {ct.day.charAt(0).toUpperCase() + ct.day.slice(1)}{' '}
                {formatTime(ct.startHour)}-{formatTime(ct.endHour)}
              </span>
              <button
                onClick={() => removeClassTime(index)}
                className="px-2 py-1 text-xs font-medium text-error-600 bg-error-100 rounded-md hover:bg-error-200"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 