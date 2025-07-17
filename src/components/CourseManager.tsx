import { useState, useMemo } from 'react';
import type { Course, CourseClass } from '@/types';
import { ITEMS_PER_PAGE } from '@/constants';
// Local helper as createClassKey might be removed from utils
const createClassKey = (courseClass: {
  courseCode: string;
  classCode: string;
}) => `${courseClass.courseCode}-${courseClass.classCode}`;

// --- Child Component Imports ---
import { PrerequisiteInput } from '@components/PrerequisiteInput';
import { CourseView } from '@/components/CourseView';
import { CourseEditor } from '@/components/CourseEditor';
import { ClassSection } from '@/components/ClassSection';
import { CourseActions } from '@/components/CourseActions';
import Pagination from '@components/Pagination';

interface CourseManagerProps {
  courses: Record<string, Course>;
  onCoursesChange: (courses: Record<string, Course>) => void;
  importCSV: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CourseManager({
  courses,
  onCoursesChange,
  importCSV,
}: CourseManagerProps) {
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<string | null>(null); // Now stores a composite key: "COURSECODE-CLASSCODE"
  const [newCourse, setNewCourse] = useState<Partial<Course>>({});
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const courseList = useMemo(() => Object.values(courses), [courses]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courseList;
    return courseList.filter(
      (course) =>
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [courseList, searchQuery]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  const toggleExpanded = (courseCode: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      newSet.has(courseCode)
        ? newSet.delete(courseCode)
        : newSet.add(courseCode);
      return newSet;
    });
  };

  // --- CRUD Operations ---

  const addCourse = () => {
    const code = newCourse.code?.trim().toUpperCase();
    if (!code || !newCourse.name?.trim()) {
      alert('Please provide both a course code and name.');
      return;
    }
    if (courses[code]) {
      alert('A course with this code already exists.');
      return;
    }

    const course: Course = {
      code,
      name: newCourse.name.trim(),
      shouldHavePreRequisites: newCourse.shouldHavePreRequisites || false,
      unidirCoRequisites: newCourse.unidirCoRequisites || [],
      bidirCoRequisites: newCourse.bidirCoRequisites || [],
      numCredits: newCourse.numCredits || 0,
      classes: [], // Correctly initialized with an empty classes array
    };
    onCoursesChange({ ...courses, [code]: course });
    setNewCourse({});
  };

  const updateCourse = (code: string, updated: Course) => {
    onCoursesChange({ ...courses, [code]: updated });
    setEditingCourse(null);
  };

  const deleteCourse = (code: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${code}? This will also delete all of its classes.`,
      )
    ) {
      return;
    }
    const newCourses = { ...courses };
    delete newCourses[code];
    onCoursesChange(newCourses);
  };

  const addClass = (
    courseCode: string,
    newClassData: Omit<CourseClass, 'courseCode'>,
  ) => {
    const targetCourse = courses[courseCode];
    if (!targetCourse) return;

    // Ensure the new class code doesn't already exist for this course
    if (
      targetCourse.classes.some((c) => c.classCode === newClassData.classCode)
    ) {
      alert(
        `Class ${newClassData.classCode} already exists for ${courseCode}.`,
      );
      return;
    }

    const newClass: CourseClass = { ...newClassData, courseCode };
    const updatedCourse = {
      ...targetCourse,
      classes: [...targetCourse.classes, newClass],
    };
    onCoursesChange({ ...courses, [courseCode]: updatedCourse });
  };

  const updateClass = (classKey: string, updatedData: CourseClass) => {
    const { courseCode } = updatedData;
    const targetCourse = courses[courseCode];
    if (!targetCourse) return;

    const updatedCourse = {
      ...targetCourse,
      classes: targetCourse.classes.map((c) =>
        c.classCode === updatedData.classCode ? updatedData : c,
      ),
    };
    onCoursesChange({ ...courses, [courseCode]: updatedCourse });
    setEditingClass(null);
  };

  const deleteClass = (classKey: string) => {
    const [courseCode, classCode] = classKey.split('-');
    const targetCourse = courses[courseCode];
    if (!targetCourse) return;

    if (
      window.confirm(
        `Are you sure you want to delete class ${classCode} for ${courseCode}?`,
      )
    ) {
      const updatedCourse = {
        ...targetCourse,
        classes: targetCourse.classes.filter((c) => c.classCode !== classCode),
      };
      onCoursesChange({ ...courses, [courseCode]: updatedCourse });
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-neutral-50 min-h-screen">
      {/* --- Header and Actions --- */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="page-title mr-auto">Gerenciamento de Disciplinas</h1>
        <div className="flex flex-wrap gap-2">
          <label className="btn-info cursor-pointer">
            Import PUC-Rio CSV
            <input
              type="file"
              accept=".csv"
              onChange={importCSV}
              className="hidden"
            />
          </label>
        </div>
        <input
          type="text"
          placeholder="Pesquisar disciplinas..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="input w-full md:w-72"
        />
      </div>

      {/* --- Add New Course Form --- */}
      <div className="card-body mb-8">
        <h3 className="section-title">Adicionar Nova Disciplina</h3>
        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Código da Disciplina (e.g., INF1007)"
              value={newCourse.code || ''}
              onChange={(e) =>
                setNewCourse((prev) => ({ ...prev, code: e.target.value }))
              }
              className="input"
            />
            <input
              placeholder="Nome da Disciplina (e.g., Programação I)"
              value={newCourse.name || ''}
              onChange={(e) =>
                setNewCourse((prev) => ({ ...prev, name: e.target.value }))
              }
              className="input"
            />
          </div>
          <PrerequisiteInput
            courses={courses}
            selected={newCourse.unidirCoRequisites || []}
            onChange={(unidirCoRequisites) =>
              setNewCourse((prev) => ({ ...prev, unidirCoRequisites }))
            }
            label="Pré-requisitos Unidirecionais"
            placeholder="Disciplinas que devem ser cursadas antes ou com esta"
          />
          <PrerequisiteInput
            courses={courses}
            selected={newCourse.bidirCoRequisites || []}
            onChange={(bidirCoRequisites) =>
              setNewCourse((prev) => ({ ...prev, bidirCoRequisites }))
            }
            label="Pré-requisitos Bidirecionais"
            placeholder="Disciplinas que devem ser cursadas com esta"
          />
          <button
            onClick={addCourse}
            className="btn-primary justify-self-start"
          >
            Adicionar Disciplina
          </button>
        </div>
      </div>

      {/* --- Courses List --- */}
      <div className="space-y-4">
        {paginatedCourses.map((course) => (
          <div key={course.code} className="card overflow-hidden">
            <div
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={() => toggleExpanded(course.code)}
            >
              <div>
                <h3 className="font-bold text-lg text-neutral-800">
                  {course.code} - {course.name}
                </h3>
                {/* Simplified and more efficient class count */}
                <p className="text-sm text-neutral-600">
                  {course.classes.length} turmas
                </p>
              </div>
              <CourseActions
                onEdit={() => setEditingCourse(course.code)}
                onDelete={() => deleteCourse(course.code)}
              />
            </div>

            {expandedCourses.has(course.code) && (
              <div className="card-footer">
                {editingCourse === course.code ? (
                  <CourseEditor
                    course={course}
                    onSave={(updated) => updateCourse(course.code, updated)}
                    onCancel={() => setEditingCourse(null)}
                    courses={courses}
                  />
                ) : (
                  <CourseView course={course} allCourses={courses} />
                )}

                <ClassSection
                  courseCode={course.code}
                  classes={course.classes} // Directly pass the nested classes
                  editingClass={editingClass}
                  onAddClass={(newClassData) =>
                    addClass(course.code, newClassData)
                  }
                  onUpdateClass={updateClass}
                  onDeleteClass={deleteClass}
                  onSetEditingClass={setEditingClass}
                  // We can still use createClassKey to identify which class is being edited
                  createClassKey={createClassKey}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- Pagination --- */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
