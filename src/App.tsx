import { useState, useCallback, useMemo } from 'react';
import type { Grade, Disciplina, Turma, PreferenceSet, AppData } from '@/types';
import { parseCSVData } from '@/utils/csvParser';
import { generateOptimizedGrades } from '@/utils/gradeOptimizer';

import { GradeManager } from '@components/GradeManager';
import { DisciplinaManager } from '@components/DisciplinaManager';
import { PreferenceManager } from '@components/PreferenceManager';

function App() {
  const [view, setView] = useState<'disciplinas' | 'grades'>('disciplinas');

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [preferenceSet, setPreferenceSet] = useState<PreferenceSet | null>(null);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [activeGrade, setActiveGrade] = useState<Grade | null>(null);

  const handleDataImport = useCallback((data: AppData) => {
    // A simple merge strategy: update existing or add new ones
    // You might want a more sophisticated merging logic
    const updatedDisciplinas = [...data.disciplinas]
    const incomingDisciplinaCodes = new Set(data.disciplinas.map(d => d.code))
    disciplinas.forEach(existing => {
      if (!incomingDisciplinaCodes.has(existing.code)) {
        updatedDisciplinas.push(existing)
      }
    })

    const updatedTurmas = [...data.turmas]
    const incomingTurmaKeys = new Set(data.turmas.map(t => `${t.disciplinaCode}-${t.turmaCode}`))
    turmas.forEach(existing => {
      if (!incomingTurmaKeys.has(`${existing.disciplinaCode}-${existing.turmaCode}`)) {
        updatedTurmas.push(existing)
      }
    })

    setDisciplinas(updatedDisciplinas)
    setTurmas(updatedTurmas)
  }, [disciplinas, turmas])

  const handleJsonImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const content = e.target?.result
          if (typeof content !== 'string') {
            throw new Error('File content is not a string.')
          }
          const data = JSON.parse(content) as AppData
          handleDataImport(data)
          alert('Dados importados com sucesso!')
        } catch (error) {
          console.error('Erro ao importar JSON:', error)
          alert('Falha ao importar o arquivo JSON. Verifique o formato do arquivo.')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const content = e.target?.result
          if (typeof content !== 'string') {
            throw new Error('File content is not a string.')
          }
          const data = parseCSVData(content)
          handleDataImport(data)
          alert('Dados do CSV importados com sucesso!')
        } catch (error) {
          console.error('Erro ao importar CSV:', error)
          alert(`Falha ao importar o arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExport = () => {
    const data: AppData = { disciplinas, turmas }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autograde_data_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleGenerateGrades = () => {
    try {
      const generated = generateOptimizedGrades(
        turmas,
        disciplinas,
        preferenceSet,
      )
      setGrades(generated)
      setActiveGrade(generated[0] ?? null)
      setView('grades')
      if (generated.length === 0) {
        alert('Nenhuma grade pôde ser gerada com as preferências e disciplinas atuais.')
      }
    } catch (error) {
      console.error('Erro ao gerar grades:', error)
      alert(`Ocorreu um erro ao gerar as grades: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const availableTeachers = useMemo(() => [...new Set(turmas.map(t => t.teacherName))], [turmas]);
  const availableDestCodes = useMemo(() => [...new Set(turmas.map(t => t.destCode))], [turmas]);
  const availableDisciplinas = useMemo(() => disciplinas.map(d => d.code), [disciplinas]);


  return (
    <div className="bg-neutral-100 text-neutral-900 font-sans min-h-screen p-4 sm:p-6">
      <header className="container page-header">
        <h1 className="text-4xl font-extrabold text-neutral-800 tracking-tight">
          AutoGrade
        </h1>
        <p className="page-subtitle text-lg">
          Seu assistente para otimização de grades horárias.
        </p>
      </header>

      <nav className="container nav mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setView('disciplinas')}
            className={view === 'disciplinas' ? 'nav-item-active' : 'nav-item'}
          >
            Gerenciar Disciplinas
          </button>
          <button
            onClick={() => setView('grades')}
            className={view === 'grades' ? 'nav-item-active' : 'nav-item'}
          >
            Preferências &amp; Grades
          </button>
        </div>
        <button
          onClick={handleGenerateGrades}
          className="btn-success font-bold transform hover:scale-105"
        >
          Gerar Grades
        </button>
      </nav>

      <main className="container">
        {view === 'disciplinas' && (
          <DisciplinaManager
            initialDisciplinas={disciplinas}
            initialTurmas={turmas}
            onDisciplinasChange={setDisciplinas}
            onTurmasChange={setTurmas}
            importData={handleJsonImport}
            exportData={handleExport}
            importCSV={handleCsvImport}
          />
        )}

        {view === 'grades' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3">
              <GradeManager
                grades={grades}
                activeGrade={activeGrade}
                setActiveGrade={setActiveGrade}
                allDisciplinas={disciplinas}
              />
            </div>
            <div className="lg:w-2/3">
              <PreferenceManager
                onPreferencesChange={setPreferenceSet}
                availableDisciplinas={availableDisciplinas}
                availableTeachers={availableTeachers}
                availableDestCodes={availableDestCodes}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;