import { useMemo, useState } from 'react';
import type { PreferenceSet, UIConstraint } from '@/types';
import AddPreferenceForm from '@components/AddPreferenceForm';
import PreferenceCard from './PreferenceCard';
import { getDestCodeName } from '@/utils/destCodes';

interface PreferenceManagerProps {
  preferenceSet: PreferenceSet;
  onPreferenceSetChange: (preferenceSet: PreferenceSet) => void;
  availableDestCodes: string[];
  availableProfessors: string[];
  availableCourseCodes: string[];
}

export function PreferenceManager({
  preferenceSet,
  onPreferenceSetChange,
  availableDestCodes,
  availableProfessors,
  availableCourseCodes,
}: PreferenceManagerProps) {
  // --- Local state for managing DestCode selection before saving ---
  const [pendingDestCodes, setPendingDestCodes] = useState<string[]>(
    preferenceSet.userDestCodes,
  );

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

  // --- Handlers for userDestCodes ---

  // Sorts the available codes alphabetically by their friendly name
  const sortedAvailableDestCodes = useMemo(() => {
    return [...availableDestCodes].sort((a, b) =>
      getDestCodeName(a).localeCompare(getDestCodeName(b)),
    );
  }, [availableDestCodes]);

  // Toggles a single code in the pending selection list
  const handleDestCodeToggle = (code: string) => {
    setPendingDestCodes((current) =>
      current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code],
    );
  };

  // Saves the pending selection to the main preference set
  const handleSaveDestCodes = () => {
    onPreferenceSetChange({
      ...preferenceSet,
      userDestCodes: pendingDestCodes,
    });
    // Optionally, you can add a toast notification here for user feedback
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

      {/* REFACTORED: DestCode Selection */}
      <div className="card-body">
        <h3 className="section-title">Códigos de Destino</h3>

        {/* Display currently saved codes */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Códigos Salvos:</h4>
          <div className="flex flex-wrap gap-2">
            {preferenceSet.userDestCodes.length > 0 ? (
              preferenceSet.userDestCodes.map((code) => (
                <span key={code} className="badge badge-primary badge-lg">
                  {getDestCodeName(code)}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                Nenhum código de destino salvo.
              </p>
            )}
          </div>
        </div>

        <div className="divider"></div>

        {/* Improved UX for selecting codes */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">
            Selecione seus códigos:
          </h4>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2 bg-base-200">
            {sortedAvailableDestCodes.map((code) => (
              <label
                key={code}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={pendingDestCodes.includes(code)}
                  onChange={() => {
                    handleDestCodeToggle(code);
                  }}
                />
                <span className="label-text">{getDestCodeName(code)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="mt-4 flex justify-end">
          <button onClick={handleSaveDestCodes} className="btn btn-primary">
            Salvar Códigos
          </button>
        </div>
      </div>

      <div className="card-body">
        <h3 className="section-title">Adicionar Nova Restrição de Horário</h3>
        <AddPreferenceForm
          onAddConstraint={addConstraint}
          availableCourseCodes={availableCourseCodes}
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
                onRemove={() => {
                  removeConstraint(constraint.id);
                }}
                onUpdate={(updates) => {
                  updateConstraint(constraint.id, updates);
                }}
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
