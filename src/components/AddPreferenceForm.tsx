import type { DayOfWeek, TimeSlot, UIConstraint } from '@/types';
import { useState } from 'react';
import {
  availableCourses,
  minimumCoursesSet,
  forbidCourseCombo,
  forbidEachCourse,
  propertyValueIn,
  maxCreditLoad,
  noGapsByDay,
  minCreditLoad,
  forbidClassesOnDays,
} from '@/utils/gradeOptimizer';
import SearchAndAdd from '@components/SearchAndAdd';
import { DAYS } from '@/constants';

// --- UTILITY FUNCTIONS ---

const generateId = (): string =>
  `c_${Date.now().toString()}_${Math.random().toString(36).substring(2, 9)}`;

// Type-safe parameter values
interface ParamValues {
  [key: string]:
    | string
    | string[]
    | DayOfWeek[]
    | TimeSlot[]
    | { day: DayOfWeek; timeSlot: TimeSlot }[];
}

interface AddPreferenceFormProps {
  onAddConstraint: (constraint: UIConstraint) => void;
  availableCourseCodes: string[];
  availableProfessors: string[];
}

const constraintTemplates = {
  AVAILABLE_COURSES: {
    label: '✅ Disciplinas Disponíveis',
    params: [
      {
        name: 'courses',
        type: 'multi-select-course' as const,
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
        type: 'multi-select-course' as const,
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
        type: 'multi-select-course' as const,
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
        type: 'multi-select-course' as const,
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
        type: 'multi-select-professor' as const,
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
      {
        name: 'max',
        type: 'number' as const,
        label: 'Número máximo de créditos',
      },
    ],
    build: (params: { max: string }) => ({
      name: 'Créditos Máximos',
      description: `A soma dos créditos não deve exceder ${params.max}.`,
      expression: maxCreditLoad(Number(params.max)),
    }),
  },
  MIN_CREDIT_LOAD: {
    label: '🔍 Carga Mínima de Créditos',
    params: [
      {
        name: 'min',
        type: 'number' as const,
        label: 'Número mínimo de créditos',
      },
    ],
    build: (params: { min: string }) => ({
      name: 'Créditos Mínimos',
      description: `A soma dos créditos deve ser pelo menos ${params.min}.`,
      expression: minCreditLoad(Number(params.min)),
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
  FORBID_DAYS: {
    label: '🚫 Dias Proibidos',
    params: [
      {
        name: 'days',
        type: 'multi-select-day-of-week' as const,
        label: 'Dias a serem proibidos',
      },
    ],
    build: (params: { days: DayOfWeek[] }) => ({
      name: 'Dias Proibidos',
      description: `Não permitir aulas em: ${params.days.join(', ')}.`,
      expression: forbidClassesOnDays(params.days),
    }),
  },
  // FORBID_CLASSES_BEFORE: {
  //   label: '🚫 Aulas Antes de um Horário',
  //   params: [
  //     {
  //       name: 'hour',
  //       type: 'number' as const,
  //       label: 'Horário a ser proibido',
  //     },
  //   ],
  //   build: (params: { hour: string }) => ({
  //     name: 'Aulas Antes de um Horário',
  //     description: `Não permitir aulas antes de ${params.hour}:00.`,
  //     expression: forbidClassesBefore(Number(params.hour)),
  //   }),
  // },
  // FORBID_CLASSES_AFTER: {
  //   label: '🚫 Aulas Depois de um Horário',
  //   params: [
  //     {
  //       name: 'hour',
  //       type: 'number' as const,
  //       label: 'Horário a ser proibido',
  //     },
  //   ],
  //   build: (params: { hour: string }) => ({
  //     name: 'Aulas Depois de um Horário',
  //     description: `Não permitir aulas depois de ${params.hour}:00.`,
  //     expression: forbidClassesAfter(Number(params.hour)),
  //   }),
  // },
} as const;

type ConstraintType = keyof typeof constraintTemplates;

// Type-safe parameter value getters
function getStringArrayParam(params: ParamValues, name: string): string[] {
  const value = params[name];
  if (
    Array.isArray(value) &&
    (value.length === 0 || typeof value[0] === 'string')
  ) {
    return value as string[];
  }
  return [];
}

function getDayOfWeekArrayParam(
  params: ParamValues,
  name: string,
): DayOfWeek[] {
  const value = params[name];
  if (
    Array.isArray(value) &&
    (value.length === 0 || typeof value[0] === 'string')
  ) {
    return value as DayOfWeek[];
  }
  return [];
}

function getTimeSlotArrayParam(params: ParamValues, name: string): TimeSlot[] {
  const value = params[name];
  if (Array.isArray(value)) {
    return value as TimeSlot[];
  }
  return [];
}

function getDayTimeComboParam(
  params: ParamValues,
  name: string,
): { day: DayOfWeek; timeSlot: TimeSlot }[] {
  const value = params[name];
  if (Array.isArray(value)) {
    return value as { day: DayOfWeek; timeSlot: TimeSlot }[];
  }
  return [];
}

function getStringParam(params: ParamValues, name: string): string {
  const value = params[name];
  if (typeof value === 'string') {
    return value;
  }
  return '';
}

function AddPreferenceForm({
  onAddConstraint,
  availableCourseCodes,
  availableProfessors,
}: AddPreferenceFormProps) {
  const [constraintType, setConstraintType] = useState<ConstraintType | ''>('');
  const [params, setParams] = useState<ParamValues>({});

  // Initialize param arrays when constraint type changes
  const initializeParamsForConstraint = (type: ConstraintType) => {
    const template = constraintTemplates[type];
    const initialParams: ParamValues = {};

    template.params.forEach((param) => {
      switch (param.type) {
        case 'multi-select-course':
        case 'multi-select-professor':
          initialParams[param.name] = [];
          break;
        case 'multi-select-day-of-week':
          initialParams[param.name] = [] as DayOfWeek[];
          break;
        case 'number':
          initialParams[param.name] = '';
          break;
      }
    });

    return initialParams;
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ConstraintType | '';
    setConstraintType(newType);

    if (newType === '') {
      setParams({});
    } else {
      setParams(initializeParamsForConstraint(newType));
    }
  };

  const handleStandardParamChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setParams((prev: ParamValues) => ({ ...prev, [name]: value }));
  };

  const handleArrayParamChange = (
    paramName: string,
    newSelection: string[],
  ) => {
    setParams((prev: ParamValues) => ({
      ...prev,
      [paramName]: newSelection,
    }));
  };

  const handleDayOfWeekChange = (paramName: string, day: DayOfWeek) => {
    const current = getDayOfWeekArrayParam(params, paramName);
    const newSelection = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setParams((prev: ParamValues) => ({
      ...prev,
      [paramName]: newSelection,
    }));
  };

  const handleTimeSlotChange = (paramName: string, timeSlot: TimeSlot) => {
    const current = getTimeSlotArrayParam(params, paramName);
    const existingIndex = current.findIndex(
      (t) =>
        t.startHour === timeSlot.startHour && t.endHour === timeSlot.endHour,
    );

    const newSelection =
      existingIndex >= 0
        ? current.filter((_, index) => index !== existingIndex)
        : [...current, timeSlot];

    setParams((prev: ParamValues) => ({
      ...prev,
      [paramName]: newSelection,
    }));
  };

  const handleDayTimeComboChange = (
    paramName: string,
    day: DayOfWeek,
    timeSlot: TimeSlot,
  ) => {
    const current = getDayTimeComboParam(params, paramName);
    const existingIndex = current.findIndex(
      (c) =>
        c.day === day &&
        c.timeSlot.startHour === timeSlot.startHour &&
        c.timeSlot.endHour === timeSlot.endHour,
    );

    const newSelection =
      existingIndex >= 0
        ? current.filter((_, index) => index !== existingIndex)
        : [...current, { day, timeSlot }];

    setParams((prev: ParamValues) => ({
      ...prev,
      [paramName]: newSelection,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!constraintType) return;

    const template = constraintTemplates[constraintType];

    // Validate all required parameters are filled
    const isInvalid = template.params.some((p) => {
      const value = params[p.name];
      return !value || (Array.isArray(value) && value.length === 0);
    });

    if (isInvalid) {
      alert('Por favor, preencha todos os campos da restrição.');
      return;
    }

    try {
      const builtConstraint = template.build(params as any);
      onAddConstraint({ ...builtConstraint, id: generateId(), enabled: true });

      setConstraintType('');
      setParams({});
    } catch (error) {
      console.error('Error building constraint:', error);
      alert('Erro ao criar restrição. Verifique os parâmetros.');
    }
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
                      value={getStringParam(params, param.name)}
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
                    allItems={availableCourseCodes}
                    selectedItems={getStringArrayParam(params, param.name)}
                    onSelectionChange={(selection) => {
                      handleArrayParamChange(param.name, selection);
                    }}
                  />
                )}

                {param.type === 'multi-select-professor' && (
                  <SearchAndAdd
                    label={param.label}
                    placeholder="Buscar professor pelo nome..."
                    allItems={availableProfessors}
                    selectedItems={getStringArrayParam(params, param.name)}
                    onSelectionChange={(selection) => {
                      handleArrayParamChange(param.name, selection);
                    }}
                  />
                )}

                {param.type === 'multi-select-day-of-week' && (
                  <>
                    <label className="label text-sm font-medium">
                      {param.label}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS.map((day) => {
                        const currentDays = getDayOfWeekArrayParam(
                          params,
                          param.name,
                        );
                        return (
                          <label
                            key={day}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={currentDays.includes(day)}
                              onChange={() => {
                                handleDayOfWeekChange(param.name, day);
                              }}
                              className="checkbox"
                            />
                            <span className="text-sm">{day}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
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
