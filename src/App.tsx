import { useAppData } from '@/hooks/useAppData';
import { GradeManager } from '@components/GradeManager';
import { CourseManager } from '@components/CourseManager';
import { PreferenceManager } from '@components/PreferenceManager';

function App() {
  // Call the hook to get all state and logic
  const {
    view,
    setView,
    courses,
    setCourses,
    preferenceSet,
    setPreferenceSet,
    grades,
    activeGrade,
    setActiveGrade,
    handleJsonImport,
    handleCsvImport,
    handleExport,
    handleGenerateGrades,
    availableCourseCodes,
    availableProfessors,
    availableDestCodes,
  } = useAppData();

  // The component is now just responsible for rendering the layout
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
        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('courses')}
            className={view === 'courses' ? 'nav-item-active' : 'nav-item'}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <label className="btn-secondary cursor-pointer">
            Importar JSON
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleJsonImport}
            />
          </label>

          <button onClick={handleExport} className="btn-secondary">
            Exportar JSON
          </button>

          <button
            onClick={handleGenerateGrades}
            className="btn-success font-bold transform hover:scale-105"
          >
            Gerar Grades
          </button>
        </div>
      </nav>

      <main className="container">
        {view === 'courses' && (
          <CourseManager
            courses={courses}
            onCoursesChange={setCourses}
            importCSV={handleCsvImport}
          />
        )}

        {view === 'grades' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/2">
              <GradeManager
                grades={grades}
                activeGrade={activeGrade}
                setActiveGrade={setActiveGrade}
                allCourses={courses}
              />
            </div>
            <div className="lg:w-1/2">
              <PreferenceManager
                preferenceSet={preferenceSet}
                onPreferenceSetChange={setPreferenceSet}
                availableCourses={availableCourseCodes}
                availableProfessors={availableProfessors}
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
