import { useState } from 'react';
import type {
  ClassIdentifier,
  ClassOffering,
  ClassOfferingIdentifier,
  CourseClass,
} from '@/types';
import { ClassView } from '@/components/ClassView';
import { ClassEditor } from '@/components/ClassEditor';
import { AddClassForm } from '@/components/AddClassForm';
import { ClassActions } from '@/components/ClassActions';
import OfferingEditor from '@/components/OfferingEditor';

// Props are updated to use typed identifiers instead of string keys.
interface ClassSectionProps {
  courseCode: string;
  classes: CourseClass[];
  editingClassId: ClassIdentifier | null;
  onAddClass: (newClassData: Omit<CourseClass, 'courseCode'>) => void;
  onUpdateClass: (classId: ClassIdentifier, updatedData: CourseClass) => void;
  onDeleteClass: (classId: ClassIdentifier) => void;
  onSetEditingClass: (classId: ClassIdentifier | null) => void;
  onAddOffering: (
    classId: ClassIdentifier,
    newOfferingData: Omit<ClassOffering, 'courseCode' | 'classCode'>,
  ) => void;
  onUpdateOffering: (
    offeringId: ClassOfferingIdentifier,
    updatedData: Partial<Pick<ClassOffering, 'vacancyCount'>>,
  ) => void;
  onDeleteOffering: (offeringId: ClassOfferingIdentifier) => void;
}

export function ClassSection({
  courseCode,
  classes,
  editingClassId,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onSetEditingClass,
  onAddOffering,
  onUpdateOffering,
  onDeleteOffering,
}: ClassSectionProps) {
  // Local state to manage which offering is currently being edited.
  const [editingOfferingId, setEditingOfferingId] =
    useState<ClassOfferingIdentifier | null>(null);

  return (
    <div className="mt-6 pl-4 border-l-2 border-neutral-200">
      <h4 className="section-title">Turmas de {courseCode}</h4>

      <AddClassForm onAddClass={onAddClass} />

      <div className="space-y-4 mt-4">
        {classes.length === 0 ? (
          <div className="text-center text-neutral-500 p-4 bg-neutral-100 rounded-md">
            Nenhuma turma cadastrada para esta disciplina.
          </div>
        ) : (
          classes.map((courseClass) => {
            const currentClassId: ClassIdentifier = {
              courseCode: courseClass.courseCode,
              classCode: courseClass.classCode,
            };
            const isEditingClass =
              editingClassId?.classCode === currentClassId.classCode &&
              editingClassId?.courseCode === currentClassId.courseCode;

            return (
              <div
                key={currentClassId.classCode}
                className="p-4 bg-white rounded-lg shadow-sm border border-neutral-200"
              >
                {isEditingClass ? (
                  <ClassEditor
                    courseClass={courseClass}
                    onSave={(updated) => {
                      onUpdateClass(currentClassId, updated);
                    }}
                    onCancel={() => {
                      onSetEditingClass(null);
                    }}
                  />
                ) : (
                  <>
                    {/* Class Details and Actions */}
                    <div className="flex justify-between items-start">
                      <ClassView courseClass={courseClass} />
                      <ClassActions
                        onEdit={() => {
                          onSetEditingClass(currentClassId);
                        }}
                        onDelete={() => {
                          onDeleteClass(currentClassId);
                        }}
                      />
                    </div>

                    {/* Offerings Management Section */}
                    <div className="mt-4 pt-3 border-t border-neutral-200">
                      <h5 className="font-semibold text-sm text-neutral-700 mb-2">
                        Oferta de Vagas
                      </h5>
                      <div className="space-y-2">
                        {courseClass.offerings.map((offering) => {
                          const currentOfferingId: ClassOfferingIdentifier = {
                            ...currentClassId,
                            destCode: offering.destCode,
                          };
                          const isEditingOffering =
                            editingOfferingId?.destCode ===
                              currentOfferingId.destCode &&
                            editingOfferingId?.classCode ===
                              currentOfferingId.classCode;

                          return (
                            <div key={offering.destCode}>
                              {isEditingOffering ? (
                                <OfferingEditor
                                  offering={offering}
                                  onSave={(updatedData) => {
                                    onUpdateOffering(
                                      currentOfferingId,
                                      updatedData,
                                    );
                                    setEditingOfferingId(null); // Exit edit mode on save
                                  }}
                                  onCancel={() => {
                                    setEditingOfferingId(null);
                                  }}
                                />
                              ) : (
                                <div className="flex justify-between items-center p-2 bg-neutral-50 rounded-md">
                                  <p className="text-sm">
                                    <span className="font-medium text-neutral-800">
                                      {offering.destCode}:
                                    </span>{' '}
                                    {offering.vacancyCount} vagas
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingOfferingId(currentOfferingId);
                                      }}
                                      className="btn btn-sm btn-primary"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => {
                                        onDeleteOffering(currentOfferingId);
                                      }}
                                      className="btn btn-sm btn-error"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add New Offering Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const destCode = formData.get('destCode') as string;
                          const vacancyCount = parseInt(
                            formData.get('vacancyCount') as string,
                            10,
                          );

                          if (destCode?.trim() && !isNaN(vacancyCount)) {
                            onAddOffering(currentClassId, {
                              destCode: destCode.trim().toUpperCase(),
                              vacancyCount,
                            });
                            e.currentTarget.reset();
                          }
                        }}
                        className="mt-3 flex items-center gap-2"
                      >
                        <input
                          name="destCode"
                          placeholder="Código Destino"
                          className="input w-24"
                          required
                        />
                        <input
                          name="vacancyCount"
                          type="number"
                          placeholder="Vagas"
                          className="input w-24"
                          required
                        />
                        <button
                          type="submit"
                          className="btn btn-sm btn-secondary"
                        >
                          Adicionar
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
