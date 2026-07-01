export const ROADMAP_TYPES = [
    {
        id: 'saas',
        label: 'SaaS',
        shortLabel: 'SaaS',
        tagline: 'Produto digital para clínicas e operadoras',
        description: 'Prioridades da plataforma Aleevia — cadastro, faturamento, conciliação, antecipação e IA financeira.',
        highlights: ['Matriz por módulo e prioridade', 'Board de desenvolvimento', 'Métricas de adoção e negócio'],
        color: '#6e47c9',
        wash: '#f0eafb',
        icon: 'pi pi-cloud'
    },
    {
        id: 'interno',
        label: 'Interno',
        shortLabel: 'Interno',
        tagline: 'Ferramentas e processos da equipe',
        description: 'O que estamos construindo por dentro — infraestrutura, automações, dados e melhoria de processos.',
        highlights: ['Infraestrutura e ferramentas', 'Automações internas', 'Indicadores e BI'],
        color: '#1e4fe0',
        wash: '#eef2fe',
        icon: 'pi pi-building'
    },
    {
        id: 'bpo',
        label: 'BPO',
        shortLabel: 'BPO',
        tagline: 'Operação e entrega para clientes',
        description: 'Roadmap do serviço gerenciado — faturamento, conciliação, glosas, qualidade e relacionamento.',
        highlights: ['Operação e filas de trabalho', 'Qualidade e conformidade TISS', 'Relacionamento com clientes'],
        color: '#0e9e92',
        wash: '#e4f5f2',
        icon: 'pi pi-briefcase'
    }
];

export const DEFAULT_ROADMAP_TYPE = 'saas';

export function isRoadmapType(value) {
    return ROADMAP_TYPES.some((type) => type.id === value);
}

export function parseRoadmapType(value) {
    return isRoadmapType(value) ? value : DEFAULT_ROADMAP_TYPE;
}

export function getRoadmapTypeMeta(type) {
    return ROADMAP_TYPES.find((entry) => entry.id === parseRoadmapType(type)) ?? ROADMAP_TYPES[0];
}

export function parseRoadmapTypeFromPath(path = '') {
    const match = path.match(/^\/roadmap\/([^/]+)/);
    return parseRoadmapType(match?.[1]);
}

export function roadmapMatrixPath(type) {
    return `/roadmap/${parseRoadmapType(type)}`;
}

export function roadmapDevPath(type) {
    return `/roadmap/${parseRoadmapType(type)}/desenvolvimento`;
}
