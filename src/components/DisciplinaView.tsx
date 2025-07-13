import type { Disciplina } from '@/types'

interface DisciplinaViewProps {
  disciplina: Disciplina
  allDisciplinas: Disciplina[]
}

export function DisciplinaView({
  disciplina,
  allDisciplinas,
}: DisciplinaViewProps) {
  const getNameByCode = (code: string) =>
    allDisciplinas.find(d => d.code === code)?.name || `${code} (not found)`

  const detailItem = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row">
      <strong className="w-full sm:w-1/3 text-neutral-600">{label}:</strong>
      <span className="w-full sm:w-2/3 text-neutral-800">{value}</span>
    </div>
  )

  return (
    <div className="flex-1">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-neutral-900">{disciplina.name}</h3>
        <p className="text-md text-neutral-500">{disciplina.code}</p>
      </div>

      <div className="space-y-3 text-sm">
        {detailItem('Créditos', disciplina.numCreditos)}
        {detailItem(
          'Requer pré-requisitos',
          disciplina.shouldHavePreRequisites ? 'Sim' : 'Não',
        )}
        {detailItem(
          'Co-requisitos Unidirecionais',
          disciplina.unidirCoRequisites.length > 0
            ? disciplina.unidirCoRequisites.map(getNameByCode).join(', ')
            : 'Nenhum',
        )}
        {detailItem(
          'Co-requisitos Bidirecionais',
          disciplina.bidirCoRequisites.length > 0
            ? disciplina.bidirCoRequisites.map(getNameByCode).join(', ')
            : 'Nenhum',
        )}
        {detailItem(
          'Posso puxar no próximo semestre',
          disciplina.possoPuxar ? 'Sim' : 'Não',
        )}
      </div>
    </div>
  )
} 