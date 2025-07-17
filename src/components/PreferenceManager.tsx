import { useMemo } from 'react';
import type { PreferenceSet, UIConstraint } from '@/types';
import AddPreferenceForm from '@components/AddPreferenceForm';
import PreferenceCard from './PreferenceCard';

interface PreferenceManagerProps {
  preferenceSet: PreferenceSet;
  onPreferenceSetChange: (preferenceSet: PreferenceSet) => void;
  availableDestCodes: string[];
  availableProfessors: string[];
  availableCourses: string[];
}

export function PreferenceManager({
  preferenceSet,
  onPreferenceSetChange,
  availableDestCodes,
  availableProfessors,
  availableCourses,
}: PreferenceManagerProps) {
  // --- Handlers for Hard Constraints ---
  const addConstraint = (constraint: UIConstraint) => {
    onPreferenceSetChange({
      ...preferenceSet,
      hardConstraints: [...preferenceSet.hardConstraints, constraint],
    });
  };

  const removeConstraint = (id: string) => {
    onPreferenceSetChange({
      ...preferenceSet,
      hardConstraints: preferenceSet.hardConstraints.filter((c) => c.id !== id),
    });
  };

  const updateConstraint = (id: string, updates: Partial<UIConstraint>) => {
    onPreferenceSetChange({
      ...preferenceSet,
      hardConstraints: preferenceSet.hardConstraints.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    });
  };

  const clearConstraints = () => {
    if (window.confirm('Tem certeza que deseja remover todas as restrições?')) {
      onPreferenceSetChange({
        ...preferenceSet,
        hardConstraints: [],
      });
    }
  };

  // --- Handler for userDestCodes ---
  const handleDestCodeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedCodes = Array.from(
      event.target.selectedOptions,
      (option) => option.value,
    );
    onPreferenceSetChange({
      ...preferenceSet,
      userDestCodes: selectedCodes,
    });
  };

  const summary = useMemo(
    () => ({
      total: preferenceSet.hardConstraints.length,
      active: preferenceSet.hardConstraints.filter((p) => p.enabled).length,
    }),
    [preferenceSet],
  );

  return (
    <div className="space-y-6">
      <h2 className="page-title">Gerenciador de Preferências</h2>

      {/* DestCode Selection */}
      <div className="card-body">
        <h3 className="section-title">
          Códigos de destino do seu curso de graduação
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          Selecione todos os códigos de destino que se aplicam ao seu curso!
          <br />
          (Segure Ctrl ou Cmd para selecionar múltiplos).
        </p>
        <select
          multiple
          className="select select-bordered w-full h-32"
          value={preferenceSet.userDestCodes}
          onChange={handleDestCodeChange}
        >
          {availableDestCodes.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>

      <div className="card-body">
        <h3 className="section-title">Adicionar Nova Restrição de Horário</h3>
        <AddPreferenceForm
          onAddConstraint={addConstraint}
          availableCourses={availableCourses}
          availableProfessors={availableProfessors}
        />
      </div>

      <div className="card-body">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <h3 className="section-title mb-0">
            Restrições de Horário ({preferenceSet.hardConstraints.length})
          </h3>
          {preferenceSet.hardConstraints.length > 0 && (
            <button onClick={clearConstraints} className="btn btn-error btn-sm">
              Limpar Todas
            </button>
          )}
        </div>

        {preferenceSet.hardConstraints.length === 0 ? (
          <p className="text-gray-500 italic text-sm">
            Nenhuma restrição de horário configurada. ☝️
          </p>
        ) : (
          <div className="space-y-4">
            {preferenceSet.hardConstraints.map((constraint) => (
              <PreferenceCard
                key={constraint.id}
                constraint={constraint}
                onRemove={() => removeConstraint(constraint.id)}
                onUpdate={(updates) => updateConstraint(constraint.id, updates)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card-footer">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="font-medium text-gray-600">
            <strong>Total de Restrições:</strong> {summary.total}
          </div>
          <div className="font-medium text-gray-600">
            <strong>Restrições Ativas:</strong> {summary.active}
          </div>
        </div>
      </div>
    </div>
  );
}
