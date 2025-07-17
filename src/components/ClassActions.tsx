import React from 'react';

interface ClassActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const ClassActions: React.FC<ClassActionsProps> = ({
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex gap-2">
      <button onClick={onEdit} className="btn-primary btn-sm">
        Editar
      </button>
      <button onClick={onDelete} className="btn-error btn-sm">
        Deletar
      </button>
    </div>
  );
};
