import type { UIConstraint } from '@/types';
import { useState } from 'react';
import {
  availableCourses,
  minimumCoursesSet,
  forbidCourseCombo,
  forbidEachCourse,
  propertyValueIn,
  maxCreditLoad,
  noGapsByDay,
} from '@/utils/gradeOptimizer';
import SearchAndAdd from '@components/SearchAndAdd';

// --- UTILITY FUNCTIONS ---

const generateId = (): string =>
  `c_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

interface AddPreferenceFormProps {
  onAddConstraint: (constraint: UIConstraint) => void;
  availableCourses: string[];
  availableProfessors: string[];
}

const constraintTemplates = {
  AVAILABLE_COURSES: {
    label: '✅ Disciplinas Disponíveis',
    params: [
      {
        name: 'courses',
        type: 'multi-select-course',
        label: 'Disciplinas disponíveis',
      },
    ],
    build: (params: { courses: string[] }) => ({
      name: 'Disciplinas Disponíveis',
      description: `Deve incluir as disciplinas: ${params.courses.join(', ')}.`,
      expression: availableCourses(params.courses),
    }),
  },
  MINIMUM_COURSES: {
    label: '✅ Cursar Disciplinas Específicas',
    params: [
      {
        name: 'courses',
        type: 'multi-select-course',
        label: 'Disciplinas obrigatórias',
      },
    ],
    build: (params: { courses: string[] }) => ({
      name: 'Disciplinas Obrigatórias',
      description: `Deve incluir as disciplinas: ${params.courses.join(', ')}.`,
      expression: minimumCoursesSet(params.courses),
    }),
  },
  FORBID_COURSE_COMBO: {
    label: '🚫 Não Cursar Combinação de Disciplinas',
    params: [
      {
        name: 'courses',
        type: 'multi-select-course',
        label: 'Combinação a ser proibida',
      },
    ],
    build: (params: { courses: string[] }) => ({
      name: 'Combinação Proibida',
      description: `Não cursar simultaneamente: ${params.courses.join(', ')}.`,
      expression: forbidCourseCombo(params.courses),
    }),
  },
  FORBID_EACH_COURSE: {
    label: '❌ Não Cursar Nenhuma Dessas Disciplinas',
    params: [
      {
        name: 'courses',
        type: 'multi-select-course',
        label: 'Disciplinas a serem proibidas individualmente',
      },
    ],
    build: (params: { courses: string[] }) => ({
      name: 'Disciplinas Proibidas',
      description: `Não cursar nenhuma destas: ${params.courses.join(', ')}.`,
      expression: forbidEachCourse(params.courses),
    }),
  },
  ONLY_PROFESSORS: {
    label: '🧑‍🏫 Apenas Professores Específicos',
    params: [
      {
        name: 'professors',
        type: 'multi-select-professor',
        label: 'Professores desejados',
      },
    ],
    build: (params: { professors: string[] }) => ({
      name: 'Professores Preferenciais',
      description: `Todas as turmas devem ser com: ${params.professors.join(', ')}.`,
      expression: propertyValueIn('professorName', params.professors),
    }),
  },
  MAX_CREDIT_LOAD: {
    label: '📈 Carga Máxima de Créditos',
    params: [
      { name: 'max', type: 'number', label: 'Número máximo de créditos' },
    ],
    build: (params: { max: string }) => ({
      name: 'Créditos Máximos',
      description: `A soma dos créditos não deve exceder ${params.max}.`,
      expression: maxCreditLoad(Number(params.max)),
    }),
  },
  NO_GAPS_BY_DAY: {
    label: '🏃 Sem Janelas na Grade',
    params: [],
    build: () => ({
      name: 'Sem Janelas',
      description: 'Não permite horários vagos entre aulas no mesmo dia.',
      expression: noGapsByDay(),
    }),
  },
};

function AddPreferenceForm({
  onAddConstraint,
  availableCourses,
  availableProfessors,
}: AddPreferenceFormProps) {
  const [constraintType, setConstraintType] = useState<
    keyof typeof constraintTemplates | ''
  >('');
  const [params, setParams] = useState<any>({});

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConstraintType(e.target.value as keyof typeof constraintTemplates | '');
    setParams({}); // Reset params when type changes
  };

  const handleStandardParamChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setParams((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleArrayParamChange = (
    paramName: string,
    newSelection: string[],
  ) => {
    setParams((prev: any) => ({ ...prev, [paramName]: newSelection }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!constraintType) return;

    const template = constraintTemplates[constraintType];

    const isInvalid = template.params.some((p) => {
      const value = params[p.name];
      return !value || (Array.isArray(value) && value.length === 0);
    });

    if (isInvalid) {
      alert('Por favor, preencha todos os campos da restrição.');
      return;
    }

    const builtConstraint = template.build(params);

    onAddConstraint({ ...builtConstraint, id: generateId(), enabled: true });

    setConstraintType('');
    setParams({});
  };

  const currentTemplate = constraintType
    ? constraintTemplates[constraintType]
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <select
        value={constraintType}
        onChange={handleTypeChange}
        className="select w-full"
        required
      >
        <option value="" disabled>
          Selecione um tipo de restrição...
        </option>
        {Object.entries(constraintTemplates).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {currentTemplate && (
        <div className="space-y-3 p-4 border rounded-md bg-white transition-all duration-300">
          {currentTemplate.params.length === 0 ? (
            <p className="text-sm text-gray-600">
              Esta restrição não precisa de parâmetros adicionais.
            </p>
          ) : (
            currentTemplate.params.map((param) => (
              <div key={param.name}>
                {param.type === 'number' && (
                  <>
                    <label className="label text-sm font-medium">
                      {param.label}
                    </label>
                    <input
                      type="number"
                      name={param.name}
                      value={params[param.name] || ''}
                      onChange={handleStandardParamChange}
                      className="input w-full"
                      required
                      min="1"
                    />
                  </>
                )}
                {param.type === 'multi-select-course' && (
                  <SearchAndAdd
                    label={param.label}
                    placeholder="Buscar disciplina pelo código ou nome..."
                    allItems={availableCourses}
                    selectedItems={params[param.name] || []}
                    onSelectionChange={(selection) =>
                      handleArrayParamChange(param.name, selection)
                    }
                  />
                )}
                {param.type === 'multi-select-professor' && (
                  <SearchAndAdd
                    label={param.label}
                    placeholder="Buscar professor pelo nome..."
                    allItems={availableProfessors}
                    selectedItems={params[param.name] || []}
                    onSelectionChange={(selection) =>
                      handleArrayParamChange(param.name, selection)
                    }
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!constraintType}
        className="btn btn-primary w-full"
      >
        Adicionar Restrição
      </button>
    </form>
  );
}

export default AddPreferenceForm;
