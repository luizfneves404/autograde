import type { UIConstraint } from '@/types';
import { isExprNode } from '@/utils/isExprNode';
import { useState, useEffect } from 'react';

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

  const [jsonString, setJsonString] = useState(
    JSON.stringify(constraint.expression, null, 2),
  );
  const [isJsonValid, setIsJsonValid] = useState(true);

  useEffect(() => {
    setJsonString(JSON.stringify(constraint.expression, null, 2));
    setIsJsonValid(true);
  }, [constraint.expression]);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJsonString = e.target.value;
    setJsonString(newJsonString);

    try {
      const parsedJson: unknown = JSON.parse(newJsonString);

      if (isExprNode(parsedJson)) {
        onUpdate({ expression: parsedJson });
        setIsJsonValid(true);
      } else {
        setIsJsonValid(false);
      }
    } catch (_) {
      setIsJsonValid(false);
    }
  };

  return (
    <div
      className={`card p-4 border-l-4 ${constraint.enabled ? 'border-success' : 'border-gray-300 opacity-60'} transition-all`}
    >
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 mb-2">
            <input
              type="text"
              value={constraint.name}
              onChange={(e) => {
                onUpdate({ name: e.target.value });
              }}
              className="text-lg font-semibold text-gray-800 bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
              placeholder="Nome da Preferência"
            />
            <textarea
              value={constraint.description}
              onChange={(e) => {
                onUpdate({ description: e.target.value });
              }}
              className="text-sm text-gray-700 bg-transparent border-b border-transparent focus:border-primary focus:outline-none resize-none"
              placeholder="Descrição"
              rows={2}
            />
          </div>
          <button
            onClick={() => {
              setAdvancedViewOpen((prev) => !prev);
            }}
            className={`btn btn-sm ${isAdvancedViewOpen ? 'btn-info' : 'btn-neutral'}`}
          >
            {isAdvancedViewOpen ? 'Ocultar Detalhes' : 'Ver Detalhes'}
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

      {isAdvancedViewOpen && (
        <div className="mt-4 p-3 bg-neutral-100 rounded-md">
          <h4 className="text-sm font-semibold text-neutral-700 mb-2">
            Expressão da Restrição (JSON)
          </h4>
          <textarea
            className={`w-full p-3 font-mono text-xs rounded-lg bg-neutral-800 text-neutral-200 focus:outline-none focus:ring-2 ${isJsonValid ? 'focus:ring-primary' : 'ring-2 ring-error'}`}
            value={jsonString}
            onChange={handleJsonChange}
            rows={10}
            spellCheck="false"
          />
          {!isJsonValid && (
            <p className="text-xs text-error mt-1">
              A sintaxe do JSON é inválida.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PreferenceCard;
