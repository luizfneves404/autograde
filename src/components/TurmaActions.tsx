import React from 'react'

interface TurmaActionsProps {
  onEdit: () => void
  onDelete: () => void
}

export const TurmaActions: React.FC<TurmaActionsProps> = ({
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={onEdit}
        className="btn-primary btn-sm"
      >
        Editar
      </button>
      <button
        onClick={onDelete}
        className="btn-error btn-sm"
      >
        Deletar
      </button>
    </div>
  )
} 