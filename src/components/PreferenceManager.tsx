import React, { useState, useEffect } from 'react';
import type { Preference, PreferenceSet, BasePreference, DayOfWeek } from '@/types';

// --- METADATA & CONSTANTS ---

const preferenceMetadata: Record<
  Preference['kind'],
  { name: string; description: string; icon: string }
> = {
  require_disciplinas: { name: 'Obrigar Disciplinas', description: 'Exigir a inclusão de um conjunto específico de disciplinas na grade.', icon: '📚' },
  avoid_disciplinas: { name: 'Evitar Disciplinas', description: 'Não incluir um conjunto específico de disciplinas na grade.', icon: '🚫' },
  prefer_turmas: { name: 'Preferir Turmas', description: 'Dar preferência a turmas específicas.', icon: '👍' },
  avoid_turmas: { name: 'Evitar Turmas', description: 'Evitar turmas específicas.', icon: '👎' },
  prefer_teacher: { name: 'Preferir Professor(es)', description: 'Dar preferência a turmas de professores específicos.', icon: '👨‍🏫' },
  avoid_teacher: { name: 'Evitar Professor(es)', description: 'Evitar turmas de professores específicos.', icon: '👨‍🏫' },
  time_window: { name: 'Janela de Horário', description: 'Preferir que todas as aulas ocorram dentro de uma janela de tempo específica.', icon: '⏰' },
  avoid_time_window: { name: 'Evitar Janela de Horário', description: 'Evitar aulas durante uma janela de tempo específica (ex: horário de almoço).', icon: '⏰' },
  limit_campus_days: { name: 'Limitar Dias no Campus', description: 'Limitar o número máximo de dias com aulas presenciais na semana.', icon: '📅' },
  require_free_days: { name: 'Exigir Dias Livres', description: 'Garantir que certos dias da semana não tenham aulas.', icon: '📅' },
  prefer_compact_schedule: { name: 'Preferir Grade Compacta', description: 'Priorizar grades com menos janelas entre as aulas para um horário mais compacto.', icon: '콤' },
  my_dest_codes: { name: 'Preferir Cursos/Campus', description: 'Dar preferência a turmas de cursos ou campi específicos (via código de destino).', icon: '📍' },
  credit_load: { name: 'Carga de Créditos', description: 'Definir uma faixa de créditos (mínimo e máximo) para a grade horária.', icon: '📈' },
};

// --- UTILITY FUNCTIONS ---

const generateId = (): string => `pref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;




// =================================================================================
// MAIN COMPONENT: PreferenceManager
// =================================================================================

interface PreferenceManagerProps {
  onPreferencesChange: (preferenceSet: PreferenceSet) => void;
  availableDestCodes: string[];
  availableTeachers: string[];
  availableDisciplinas: string[];
}

export function PreferenceManager({
  onPreferencesChange,
  availableDestCodes,
  availableTeachers,
  availableDisciplinas,
}: PreferenceManagerProps) {
  const [preferenceSet, setPreferenceSet] = useState<PreferenceSet>({
    id: generateId(),
    name: 'Minhas Preferências',
    description: 'Conjunto de preferências personalizado',
    preferences: [],
    globalSettings: {
      softConstraintAggregation: 'weighted_average',
      maxViolations: 0,
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    onPreferencesChange(preferenceSet);
  }, [preferenceSet, onPreferencesChange]);

  const addPreference = (preference: Preference) => {
    setPreferenceSet(prev => ({ ...prev, preferences: [...prev.preferences, preference] }));
  };

  const removePreference = (preferenceId: string) => {
    setPreferenceSet(prev => ({ ...prev, preferences: prev.preferences.filter(p => p.id !== preferenceId) }));
  };

  const togglePreference = (preferenceId: string) => {
    setPreferenceSet(prev => ({
      ...prev,
      preferences: prev.preferences.map(p =>
        p.id === preferenceId ? { ...p, enabled: !p.enabled } : p
      ),
    }));
  };

  const updatePreferenceWeight = (preferenceId: string, weight: number) => {
    setPreferenceSet(prev => ({
      ...prev,
      preferences: prev.preferences.map(p =>
        p.id === preferenceId ? { ...p, weight } : p
      ),
    }));
  };

  const clearPreferences = () => {
    if (window.confirm("Tem certeza que deseja remover todas as preferências?")) {
      setPreferenceSet(prev => ({ ...prev, preferences: [] }));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-800">Gerenciador de Preferências</h2>

      <div className="card-body">
        <h3 className="section-title">Configurações Globais</h3>
        <div className="flex flex-wrap gap-6 items-center">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            Agregação de score:
            <select
              value={preferenceSet.globalSettings.softConstraintAggregation}
              onChange={(e) => setPreferenceSet(prev => ({
                ...prev,
                globalSettings: {
                  ...prev.globalSettings,
                  softConstraintAggregation: e.target.value as 'sum' | 'weighted_average' | 'max' | 'min'
                }
              }))}
              className="select w-48"
            >
              <option value="weighted_average">Média Ponderada</option>
              <option value="sum">Soma</option>
              <option value="max">Máximo</option>
              <option value="min">Mínimo</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            Max violações (Hard):
            <input
              type="number"
              min="0"
              max="10"
              value={preferenceSet.globalSettings.maxViolations}
              onChange={(e) => setPreferenceSet(prev => ({
                ...prev,
                globalSettings: { ...prev.globalSettings, maxViolations: parseInt(e.target.value) || 0 }
              }))}
              className="input w-20"
            />
          </label>
        </div>
      </div>

      <div className="card-body">
        <h3 className="section-title">Adicionar Nova Preferência</h3>
        <AddPreferenceForm
          onAddPreference={addPreference}
          availableDisciplinas={availableDisciplinas}
          availableTeachers={availableTeachers}
          availableDestCodes={availableDestCodes}
        />
      </div>

      <div className="card-body">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-neutral-800">Preferências Ativas ({preferenceSet.preferences.length})</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="btn-secondary">
              {showAdvanced ? 'Ocultar' : 'Mostrar'} Avançado
            </button>
            <button onClick={clearPreferences} className="btn-error">
              Limpar Todas
            </button>
          </div>
        </div>

        {preferenceSet.preferences.length === 0 ? (
          <p className="text-neutral-500 italic text-sm">Nenhuma preferência configurada.</p>
        ) : (
          <div className="space-y-4">
            {preferenceSet.preferences.map(preference => (
              <PreferenceCard
                key={preference.id}
                preference={preference}
                showAdvanced={showAdvanced}
                onRemove={() => removePreference(preference.id)}
                onToggle={() => togglePreference(preference.id)}
                onWeightChange={(weight: number) => updatePreferenceWeight(preference.id, weight)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card-body">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Resumo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="font-medium text-neutral-600"><strong>Total:</strong> {preferenceSet.preferences.length}</div>
          <div className="font-medium text-neutral-600"><strong>Flexíveis:</strong> {preferenceSet.preferences.filter(p => p.type === 'soft').length}</div>
          <div className="font-medium text-neutral-600"><strong>Ativas:</strong> {preferenceSet.preferences.filter(p => p.enabled).length}</div>
        </div>
      </div>
    </div>
  );
}


// =================================================================================
// SUB-COMPONENT: AddPreferenceForm
// =================================================================================
interface AddPreferenceFormProps {
  onAddPreference: (preference: Preference) => void;
  availableDisciplinas: string[];
  availableTeachers: string[];
  availableDestCodes: string[];
}

function AddPreferenceForm({ onAddPreference, availableDisciplinas, availableTeachers, availableDestCodes }: AddPreferenceFormProps) {
  const [kind, setKind] = useState<Preference['kind']>('require_disciplinas');
  const [formData, setFormData] = useState<Partial<Preference>>({});
  const [searchTerms, setSearchTerms] = useState({ disciplinas: '', teachers: '', destCodes: '' });
  const [showHelp, setShowHelp] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'select-multiple') {
      const selectedOptions = Array.from((e.target as HTMLSelectElement).selectedOptions).map(opt => opt.value);
      setFormData({ ...formData, [name]: selectedOptions });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchTerms(prev => ({ ...prev, [name]: value.toLowerCase() }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const basePreference: BasePreference = {
      id: generateId(),
      enabled: true,
      type: 'type' in formData ? formData.type as 'soft' | 'hard' : 'soft',
      weight: 'weight' in formData ? parseInt(String(formData.weight), 10) : 5,
    };

    let newPreference: Preference | null = null;
    const { name, description } = preferenceMetadata[kind];

    // FIXED: Correctly constructs the preference object based on the 'kind'
    // ensuring type safety and providing default values for optional fields.
    switch (kind) {
      case 'require_disciplinas':
      case 'avoid_disciplinas':
        newPreference = { ...basePreference, kind, name, description, disciplinaCodes: (formData as any).disciplinaCodes || [] };
        break;
      case 'prefer_teacher':
      case 'avoid_teacher':
        newPreference = { ...basePreference, kind, name, description, teacherNames: (formData as any).teacherNames || [] };
        break;
      case 'time_window':
      case 'avoid_time_window':
        newPreference = { ...basePreference, kind, name, description, days: (formData as any).days || [], startHour: parseInt((formData as any).startHour, 10) || 8, endHour: parseInt((formData as any).endHour, 10) || 18 };
        break;
      case 'limit_campus_days':
        newPreference = { ...basePreference, kind, name, description, maxDays: parseInt((formData as any).maxDays, 10) || 3 };
        break;
      case 'require_free_days':
        newPreference = { ...basePreference, kind, name, description, days: (formData as any).days || [] };
        break;
      case 'my_dest_codes':
        newPreference = { ...basePreference, kind, name, description, destCodes: (formData as any).destCodes || [] };
        break;
      case 'credit_load':
        newPreference = { ...basePreference, kind, name, description, min: parseInt((formData as any).min, 10) || undefined, max: parseInt((formData as any).max, 10) || undefined };
        break;
      case 'prefer_compact_schedule':
        newPreference = { ...basePreference, kind, name, description };
        break;
      // 'prefer_turmas' and 'avoid_turmas' are complex and omitted from the form for simplicity
      default:
        // This ensures we handle all cases, even if it's just to do nothing.
        break;
    }

    if (newPreference) {
      onAddPreference(newPreference);
      setFormData({});
      setSearchTerms({ disciplinas: '', teachers: '', destCodes: '' });
    }
  };

  const renderFormFields = () => {
    const filteredDisciplinas = availableDisciplinas.filter(d => d.toLowerCase().includes(searchTerms.disciplinas));
    const filteredTeachers = availableTeachers.filter(t => t.toLowerCase().includes(searchTerms.teachers));
    const filteredDestCodes = availableDestCodes.filter(d => d.toLowerCase().includes(searchTerms.destCodes));

    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-4">
          <select name="type" onChange={handleInputChange} className="input" value={formData.type || 'soft'}>
            <option value="soft">Flexível (Soft)</option>
            <option value="hard">Obrigatória (Hard)</option>
          </select>
          {formData.type !== 'hard' && (
            <input type="number" name="weight" placeholder="Peso (1-10)" min="1" max="10" onChange={handleInputChange} className={`input w-32`} value={String(formData.weight || '5')} />
          )}
        </div>
        
        {/* FIXED: All form fields are now implemented */}
        {(kind === 'require_disciplinas' || kind === 'avoid_disciplinas') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Disciplinas</label>
            <input name="disciplinas" placeholder="Buscar Disciplina..." onChange={handleSearchChange} value={searchTerms.disciplinas} className="input" />
            <select multiple name="disciplinaCodes" onChange={handleInputChange} className={`input h-32`} value={(formData as any).disciplinaCodes || []}>
              {filteredDisciplinas.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        {(kind === 'prefer_teacher' || kind === 'avoid_teacher') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Professores</label>
            <input name="teachers" placeholder="Buscar Professor..." onChange={handleSearchChange} value={searchTerms.teachers} className="input" />
            <select multiple name="teacherNames" onChange={handleInputChange} className={`input h-32`} value={(formData as any).teacherNames || []}>
              {filteredTeachers.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        
        {(kind === 'time_window' || kind === 'avoid_time_window' || kind === 'require_free_days') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Dias da Semana</label>
              <select multiple name="days" onChange={handleInputChange} className={`input h-32`} value={(formData as any).days || []}>
                <option value="segunda">Segunda</option>
                <option value="terça">Terça</option>
                <option value="quarta">Quarta</option>
                <option value="quinta">Quinta</option>
                <option value="sexta">Sexta</option>
                <option value="sábado">Sábado</option>
              </select>
            </div>
        )}

        {(kind === 'time_window' || kind === 'avoid_time_window') && (
            <div className="grid grid-cols-2 gap-4">
                <input type="number" name="startHour" placeholder="Hora Início (ex: 8)" min="0" max="23" onChange={handleInputChange} className="input" value={(formData as any).startHour || ''}/>
                <input type="number" name="endHour" placeholder="Hora Fim (ex: 18)" min="1" max="24" onChange={handleInputChange} className="input" value={(formData as any).endHour || ''}/>
            </div>
        )}

        {kind === 'limit_campus_days' && (
            <input type="number" name="maxDays" placeholder="Máximo de dias no campus" min="1" max="6" onChange={handleInputChange} className="input" value={(formData as any).maxDays || ''}/>
        )}

        {kind === 'my_dest_codes' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Códigos de Destino</label>
            <input name="destCodes" placeholder="Buscar Código..." onChange={handleSearchChange} value={searchTerms.destCodes} className="input" />
            <select multiple name="destCodes" onChange={handleInputChange} className={`input h-32`} value={(formData as any).destCodes || []}>
              {filteredDestCodes.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        {kind === 'credit_load' && (
          <div className="grid grid-cols-2 gap-4">
            <input type="number" name="min" placeholder="Mín. Créditos" onChange={handleInputChange} className="input" value={(formData as any).min || ''} />
            <input type="number" name="max" placeholder="Máx. Créditos" onChange={handleInputChange} className="input" value={(formData as any).max || ''}/>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <select value={kind} onChange={e => { setKind(e.target.value as Preference['kind']); setFormData({}); }} className={`input flex-1`}>
          {Object.entries(preferenceMetadata)
            // Hiding turma preferences from form as they are too complex for this UI
            .filter(([key]) => !['prefer_turmas', 'avoid_turmas'].includes(key))
            .map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
        </select>
        <button type="button" onClick={() => setShowHelp(true)} className={`btn-secondary px-3`} title="Saiba mais sobre os tipos de preferência">?</button>
      </div>
      {showHelp && <PreferenceHelpModal onClose={() => setShowHelp(false)} />}
      {renderFormFields()}
      <button type="submit" className={`btn-primary w-full`}>Adicionar Preferência</button>
    </form>
  );
}


// =================================================================================
// SUB-COMPONENT: PreferenceCard & Details
// =================================================================================

function renderPreferenceDetails(preference: Preference) {
    const detailsClass = 'text-sm text-neutral-600';
    const highlightClass = 'font-semibold text-neutral-700';
    const dayMap: Record<DayOfWeek, string> = { segunda: 'Seg', terça: 'Ter', quarta: 'Qua', quinta: 'Qui', sexta: 'Sex', sábado: 'Sáb' };

    // FIXED: Fully implemented details rendering for all preference types.
    switch (preference.kind) {
        case 'require_disciplinas':
        case 'avoid_disciplinas':
            if (!preference.disciplinaCodes || preference.disciplinaCodes.length === 0) return null;
            return <div className={detailsClass}><strong>Disciplinas:</strong> <span className={highlightClass}>{preference.disciplinaCodes.join(', ')}</span></div>;
        case 'prefer_turmas':
        case 'avoid_turmas':
            if (!preference.turmas || preference.turmas.length === 0) return null;
            return <div className={detailsClass}><strong>Turmas:</strong> <span className={highlightClass}>{preference.turmas.map(t => `${t.disciplinaCode}-${t.turmaCode}`).join(', ')}</span></div>;
        case 'prefer_teacher':
        case 'avoid_teacher':
            if (!preference.teacherNames || preference.teacherNames.length === 0) return null;
            return <div className={detailsClass}><strong>Professores:</strong> <span className={highlightClass}>{preference.teacherNames.join(', ')}</span></div>;
        case 'time_window':
        case 'avoid_time_window':
            if (!preference.days || preference.days.length === 0) return null;
            return <div className={detailsClass}><strong>Dias:</strong> <span className={highlightClass}>{preference.days.map(d => dayMap[d]).join(', ')}</span> | <strong>Horário:</strong> <span className={highlightClass}>{preference.startHour}:00 - {preference.endHour}:00</span></div>;
        case 'limit_campus_days':
            return <div className={detailsClass}>Máximo de <span className={highlightClass}>{preference.maxDays}</span> dias no campus.</div>;
        case 'require_free_days':
            if (!preference.days || preference.days.length === 0) return null;
            return <div className={detailsClass}><strong>Dias livres:</strong> <span className={highlightClass}>{preference.days.map(d => dayMap[d]).join(', ')}</span></div>;
        case 'my_dest_codes':
            if (!preference.destCodes || preference.destCodes.length === 0) return null;
            return <div className={detailsClass}><strong>Códigos de destino:</strong> <span className={highlightClass}>{preference.destCodes.join(', ')}</span></div>;
        case 'credit_load':
            if (!preference.min && !preference.max) return null;
            return <div className={detailsClass}><strong>Carga de créditos:</strong> Mín: <span className={highlightClass}>{preference.min ?? 'N/A'}</span>, Máx: <span className={highlightClass}>{preference.max ?? 'N/A'}</span></div>;
        case 'prefer_compact_schedule':
            return <div className={detailsClass}>Priorizar grades com menos janelas entre as aulas.</div>;
        default:
            return null;
    }
}

function PreferenceCard({ preference, showAdvanced, onRemove, onToggle, onWeightChange }: { preference: Preference; showAdvanced: boolean; onRemove: () => void; onToggle: () => void; onWeightChange: (weight: number) => void; }) {
  const typeClasses = {
    hard: 'border-red-500 bg-error-50 text-error-800',
    soft: 'border-blue-500 bg-primary-50 text-primary-800',
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${typeClasses[preference.type]} ${preference.enabled ? 'opacity-100' : 'opacity-60'} transition-opacity`}>
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{preferenceMetadata[preference.kind]?.icon || '❓'}</span>
            <strong className="text-lg font-semibold text-neutral-800 truncate">{preference.name}</strong>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${preference.type === 'hard' ? 'bg-error-500' : 'bg-primary-500'}`}>{preference.type.toUpperCase()}</span>
          </div>
          {renderPreferenceDetails(preference)}
          {showAdvanced && <div className="text-xs text-neutral-500 mt-3"><strong>ID:</strong> {preference.id.slice(-8)}</div>}
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {preference.type === 'soft' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-700">Peso:</span>
              <input type="range" min="1" max="10" value={preference.weight} onChange={e => onWeightChange(parseInt(e.target.value))} className="w-24 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              <span className="text-sm font-semibold w-6 text-center text-neutral-700">{preference.weight}</span>
            </div>
          )}
          <button onClick={onToggle} className={`px-3 py-1 text-sm font-medium rounded-md w-24 transition-colors ${preference.enabled ? 'bg-success-600 text-white hover:bg-success-700' : 'bg-neutral-300 text-neutral-800 hover:bg-neutral-400'}`}>{preference.enabled ? 'Ativo' : 'Inativo'}</button>
          <button onClick={onRemove} className="px-3 py-1 text-sm font-medium text-error-600 bg-error-100 rounded-md hover:bg-error-200">Remover</button>
        </div>
      </div>
    </div>
  );
}


// =================================================================================
// SUB-COMPONENT: PreferenceHelpModal
// =================================================================================

function PreferenceHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className={`card w-full max-w-2xl max-h-[80vh] overflow-y-auto`}>
        <div className="flex justify-between items-center border-b border-neutral-200 pb-3 mb-4">
          <h3 className="text-xl font-semibold text-neutral-800">Ajuda: Tipos de Preferência</h3>
          <button onClick={onClose} className="btn-secondary">Fechar</button>
        </div>
        <div className="space-y-4">
          {Object.values(preferenceMetadata).map(({ name, description, icon }) => (
            <div key={name} className="border-b border-neutral-200 pb-3 last:border-b-0">
              <strong className="flex items-center gap-2 text-lg text-neutral-900"><span className="text-2xl">{icon}</span>{name}</strong>
              <p className="mt-1 text-neutral-600 text-sm">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
