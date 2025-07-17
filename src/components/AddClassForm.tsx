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

  const inputClass =
    'px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';

  return (
    <div className="p-4 my-4 border border-dashed border-neutral-300 rounded-lg">
      <h5 className="text-lg font-semibold mb-3 text-neutral-700">
        Add New Class
      </h5>
      <div className="grid gap-4">
        {/* --- Core Class Info --- */}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Class Code (e.g., 3WA)"
            value={newClass.classCode || ''}
            onChange={(e) =>
              setNewClass((prev) => ({ ...prev, classCode: e.target.value }))
            }
            className={inputClass}
          />
          <input
            placeholder="Professor Name"
            value={newClass.professorName || ''}
            onChange={(e) =>
              setNewClass((prev) => ({
                ...prev,
                professorName: e.target.value,
              }))
            }
            className={inputClass}
          />
        </div>

        {/* --- Initial Offering Info --- */}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Destination Code (optional)"
            value={newClass.destCode || ''}
            onChange={(e) =>
              setNewClass((prev) => ({ ...prev, destCode: e.target.value }))
            }
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            placeholder="Vacancy Count"
            value={newClass.vacancyCount || ''}
            onChange={(e) =>
              setNewClass((prev) => ({
                ...prev,
                vacancyCount: parseInt(e.target.value, 10) || 0,
              }))
            }
            className={inputClass}
          />
        </div>

        {/* --- Schedule and Action --- */}
        <ScheduleEditor
          schedule={newClass.schedule || []}
          onChange={(schedule) =>
            setNewClass((prev) => ({ ...prev, schedule }))
          }
        />
        <button
          onClick={addClass}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 w-full"
        >
          Add Class
        </button>
      </div>
    </div>
  );
}
