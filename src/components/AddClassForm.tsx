import { useState } from 'react';
import type { CourseClass, ClassOffering } from '@/types'; // Import ClassOffering
import { ScheduleEditor } from '@components/ScheduleEditor';

interface AddClassFormProps {
  onAddClass: (newClassData: Omit<CourseClass, 'courseCode'>) => void;
}

export function AddClassForm({ onAddClass }: AddClassFormProps) {
  // The state can hold transient fields for the form inputs
  const [newClass, setNewClass] = useState<
    Partial<CourseClass & ClassOffering>
  >({
    schedule: [],
  });

  const addClass = () => {
    const trimmedClassCode = newClass.classCode?.trim();
    const trimmedProfName = newClass.professorName?.trim();

    if (!trimmedClassCode || !trimmedProfName) {
      alert('Please provide the class code and professor name.');
      return;
    }

    // This is the key change: we now build the nested 'offerings' array.
    // When a class is created this way, it starts with a single offering.
    const newClassData: Omit<CourseClass, 'courseCode'> = {
      classCode: trimmedClassCode,
      professorName: trimmedProfName,
      schedule: newClass.schedule || [],
      distanceHours: newClass.distanceHours || 0,
      SHFHours: newClass.SHFHours || 0,
      offerings: [
        // Create the offerings array with one initial offering
        {
          classCode: trimmedClassCode,
          courseCode: '', // The parent component is responsible for filling this in.
          destCode: newClass.destCode?.trim() || '',
          vacancyCount: newClass.vacancyCount || 0,
        },
      ],
    };

    onAddClass(newClassData);
    // Reset form state
    setNewClass({ schedule: [] });
  };

  return (
    <div className="p-4 my-4 border border-dashed border-neutral-300 rounded-lg">
      <h5 className="text-lg font-semibold mb-3 text-neutral-700">
        Adicionar Nova Turma
      </h5>
      <div className="grid gap-4">
        {/* --- Core Class Info --- */}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Código da Turma (e.g., 3WA)"
            value={newClass.classCode || ''}
            onChange={(e) => {
              setNewClass((prev) => ({ ...prev, classCode: e.target.value }));
            }}
            className="input"
          />
          <input
            placeholder="Nome do Professor"
            value={newClass.professorName || ''}
            onChange={(e) => {
              setNewClass((prev) => ({
                ...prev,
                professorName: e.target.value,
              }));
            }}
            className="input"
          />
        </div>

        <ScheduleEditor
          schedule={newClass.schedule || []}
          onChange={(schedule) => {
            setNewClass((prev) => ({ ...prev, schedule }));
          }}
        />

        {/* --- Initial Offering Info --- */}
        <div>
          <h4 className="text-md font-semibold mb-3 text-neutral-700">
            Oferta da Turma
          </h4>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Código de destino"
              value={newClass.destCode || ''}
              onChange={(e) => {
                setNewClass((prev) => ({ ...prev, destCode: e.target.value }));
              }}
              className="input"
            />
            <input
              type="number"
              min="0"
              placeholder="Quantidade de Vagas"
              value={newClass.vacancyCount || ''}
              onChange={(e) => {
                setNewClass((prev) => ({
                  ...prev,
                  vacancyCount: parseInt(e.target.value, 10) || 0,
                }));
              }}
              className="input"
            />
          </div>
        </div>

        <button onClick={addClass} className="btn btn-primary w-full">
          Adicionar Turma
        </button>
      </div>
    </div>
  );
}
