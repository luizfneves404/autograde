import { useState } from 'react';
import type { Course } from '@/types';
import { PrerequisiteInput } from '@components/PrerequisiteInput';

interface CourseEditorProps {
  course: Course;
  courses: Record<string, Course>;
  onSave: (course: Course) => void;
  onCancel: () => void;
}

export function CourseEditor({
  course,
  courses,
  onSave,
  onCancel,
}: CourseEditorProps) {
  const [edited, setEdited] = useState<Course>({ ...course });

  const handleSave = () => {
    if (!edited.code.trim() || !edited.name.trim()) {
      alert('Por favor, preencha ambos o código e o nome');
      return;
    }
    onSave(edited);
  };

  const inputClass =
    'px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';
  const buttonClass =
    'px-4 py-2 bg-neutral-200 text-neutral-800 rounded-md hover:bg-neutral-300 transition-colors';

  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-blue-200">
      <h4 className="text-lg font-semibold mb-4 text-neutral-800">
        Editando: {course.code}
      </h4>
      <div className="grid gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={edited.code}
            onChange={(e) =>
              setEdited((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="Código da Disciplina"
            className={inputClass}
          />
          <input
            value={edited.name}
            onChange={(e) =>
              setEdited((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Nome da Disciplina"
            className={inputClass}
          />
        </div>

        <PrerequisiteInput
          courses={courses}
          selected={edited.unidirCoRequisites}
          onChange={(unidirCoRequisites) =>
            setEdited((prev) => ({ ...prev, unidirCoRequisites }))
          }
          label="Co-requisitos Unidirecionais"
          placeholder="Códigos de disciplinas que devem ser puxadas antes ou junto com essa"
        />

        <PrerequisiteInput
          courses={courses}
          selected={edited.bidirCoRequisites}
          onChange={(bidirCoRequisites) =>
            setEdited((prev) => ({ ...prev, bidirCoRequisites }))
          }
          label="Co-requisitos Bidirecionais"
          placeholder="Códigos de disciplinas que devem ser puxadas junto com essa"
        />

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
  );
}
