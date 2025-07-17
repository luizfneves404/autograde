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

  const inputClass =
    'px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';

  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-blue-200">
      <h5 className="text-lg font-semibold mb-4 text-neutral-800">
        Editing Class: {courseClass.classCode} ({courseClass.courseCode})
      </h5>
      <div className="grid gap-4">
        {/* These fields are correct as they exist directly on CourseClass */}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={edited.classCode}
            onChange={(e) =>
              setEdited((prev) => ({ ...prev, classCode: e.target.value }))
            }
            placeholder="Class Code"
            className={inputClass}
          />
          <input
            value={edited.professorName}
            onChange={(e) =>
              setEdited((prev) => ({ ...prev, professorName: e.target.value }))
            }
            placeholder="Professor Name"
            className={inputClass}
          />
        </div>

        {/* These fields now point to the first offering */}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={edited.offerings[0]?.destCode || ''}
            onChange={(e) => handleOfferingChange('destCode', e.target.value)}
            placeholder="Código de destino"
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            value={edited.offerings[0]?.vacancyCount || ''}
            onChange={(e) =>
              handleOfferingChange(
                'vacancyCount',
                parseInt(e.target.value, 10) || 0,
              )
            }
            placeholder="Vagas"
            className={inputClass}
          />
        </div>

        {/* The ScheduleEditor remains the same */}
        <ScheduleEditor
          schedule={edited.schedule}
          onChange={(schedule) => setEdited((prev) => ({ ...prev, schedule }))}
        />

        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-md hover:bg-neutral-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
