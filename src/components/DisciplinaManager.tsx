import { useState, useMemo } from 'react';
import type { Disciplina, Turma } from '@/types';
import { ITEMS_PER_PAGE } from '@/constants';
import { PrerequisiteInput } from '@components/PrerequisiteInput';
import { DisciplinaView } from '@components/DisciplinaView';
import { DisciplinaEditor } from '@components/DisciplinaEditor';
import { TurmasSection } from '@components/TurmasSection';
import { DisciplinaActions } from '@components/DisciplinaActions';

interface DisciplinaManagerProps {
  initialDisciplinas: Disciplina[];
  initialTurmas: Turma[];
  onDisciplinasChange: (disciplinas: Disciplina[]) => void;
  onTurmasChange: (turmas: Turma[]) => void;
  importData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  exportData: () => void;
  importCSV: (event: React.ChangeEvent<HTMLInputElement>) => void;
}



export function DisciplinaManager({
  initialDisciplinas,
  initialTurmas,
  onDisciplinasChange,
  onTurmasChange,
  importData,
  exportData,
  importCSV,
}: DisciplinaManagerProps) {
  const [editingDisciplina, setEditingDisciplina] = useState<string | null>(null);
  const [editingTurma, setEditingTurma] = useState<string | null>(null);
  const [newDisciplina, setNewDisciplina] = useState<Partial<Disciplina>>({});
  const [expandedDisciplinas, setExpandedDisciplinas] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDisciplinas = useMemo(() => {
    return initialDisciplinas.filter(
      disciplina =>
        disciplina.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disciplina.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [initialDisciplinas, searchQuery]);

  const totalPages = Math.ceil(filteredDisciplinas.length / ITEMS_PER_PAGE);
  const paginatedDisciplinas = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDisciplinas.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDisciplinas, currentPage]);

  const toggleExpanded = (disciplinaCode: string) => {
    setExpandedDisciplinas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(disciplinaCode)) {
        newSet.delete(disciplinaCode);
      } else {
        newSet.add(disciplinaCode);
      }
      return newSet;
    });
  };

  const addDisciplina = () => {
    if (!newDisciplina.code?.trim() || !newDisciplina.name?.trim()) {
      alert('Por favor, preencha ambos o código e o nome');
      return;
    }

    if (initialDisciplinas.some(d => d.code === newDisciplina.code)) {
      alert('Uma disciplina com este código já existe');
      return;
    }

    const disciplina: Disciplina = {
      code: newDisciplina.code.trim(),
      name: newDisciplina.name.trim(),
      shouldHavePreRequisites: newDisciplina.shouldHavePreRequisites || false,
      unidirCoRequisites: newDisciplina.unidirCoRequisites || [],
      bidirCoRequisites: newDisciplina.bidirCoRequisites || [],
      possoPuxar: newDisciplina.possoPuxar || false,
      numCreditos: newDisciplina.numCreditos || 0,
    };

    onDisciplinasChange([...initialDisciplinas, disciplina]);
    setNewDisciplina({});
  };

  const updateDisciplina = (code: string, updated: Disciplina) => {
    const updatedDisciplinas = initialDisciplinas.map(d => (d.code === code ? updated : d));
    onDisciplinasChange(updatedDisciplinas);
    setEditingDisciplina(null);
  };

  const deleteDisciplina = (code: string) => {
    if (
      window.confirm(
        `Tem certeza que deseja deletar a disciplina ${code}? Isso também deletará todas as turmas associadas.`,
      )
    ) {
      const filteredDisciplinas = initialDisciplinas.filter(d => d.code !== code);
      const filteredTurmas = initialTurmas.filter(t => t.disciplinaCode !== code);
      onDisciplinasChange(filteredDisciplinas);
      onTurmasChange(filteredTurmas);
    }
  };

  const addTurma = (disciplinaCode: string, turma: Omit<Turma, 'disciplinaCode'>) => {
    const newTurma: Turma = { ...turma, disciplinaCode };
    onTurmasChange([...initialTurmas, newTurma]);
  };

  const updateTurma = (turmaKey: string, updated: Turma) => {
    const updatedTurmas = initialTurmas.map(t =>
      `${t.turmaCode}-${t.disciplinaCode}` === turmaKey ? updated : t,
    );
    onTurmasChange(updatedTurmas);
    setEditingTurma(null);
  };

  const deleteTurma = (turmaKey: string) => {
    const [turmaCode, disciplinaCode] = turmaKey.split('-');
    if (window.confirm(`Tem certeza que deseja deletar a turma ${turmaCode} para ${disciplinaCode}?`)) {
      const filteredTurmas = initialTurmas.filter(
        t => `${t.turmaCode}-${t.disciplinaCode}` !== turmaKey,
      );
      onTurmasChange(filteredTurmas);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-neutral-50 min-h-screen">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="page-title mr-auto">Gerenciamento de Disciplinas</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportData} className="btn-neutral">
            Exportar para JSON
          </button>
          <label className="btn-neutral cursor-pointer">
            Importar JSON
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
          <label className="btn-info cursor-pointer">
            Importar CSV da PUC-Rio
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
        </div>
        <input
          type="text"
          placeholder="Pesquisar disciplinas..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="input w-full md:w-72"
        />
      </div>

      <div className="card-body mb-8">
        <h3 className="section-title">Adicionar Nova Disciplina</h3>
        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Código da Disciplina (e.g., INF1007)"
              value={newDisciplina.code || ''}
              onChange={e => setNewDisciplina(prev => ({ ...prev, code: e.target.value }))}
              className="input"
            />
            <input
              placeholder="Nome da Disciplina (e.g., Programação I)"
              value={newDisciplina.name || ''}
              onChange={e => setNewDisciplina(prev => ({ ...prev, name: e.target.value }))}
              className="input"
            />
          </div>

          <PrerequisiteInput
            disciplinas={initialDisciplinas}
            selected={newDisciplina.unidirCoRequisites || []}
            onChange={unidirCoRequisites => setNewDisciplina(prev => ({ ...prev, unidirCoRequisites }))}
            label="Co-requisitos Unidirecionais"
            placeholder="Códigos de disciplinas que devem ser puxadas antes ou junto com essa"
          />

          <PrerequisiteInput
            disciplinas={initialDisciplinas}
            selected={newDisciplina.bidirCoRequisites || []}
            onChange={bidirCoRequisites => setNewDisciplina(prev => ({ ...prev, bidirCoRequisites }))}
            label="Co-requisitos Bidirecionais"
            placeholder="Códigos de disciplinas que devem ser puxadas junto com essa"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="possoPuxar"
              checked={newDisciplina.possoPuxar || false}
              onChange={e => setNewDisciplina(prev => ({ ...prev, possoPuxar: e.target.checked }))}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-blue-500"
            />
            <label htmlFor="possoPuxar" className="text-sm font-medium text-neutral-700">
              Posso puxar esta disciplina no próximo semestre
            </label>
          </div>
          <button onClick={addDisciplina} className="btn-primary justify-self-start">
            Adicionar Disciplina
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {paginatedDisciplinas.map(disciplina => (
          <div key={disciplina.code} className="card overflow-hidden">
            <div
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={() => toggleExpanded(disciplina.code)}
            >
              <div>
                <h3 className="font-bold text-lg text-neutral-800">
                  {disciplina.code} - {disciplina.name}
                </h3>
                <p className="text-sm text-neutral-600">
                  {initialTurmas.filter(t => t.disciplinaCode === disciplina.code).length} turmas
                </p>
              </div>
              <DisciplinaActions
                onEdit={() => setEditingDisciplina(disciplina.code)}
                onDelete={() => deleteDisciplina(disciplina.code)}
              />
            </div>

            {expandedDisciplinas.has(disciplina.code) && (
              <div className="card-footer">
                {editingDisciplina === disciplina.code ? (
                  <DisciplinaEditor
                    disciplina={disciplina}
                    onSave={updated => updateDisciplina(disciplina.code, updated)}
                    onCancel={() => setEditingDisciplina(null)}
                    disciplinas={initialDisciplinas}
                  />
                ) : (
                  <DisciplinaView disciplina={disciplina} allDisciplinas={initialDisciplinas} />
                )}

                <TurmasSection
                  disciplinaCode={disciplina.code}
                  turmas={initialTurmas.filter(t => t.disciplinaCode === disciplina.code)}
                  editingTurma={editingTurma}
                  onAddTurma={turma => addTurma(disciplina.code, turma)}
                  onUpdateTurma={updateTurma}
                  onDeleteTurma={deleteTurma}
                  onSetEditingTurma={setEditingTurma}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              disabled={currentPage === page}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                currentPage === page
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
