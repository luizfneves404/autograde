import { useAppData } from '@/hooks/useAppData';
import { GradeManager } from '@components/GradeManager';
import { CourseManager } from '@components/CourseManager';
import { PreferenceManager } from '@components/PreferenceManager';
import { ManualGradeCreator } from '@components/ManualGradeCreator';

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
    availableClasses,
    availableProfessors,
    availableDestCodes,
  } = useAppData();

  // The component is now just responsible for rendering the layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 font-display antialiased">
      <div className="min-h-screen supports-backdrop-filter:backdrop-blur-sm">
        <header className="container mx-auto px-6 py-8">
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 bg-clip-text text-transparent tracking-tight">
              AutoGrade
            </h1>
            <p className="text-xl text-gray-600 text-balance max-w-2xl mx-auto">
              Seu assistente inteligente para otimização de grades horárias
            </p>
          </div>
        </header>

        <nav className="container mx-auto px-6 mb-8">
          <div className="nav glassmorphism">
            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setView('courses');
                }}
                className={`nav-item transition-all duration-200 any-hover:hover:scale-105 ${
                  view === 'courses' ? 'nav-item-active' : ''
                }`}
              >
                📚 Disciplinas
              </button>
              <button
                onClick={() => {
                  setView('grades');
                }}
                className={`nav-item transition-all duration-200 any-hover:hover:scale-105 ${
                  view === 'grades' ? 'nav-item-active' : ''
                }`}
              >
                ⚡ Grades & Preferências
              </button>
              <button
                onClick={() => {
                  setView('manual');
                }}
                className={`nav-item transition-all duration-200 any-hover:hover:scale-105 ${
                  view === 'manual' ? 'nav-item-active' : ''
                }`}
              >
                ✏️ Grade Manual
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="btn-secondary cursor-pointer transition-all duration-200 any-hover:hover:scale-105">
                📁 Importar
                <input
                  type="file"
                  className="sr-only"
                  accept=".json"
                  onChange={handleJsonImport}
                />
              </label>

              <button
                onClick={handleExport}
                className="btn-secondary transition-all duration-200 any-hover:hover:scale-105"
              >
                💾 Exportar
              </button>

              <button
                onClick={handleGenerateGrades}
                className="btn-primary font-semibold transition-all duration-200 any-hover:hover:scale-105 shadow-lg"
              >
                ⚡ Gerar Grades
              </button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            {view === 'courses' && (
              <div className="animate-in fade-in-50 duration-300">
                <CourseManager
                  courses={courses}
                  onCoursesChange={setCourses}
                  importCSV={handleCsvImport}
                />
              </div>
            )}

            {view === 'grades' && (
              <div className="animate-in fade-in-50 duration-300">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 3xl:gap-12">
                  <div className="@container">
                    <GradeManager
                      grades={grades}
                      activeGrade={activeGrade}
                      setActiveGrade={setActiveGrade}
                      allCourses={courses}
                    />
                  </div>
                  <div className="@container">
                    <PreferenceManager
                      preferenceSet={preferenceSet}
                      onPreferenceSetChange={setPreferenceSet}
                      availableCourseCodes={availableCourseCodes}
                      availableProfessors={availableProfessors}
                      availableDestCodes={availableDestCodes}
                    />
                  </div>
                </div>
              </div>
            )}

            {view === 'manual' && (
              <div className="animate-in fade-in-50 duration-300">
                <ManualGradeCreator
                  allCourses={courses}
                  availableClasses={availableClasses}
                  preferenceSet={preferenceSet}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
