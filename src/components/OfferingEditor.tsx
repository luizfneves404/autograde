import { useState } from 'react';
import type { ClassOffering } from '@/types';

interface OfferingEditorProps {
  offering: ClassOffering;
  onSave: (updatedData: Partial<Pick<ClassOffering, 'vacancyCount'>>) => void;
  onCancel: () => void;
}

/**
 * A cheerful little form for editing class offerings!
 */
function OfferingEditor({ offering, onSave, onCancel }: OfferingEditorProps) {
  // Let's keep track of the new number of opportunities!
  const [vacancies, setVacancies] = useState(offering.vacancyCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ vacancyCount: vacancies });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <span className="font-bold text-blue-800">{offering.destCode}:</span>
        <input
          type="number"
          value={vacancies}
          onChange={(e) => {
            setVacancies(parseInt(e.target.value, 10) || 0);
          }}
          className="input-sm w-24 text-center"
          aria-label={`Vagas para ${offering.destCode}`}
          autoFocus
        />
        <span className="text-sm text-blue-700">vagas incríveis! 🚀</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="btn-icon-success"
          aria-label="Salvar Mudanças"
        >
          ✅
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-icon-danger"
          aria-label="Cancelar Edição"
        >
          ❌
        </button>
      </div>
    </form>
  );
}

export default OfferingEditor;
