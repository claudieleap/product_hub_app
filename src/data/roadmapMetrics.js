/**
 * Métricas de sucesso para itens do roadmap — foco em produto e negócio Aleevia.
 * Agrupadas por área operacional, não por hipótese do board PMF.
 */

export const ROADMAP_METRIC_GROUPS = [
    {
        id: 'adocao',
        label: 'Adoção & uso',
        metrics: [
            { id: 'rm-m-adocao-onboarding', label: 'Onboarding concluído' },
            { id: 'rm-m-adocao-1a-conciliacao', label: 'Tempo até primeira conciliação' },
            { id: 'rm-m-adocao-mau', label: 'Usuários ativos semanais (WAU — clínica)' },
            { id: 'rm-m-adocao-portal', label: 'Profissionais no portal' }
        ]
    },
    {
        id: 'conciliacao',
        label: 'Conciliação',
        metrics: [
            { id: 'rm-m-conc-tempo', label: 'Tempo de conciliação' },
            { id: 'rm-m-conc-match', label: 'Match automático faturado × recebido' },
            { id: 'rm-m-conc-gap', label: 'Gap faturado × pago (diferença não conciliada)' },
            { id: 'rm-m-conc-dashboard', label: 'Uso do dashboard financeiro' }
        ]
    },
    {
        id: 'recebimento',
        label: 'Recebimento & faturamento',
        metrics: [
            { id: 'rm-m-rec-imports', label: 'Importações processadas por mês' },
            { id: 'rm-m-rec-sla', label: 'Tempo upload → conciliação' },
            { id: 'rm-m-rec-operadoras', label: 'Operadoras com retorno ativo' }
        ]
    },
    {
        id: 'glosas',
        label: 'Glosas',
        metrics: [
            { id: 'rm-m-glo-taxa', label: 'Taxa de glosa' },
            { id: 'rm-m-glo-recuperado', label: 'Valor recuperado por mês' },
            { id: 'rm-m-glo-pendentes', label: 'Glosas pendentes de recurso' }
        ]
    },
    {
        id: 'antecipacao',
        label: 'Antecipação',
        metrics: [
            { id: 'rm-m-ant-clinicas', label: 'Clínicas que anteciparam' },
            { id: 'rm-m-ant-profissionais', label: 'Profissionais que anteciparam' },
            { id: 'rm-m-ant-volume', label: 'Volume antecipado' },
            { id: 'rm-m-ant-recorrencia', label: 'Recorrência de antecipação' },
            { id: 'rm-m-ant-elegivel', label: '% do elegível utilizado (recebíveis disponíveis)' },
            { id: 'rm-m-ant-retencao', label: 'Retenção: quem antecipa × quem não' }
        ]
    },
    {
        id: 'portal',
        label: 'Portal do Médico',
        metrics: [
            { id: 'rm-m-portal-ativos', label: 'Profissionais ativos no portal' },
            { id: 'rm-m-portal-extrato', label: 'Acessos semanais ao extrato' }
        ]
    },
    {
        id: 'negocio',
        label: 'Negócio & retenção',
        metrics: [
            { id: 'rm-m-neg-grr', label: 'GRR (retenção de receita)' },
            { id: 'rm-m-neg-nrr', label: 'NRR (retenção líquida de receita)' },
            { id: 'rm-m-neg-dso', label: 'DSO (dias de recebimento)' },
            { id: 'rm-m-neg-expand', label: 'SaaS → BPO (migração para back-office gerenciado)' },
            { id: 'rm-m-neg-pmf', label: 'Muito decepcionado sem a Aleevia (teste Sean Ellis)' },
            { id: 'rm-m-neg-margem-bpo', label: 'Margem do BPO (back-office gerenciado)' }
        ]
    }
];

export const ROADMAP_METRICS = ROADMAP_METRIC_GROUPS.flatMap((group) =>
    group.metrics.map((metric) => ({
        ...metric,
        groupId: group.id,
        groupLabel: group.label
    }))
);

export const ROADMAP_METRICS_GROUPED = ROADMAP_METRIC_GROUPS.map((group) => ({
    label: group.label,
    items: group.metrics.map(({ id, label }) => ({ id, label }))
}));

/** IDs antigos do board PMF (H1-0 …) → métrica atual do roadmap */
const LEGACY_METRIC_ALIASES = {
    'H2-0': 'rm-m-conc-tempo',
    'H2-1': 'rm-m-neg-pmf',
    'H3-0': 'rm-m-glo-taxa',
    'H3-1': 'rm-m-neg-dso',
    'H4-0': 'rm-m-neg-pmf',
    'H4-1': 'rm-m-neg-grr',
    'H5-0': 'rm-m-neg-margem-bpo',
    'H7-0': 'rm-m-neg-expand',
    'H7-1': 'rm-m-neg-nrr',
    'H7-2': 'rm-m-ant-clinicas',
    'H7-3': 'rm-m-ant-clinicas',
    'H7-4': 'rm-m-ant-profissionais',
    'H7-5': 'rm-m-ant-profissionais',
    'H7-6': 'rm-m-ant-recorrencia',
    'H7-7': 'rm-m-ant-recorrencia',
    'H8-0': 'rm-m-ant-clinicas',
    'H8-1': 'rm-m-ant-retencao',
    'H9-0': 'rm-m-ant-profissionais',
    'H9-1': 'rm-m-ant-volume'
};

function resolveMetricId(id) {
    return LEGACY_METRIC_ALIASES[id] ?? id;
}

export function getMetricById(id) {
    const resolved = resolveMetricId(id);
    return ROADMAP_METRICS.find((metric) => metric.id === resolved) ?? null;
}

export function getMetricLabels(ids = []) {
    const seen = new Set();
    const labels = [];

    for (const id of ids) {
        const label = getMetricById(id)?.label;
        if (label && !seen.has(label)) {
            seen.add(label);
            labels.push(label);
        }
    }

    return labels;
}
