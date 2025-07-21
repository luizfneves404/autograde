import type { UIConstraint } from '@/types';
import { useState } from 'react';

// =================================================================================
// SUB-COMPONENT: PreferenceCard
// =================================================================================

interface PreferenceCardProps {
  constraint: UIConstraint;
  onRemove: () => void;
  onUpdate: (updates: Partial<UIConstraint>) => void;
}

function PreferenceCard({
  constraint,
  onRemove,
  onUpdate,
}: PreferenceCardProps) {
  const [isAdvancedViewOpen, setAdvancedViewOpen] = useState(false);

  return (
    <div
      className={`card p-4 border-l-4 ${constraint.enabled ? 'border-success' : 'border-gray-300 opacity-60'} transition-all`}
    >
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 mb-1">
            <strong className="text-lg font-semibold text-gray-800 truncate">
              {constraint.name}
            </strong>
            <p className="text-sm text-gray-700">{constraint.description}</p>
          </div>
          <button
            onClick={() => {
              setAdvancedViewOpen((prev) => !prev);
            }}
            className={`btn btn-sm ${isAdvancedViewOpen ? 'btn-info' : 'btn-neutral'}`}
            aria-label="Toggle advanced view"
            title="Toggle advanced view"
          >
            Ver detalhes
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 flex-shrink-0">
          <button
            onClick={() => {
              onUpdate({ enabled: !constraint.enabled });
            }}
            className={`btn btn-sm w-24 ${constraint.enabled ? 'btn-success' : 'btn-neutral'}`}
          >
            {constraint.enabled ? 'Ativo' : 'Inativo'}
          </button>
          <button onClick={onRemove} className="btn btn-sm btn-error">
            Remover
          </button>
        </div>
      </div>

      {/* --- NEW: Collapsible advanced view section --- */}
      {isAdvancedViewOpen && (
        <div className="mt-4 p-3 bg-neutral-100 rounded-md">
          <h4 className="text-sm font-semibold text-neutral-700 mb-2">
            Expressão da Restrição (JSON)
          </h4>
          <pre className="text-xs bg-neutral-800 text-neutral-200 p-3 rounded-lg overflow-x-auto">
            <code>{JSON.stringify(constraint.expression, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default PreferenceCard;
