import type { CourseClass } from '@/types';
import { ClassView } from '@/components/ClassView';
import { ClassEditor } from '@/components/ClassEditor';
import { AddClassForm } from '@/components/AddClassForm';
import { ClassActions } from '@/components/ClassActions';

// The 'createClassKey' function is no longer imported from a file.

interface ClassSectionProps {
  courseCode: string;
  classes: CourseClass[];
  editingClass: string | null;
  onAddClass: (courseClass: Omit<CourseClass, 'courseCode'>) => void;
  onUpdateClass: (classKey: string, updated: CourseClass) => void;
  onDeleteClass: (classKey: string) => void;
  onSetEditingClass: (classKey: string | null) => void;
  /** Function to generate a unique key for a class, passed down from the parent. */
  createClassKey: (courseClass: {
    courseCode: string;
    classCode: string;
  }) => string;
}

export function ClassSection({
  courseCode,
  classes,
  editingClass,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onSetEditingClass,
  createClassKey, // Receive the function as a prop
}: ClassSectionProps) {
  return (
    <div className="mt-6 pl-4 border-l-2 border-neutral-200">
      <h4 className="text-lg font-semibold mb-4 text-neutral-800">
        Classes for {courseCode}
      </h4>

      {/* The form for adding new classes remains unchanged */}
      <AddClassForm onAddClass={onAddClass} />

      <div className="space-y-4 mt-4">
        {classes.length === 0 ? (
          <div className="text-center text-neutral-500 p-4 bg-neutral-50 rounded-md">
            No classes found for this course.
          </div>
        ) : (
          classes.map((courseClass) => {
            // Use the 'createClassKey' function passed via props
            const classKey = createClassKey(courseClass);
            return (
              <div
                key={classKey}
                className="p-4 bg-neutral-50 rounded-md shadow-sm"
              >
                {editingClass === classKey ? (
                  <ClassEditor
                    courseClass={courseClass}
                    onSave={(updated) => onUpdateClass(classKey, updated)}
                    onCancel={() => onSetEditingClass(null)}
                  />
                ) : (
                  <div className="flex justify-between items-center">
                    <ClassView courseClass={courseClass} />
                    <ClassActions
                      onEdit={() => onSetEditingClass(classKey)}
                      onDelete={() => onDeleteClass(classKey)}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
