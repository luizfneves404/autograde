import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Grade, Course, AppData, PreferenceSet } from '@/types';
import { parseCSVData } from '@/utils/csvParser';
import { generateOptimizedGrades } from '@/utils/gradeOptimizer';

export function useAppData() {
  // === STATE MANAGEMENT ===
  const [view, setView] = useState<'courses' | 'grades' | 'manual'>('courses');
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [preferenceSet, setPreferenceSet] = useState<PreferenceSet>({
    hardConstraints: [],
    userDestCodes: [],
  });
  const [grades, setGrades] = useState<Grade[]>([]);
  const [activeGrade, setActiveGrade] = useState<Grade | null>(null);

  // === LOCALSTORAGE PERSISTENCE ===

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('autograde_data');
      if (savedData) {
        const parsed: AppData = JSON.parse(savedData);
        // Basic validation to ensure data integrity
        if (parsed.courses) setCourses(parsed.courses);
        if (parsed.preferenceSet) setPreferenceSet(parsed.preferenceSet);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      // Optionally, you could set an error state to display a message in the UI
    }
  }, []); // Empty dependency array ensures this runs only once

  // Save data to localStorage whenever courses or preferences change
  useEffect(() => {
    try {
      const dataToSave: AppData = { courses, preferenceSet };
      localStorage.setItem('autograde_data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, [courses, preferenceSet]);

  // === DATA HANDLERS ===

  const handleDataImport = useCallback((data: AppData) => {
    setCourses(data.courses || {});
    setPreferenceSet(
      data.preferenceSet || {
        hardConstraints: [],
        userDestCodes: [],
      },
    );
  }, []);

  const handleJsonImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result;
            if (typeof content !== 'string')
              throw new Error('File content is not a string.');
            const data = JSON.parse(content) as AppData;
            handleDataImport(data);
            // Consider using a toast notification library instead of alert()
            alert('Dados importados com sucesso!');
          } catch (error) {
            console.error('Erro ao importar JSON:', error);
            alert(
              'Falha ao importar o arquivo JSON. Verifique o formato do arquivo.',
            );
          }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input to allow re-uploading the same file
      }
    },
    [handleDataImport],
  );

  const handleCsvImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result;
            if (typeof content !== 'string')
              throw new Error('File content is not a string.');
            const coursesFromCsv = parseCSVData(content);

            const courseCount = Object.keys(coursesFromCsv).length;

            const classCount = Object.values(coursesFromCsv).reduce(
              (total, course) => total + course.classes.length,
              0,
            );
            const classOfferingCount = Object.values(coursesFromCsv).reduce(
              (total, course) =>
                total +
                course.classes.reduce(
                  (classTotal, c) => classTotal + c.offerings.length,
                  0,
                ),
              0,
            );

            alert(
              `${courseCount} disciplinas, ${classCount} turmas e ${classOfferingCount} ofertas de turmas importadas com sucesso!`,
            );

            // TODO: Implement a true merge instead of overwrite for existing courses
            setCourses((prev) => ({ ...prev, ...coursesFromCsv }));
          } catch (error) {
            console.error('Erro ao importar CSV:', error);
            alert(
              `Falha ao importar o arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            );
          }
        };
        reader.readAsText(file);
        event.target.value = '';
      }
    },
    [],
  );

  const handleExport = useCallback(() => {
    const dataToExport: AppData = { courses, preferenceSet };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autograde_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [courses, preferenceSet]);

  const handleGenerateGrades = useCallback(() => {
    try {
      // TODO: Use progress callback to update UI state (e.g., for a progress bar)
      const generated = generateOptimizedGrades(
        courses,
        preferenceSet.hardConstraints
          .filter((c) => c.enabled)
          .map((c) => c.expression),
        preferenceSet.userDestCodes,
        (progress) => {
          console.log(`Progress: ${progress}%`);
        },
      );
      setGrades(generated);
      setActiveGrade(generated[0] ?? null);
      setView('grades');
      if (generated.length === 0) {
        alert(
          'Nenhuma grade pôde ser gerada com as preferências e disciplinas atuais.',
        );
      }
    } catch (error) {
      console.error('Erro ao gerar grades:', error);
      alert(
        `Ocorreu um erro ao gerar as grades: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }, [courses, preferenceSet]);

  // === DERIVED DATA ===

  const coursesList = useMemo(() => Object.values(courses), [courses]);
  const availableCourseCodes = useMemo(() => Object.keys(courses), [courses]);
  const availableClasses = useMemo(() => {
    return coursesList.flatMap((d) => d.classes);
  }, [coursesList]);
  const availableProfessors = useMemo(
    () => [
      ...new Set(
        coursesList.flatMap((t) => t.classes.map((c) => c.professorName)),
      ),
    ],
    [coursesList],
  );
  const availableDestCodes = useMemo(
    () => [
      ...new Set(
        coursesList.flatMap((t) =>
          t.classes.flatMap((c) => c.offerings.map((o) => o.destCode)),
        ),
      ),
    ],
    [coursesList],
  );

  // === RETURN VALUE ===

  return {
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
  };
}
