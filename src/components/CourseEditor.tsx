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
    if (isNaN(edited.numCredits) || edited.numCredits <= 0) {
      alert('Por favor, insira um número de créditos válido.');
      return;
    }
    onSave(edited);
  };

  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-blue-200">
      <h4 className="text-lg font-semibold mb-4 text-neutral-800">
        Editando: {course.code}
      </h4>
      <div className="grid gap-4">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Código Input with Label */}
          <div>
            <label
              htmlFor="course-code"
              className="block mb-1 text-sm font-medium text-neutral-700"
            >
              Código
            </label>
            <input
              id="course-code"
              value={edited.code}
              onChange={(e) => {
                setEdited((prev) => ({ ...prev, code: e.target.value }));
              }}
              placeholder="Ex: MAB123"
              className="input"
            />
          </div>

          {/* Nome Input with Label */}
          <div>
            <label
              htmlFor="course-name"
              className="block mb-1 text-sm font-medium text-neutral-700"
            >
              Nome da Disciplina
            </label>
            <input
              id="course-name"
              value={edited.name}
              onChange={(e) => {
                setEdited((prev) => ({ ...prev, name: e.target.value }));
              }}
              placeholder="Ex: Cálculo I"
              className="input"
            />
          </div>

          {/* Créditos Input with Label */}
          <div>
            <label
              htmlFor="course-credits"
              className="block mb-1 text-sm font-medium text-neutral-700"
            >
              Créditos
            </label>
            <input
              id="course-credits"
              type="number"
              value={edited.numCredits}
              onChange={(e) => {
                const credits = parseInt(e.target.value, 10) || 0;
                setEdited((prev) => ({ ...prev, numCredits: credits }));
              }}
              className="input"
              min="0"
            />
          </div>
        </div>

        <PrerequisiteInput
          courses={courses}
          selected={edited.unidirCoRequisites}
          onChange={(unidirCoRequisites) => {
            setEdited((prev) => ({ ...prev, unidirCoRequisites }));
          }}
          label="Co-requisitos Unidirecionais"
          placeholder="Códigos de disciplinas que devem ser puxadas antes ou junto com essa"
        />

        <PrerequisiteInput
          courses={courses}
          selected={edited.bidirCoRequisites}
          onChange={(bidirCoRequisites) => {
            setEdited((prev) => ({ ...prev, bidirCoRequisites }));
          }}
          label="Co-requisitos Bidirecionais"
          placeholder="Códigos de disciplinas que devem ser puxadas junto com essa"
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
