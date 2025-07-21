import { useState } from 'react';
import type { CourseClass } from '@/types';
import { ScheduleEditor } from '@components/ScheduleEditor';

interface ClassEditorProps {
  courseClass: CourseClass;
  onSave: (courseClass: CourseClass) => void;
  onCancel: () => void;
}

export function ClassEditor({
  courseClass,
  onSave,
  onCancel,
}: ClassEditorProps) {
  const [edited, setEdited] = useState<CourseClass>({ ...courseClass });

  const handleSave = () => {
    if (!edited.classCode.trim() || !edited.professorName.trim()) {
      alert('Please provide the class code and professor name.');
      return;
    }
    onSave(edited);
  };

  /**
   * Helper function to update the first offering in the class immutably.
   */
  const handleOfferingChange = (
    field: 'destCode' | 'vacancyCount',
    value: string | number,
  ) => {
    // Create a new array for immutability
    const newOfferings = [...edited.offerings];

    // Ensure the first offering exists before trying to update it
    if (newOfferings[0]) {
      newOfferings[0] = { ...newOfferings[0], [field]: value };
      setEdited((prev) => ({ ...prev, offerings: newOfferings }));
    }
  };

  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-blue-200">
      <h5 className="text-lg font-semibold mb-4 text-neutral-800">
        Editing Class: {courseClass.classCode} ({courseClass.courseCode})
      </h5>
      <div className="grid gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={edited.classCode}
            onChange={(e) => {
              setEdited((prev) => ({ ...prev, classCode: e.target.value }));
            }}
            placeholder="Class Code"
            className="input"
          />
          <input
            value={edited.professorName}
            onChange={(e) => {
              setEdited((prev) => ({ ...prev, professorName: e.target.value }));
            }}
            placeholder="Professor Name"
            className="input"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={edited.offerings[0]?.destCode || ''}
            onChange={(e) => {
              handleOfferingChange('destCode', e.target.value);
            }}
            placeholder="Código de destino"
            className="input"
          />
          <input
            type="number"
            min="0"
            value={edited.offerings[0]?.vacancyCount || ''}
            onChange={(e) => {
              handleOfferingChange(
                'vacancyCount',
                parseInt(e.target.value, 10) || 0,
              );
            }}
            placeholder="Vagas"
            className="input"
          />
        </div>

        <ScheduleEditor
          schedule={edited.schedule}
          onChange={(schedule) => {
            setEdited((prev) => ({ ...prev, schedule }));
          }}
        />

        <div className="flex justify-end gap-4 mt-4">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
