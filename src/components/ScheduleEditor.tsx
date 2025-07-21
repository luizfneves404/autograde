import { useState } from 'react';
import { formatTime } from '@utils/formatters';
import { DAYS } from '@/constants';

// --- TYPE DEFINITIONS ---
// (Assuming these are your types. Place them in your @/types file)

export type DayOfWeek =
  | 'segunda'
  | 'terça'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sábado';

export interface TimeSlot {
  startHour: number;
  endHour: number;
}

export interface ClassTime {
  day: DayOfWeek;
  slot: TimeSlot;
}

export type Schedule = ClassTime[];

// This is the new, more flexible type for the editor's state.
// It allows the hour properties to be undefined during editing.
interface EditableClassTime {
  day?: DayOfWeek;
  slot?: Partial<TimeSlot>; // Partial<TimeSlot> is { startHour?: number, endHour?: number }
}

// --- COMPONENT ---

interface ScheduleEditorProps {
  schedule: Schedule;
  onChange: (schedule: Schedule) => void;
}

export function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  const getInitialState = (): EditableClassTime => ({
    day: undefined,
    slot: {}, // Start with an empty slot object
  });

  const [newClassTime, setNewClassTime] =
    useState<EditableClassTime>(getInitialState());

  const handleInputChange = (
    field: 'day' | 'startHour' | 'endHour',
    value: string,
  ) => {
    setNewClassTime((prev) => {
      if (field === 'day') {
        return { ...prev, day: value as DayOfWeek };
      }

      const parsedValue = parseInt(value, 10);
      return {
        ...prev,
        slot: {
          ...prev.slot,
          [field]: isNaN(parsedValue) ? undefined : parsedValue,
        },
      };
    });
  };

  const addClassTime = () => {
    const { day, slot } = newClassTime;

    if (!day || slot?.startHour === undefined || slot?.endHour === undefined) {
      alert('Por favor, preencha todos os campos do horário.');
      return;
    }
    if (slot.startHour >= slot.endHour) {
      alert('A hora de início deve ser anterior à hora de término.');
      return;
    }

    // After validation, we can safely assert the type to the stricter ClassTime.
    onChange([...schedule, newClassTime as ClassTime]);
    setNewClassTime(getInitialState());
  };

  const removeClassTime = (index: number) => {
    onChange(schedule.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-neutral-50 rounded-lg">
      <h4 className="text-md font-semibold mb-3 text-neutral-700">
        Horário de Aulas
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr,1fr,auto] gap-3 items-end mb-4 p-3 border rounded-md">
        <select
          value={newClassTime.day || ''}
          onChange={(e) => {
            handleInputChange('day', e.target.value);
          }}
          className="input"
        >
          <option value="">Selecione o Dia</option>
          {DAYS.map((day) => (
            <option key={day} value={day}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          max={23}
          placeholder="Início"
          value={newClassTime.slot?.startHour ?? ''}
          onChange={(e) => {
            handleInputChange('startHour', e.target.value);
          }}
          className="input"
        />
        <input
          type="number"
          min={1}
          max={24}
          placeholder="Término"
          value={newClassTime.slot?.endHour ?? ''}
          onChange={(e) => {
            handleInputChange('endHour', e.target.value);
          }}
          className="input"
        />
        <button onClick={addClassTime} className="btn btn-primary h-full">
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
                {formatTime(ct.slot.startHour)}-{formatTime(ct.slot.endHour)}
              </span>
              <button
                onClick={() => {
                  removeClassTime(index);
                }}
                className="px-2 py-1 text-xs font-medium text-error-600 bg-error-100 rounded-md hover:bg-error-200"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
