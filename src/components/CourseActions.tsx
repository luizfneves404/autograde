import React from 'react';

interface CourseActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const CourseActions: React.FC<CourseActionsProps> = ({
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex gap-2">
      <button onClick={onEdit} className="btn-primary">
        Editar
      </button>
      <button onClick={onDelete} className="btn-error">
        Deletar
      </button>
    </div>
  );
};
