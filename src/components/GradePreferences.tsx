import React from 'react';
import type { Grade } from '@/types';

interface GradePreferencesProps {
  currentGrade: Grade;
}

export const GradePreferences: React.FC<GradePreferencesProps> = ({ currentGrade }) => {
  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 shadow-sm">
      <h4 className="text-lg font-semibold mb-3 text-neutral-800">
        Preferências Atendidas nesta Grade
      </h4>
      {currentGrade.preferences.length > 0 ? (
        <ul className="list-disc list-inside space-y-1 text-neutral-700">
          {currentGrade.preferences.map((pref, index) => (
            <li key={index} className="text-sm">
              {pref}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500 italic">
          Nenhuma preferência específica foi atendida por esta grade (ou as preferências ainda são
          genéricas).
        </p>
      )}
    </div>
  );
};
