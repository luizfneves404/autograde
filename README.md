# Autograde

## Guidelines

- Maximally expressive business logic (fat, pure, testable).
- Minimal infra — ideally no server-side code, no serverless.
- Frontend-only deployment (e.g. GitHub Pages).
- Testability with end-to-end tests.
- Features and efficiency is more important than UI prettiness. Minimal CSS.
- Type safety always and everywhere.

## Regras de negócio

Não vou modelar pré-requisitos porque seria muito complicado digitar de cada disciplina. Em vez disso, marque a disciplina como "posso puxar" se você já cumpriu os pré-requisitos.

// do not use this below, leave as comment
// export const PreferenceMeta = {
// require_disciplinas: {
// name: "Obrigar Disciplinas",
// icon: "�",
// description: "Exigir a inclusão de um conjunto específico de disciplinas na grade. Todas devem estar presentes na grade para a preferência ser satisfeita."
// },
// avoid_disciplinas: {
// name: "Evitar Disciplinas",
// icon: "🚫",
// description: "Não incluir um conjunto específico de disciplinas na grade. Se qualquer uma delas estiver presente na grade, a preferência não é satisfeita."
// },
// require_teacher: {
// name: "Obrigar Professor(es)",
// icon: "👨‍🏫",
// description: "Exigir a presença de um conjunto específico de professores na grade. Todos os professores devem estar presentes na grade para a preferência ser satisfeita."
// },
// avoid_teacher: {
// name: "Evitar Professor(es)",
// icon: "👨‍🏫",
// description: "Não incluir um conjunto específico de professores na grade. Se qualquer um deles estiver presente na grade, a preferência não é satisfeita."
// },
// time_window: {
// name: "Janela de Horário",
// icon: "⏰",
// description: "Preferir que todas as aulas ocorram dentro de uma janela de tempo específica. Se qualquer uma das aulas estiver fora dessa janela, a preferência não é satisfeita."
// },
// avoid_time_window: {
// name: "Evitar Janela de Horário",
// icon: "⏰",
// description: "Evitar aulas durante uma janela de tempo específica (ex: horário de almoço). Se qualquer uma das aulas estiver dentro dessa janela, a preferência não é satisfeita."
// },
// limit_campus_days: {
// name: "Limitar Dias no Campus",
// icon: "📅",
// description: "Especificar quais dias da semana podem ter aulas presenciais. Se qualquer aula na grade ocorrer fora desses dias, a preferência não é satisfeita."
// },
// require_free_days: {
// name: "Exigir Dias Livres",
// icon: "📅",
// description: "Garantir que certos dias da semana não tenham aulas. Se qualquer um desses dias tiver aulas, a preferência não é satisfeita."
// },
// prefer_compact_schedule: {
// name: "Preferir Grade Compacta",
// icon: "🏠",
// description: "Priorizar grades com menos janelas entre as aulas para um horário mais compacto. Quanto mais buracos, pior a nota da grade (peso da preferência determina o quanto penaliza)."
// },
// limit_dest_codes: {
// name: "Limitar Códigos de Destino",
// icon: "🎯",
// description: "Todas as turmas da grade devem ter um código de destino dentre os especificados. Se qualquer uma das turmas tiver um outro código de destino, a preferência não é satisfeita."
// },
// credit_load: {
// name: "Carga de Créditos",
// icon: "⚖️",
// description: "Definir uma faixa de créditos (mínimo e máximo) para a grade horária. Se a carga de créditos da grade não estiver dentro da faixa especificada, a preferência não é satisfeita."
// }
// } as const;

// export type PreferenceKind = keyof typeof PreferenceMeta;

// do not use this below, leave as comment
// export type PreferenceData =
// | { kind: 'require_disciplinas'; disciplinaCodes: string[] }
// | { kind: 'avoid_disciplinas'; disciplinaCodes: string[] }
// | { kind: 'require_teacher'; professorNames: string[] }
// | { kind: 'avoid_teacher'; professorNames: string[] }
// | { kind: 'time_window'; days: DayOfWeek[]; startHour: number; endHour: number }
// | { kind: 'avoid_time_window'; days: DayOfWeek[]; startHour: number; endHour: number }
// | { kind: 'limit_campus_days'; days: DayOfWeek[] }
// | { kind: 'require_free_days'; days: DayOfWeek[] }
// | { kind: 'prefer_compact_schedule' }
// | { kind: 'limit_dest_codes'; destCodes: string[] }
// | { kind: 'credit_load'; min?: number; max?: number };

// export type Preference = PreferenceData & BasePreference;

// export interface PreferenceSet {
// constraints: ExprNode[]
// }

/\*\*

- Generates a human-readable description from form data.
  \*/
  function generateDescription(kind: PreferenceTemplateKind, data: any): string {
  const dayMap: Record<DayOfWeek, string> = { segunda: 'Seg', terça: 'Ter', quarta: 'Qua', quinta: 'Qui', sexta: 'Sex', sábado: 'Sáb' };
  const formatDays = (days: DayOfWeek[] = []) => days.map(d => dayMap[d]).join(', ');

      switch (kind) {
          case 'require_disciplinas': return `Obrigar: ${data.disciplinaCodes?.join(', ') || ''}`;
          case 'avoid_disciplinas':   return `Evitar: ${data.disciplinaCodes?.join(', ') || ''}`;
          case 'require_teacher':     return `Obrigar prof.: ${data.professorNames?.join(', ') || ''}`;
          case 'avoid_teacher':       return `Evitar prof.: ${data.professorNames?.join(', ') || ''}`;
          case 'time_window':         return `Das ${data.startHour}:00 às ${data.endHour}:00 em: ${formatDays(data.days)}`;
          case 'avoid_time_window':   return `Evitar das ${data.startHour}:00 às ${data.endHour}:00 em: ${formatDays(data.days)}`;
          case 'require_free_days':   return `Dias livres: ${formatDays(data.days)}`;
          case 'credit_load':         return `Créditos: Mín ${data.min ?? 'N/A'}, Máx ${data.max ?? 'N/A'}`;
          default: return PreferenceTemplateMeta[kind]?.description || 'Constraint customizada.';
      }

  }
