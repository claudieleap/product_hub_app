/**
 * Configuração da área Comercial: pipeline de prospecção de clínicas/prestadores
 * credenciados (base Sulamérica, Vale do Paraíba) e dashboard de quantidade.
 */

export const COMMERCIAL_PIPELINE_PATH = '/comercial/pipeline';
export const COMMERCIAL_DASHBOARD_PATH = '/comercial/dashboard';
export const COMMERCIAL_CALENDAR_PATH = '/comercial/calendario';

/** Estágios fixos do funil comercial (mesmos nomes do board de referência). */
export const COMMERCIAL_STAGES = [
    { id: 'inbox', title: 'Leads', hint: 'A qualificar' },
    { id: 'qualificado', title: 'Primeiro Contato', hint: '' },
    { id: 'fremium_aceito', title: 'Reunião Agendada', hint: '' },
    { id: 'proposta_apresentada', title: 'Proposta Apresentada', hint: '' },
    { id: 'onboardado_fremium', title: 'Convertido', hint: '' },
    { id: 'concluido', title: 'Concluído', hint: '' },
    { id: 'levantada_mao', title: 'Perdido', hint: '' }
];

export function getStageMeta(id) {
    return COMMERCIAL_STAGES.find((stage) => stage.id === id) ?? COMMERCIAL_STAGES[0];
}
