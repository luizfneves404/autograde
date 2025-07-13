import React from 'react'

interface DisciplinaActionsProps {
  onEdit: () => void
  onDelete: () => void
}

export const DisciplinaActions: React.FC<DisciplinaActionsProps> = ({
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={onEdit}
        className="btn-primary"
      >
        Editar
      </button>
      <button
        onClick={onDelete}
        className="btn-error"
      >
        Deletar
      </button>
    </div>
  )
} 