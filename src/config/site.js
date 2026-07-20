import { ROADMAP_TYPES } from '@/config/roadmapTypes';
import { ENTREGAS_PATH, roadmapDevPath, roadmapMatrixPath } from '@/config/roadmapTypes';
import { ONBOARDING_PATH } from '@/config/onboardingConfig';

export const siteTitle = 'Product Hub';
export const siteDescription = 'Roadmaps SaaS, Interno e BPO — estratégia Aleevia';

/** Navegação global: tipo de roadmap (único lugar para trocar SaaS / Interno / BPO). */
export const nav = [
    { text: 'Início', link: '/', match: /^\/$/, icon: 'pi pi-home' },
    {
        text: 'Entregas',
        link: ENTREGAS_PATH,
        match: /^\/entregas$/,
        icon: 'pi pi-send',
        featured: true
    },
    ...ROADMAP_TYPES.map((type) => ({
        text: type.label,
        link: roadmapMatrixPath(type.id),
        match: new RegExp(`^/roadmap/${type.id}`),
        icon: type.icon
    })),
    {
        text: 'Onboarding',
        link: ONBOARDING_PATH,
        match: /^\/onboarding/,
        icon: 'pi pi-building-columns'
    },
    {
        text: 'Métricas',
        link: '/configuracoes/metricas',
        match: /^\/configuracoes\/metricas$/,
        icon: 'pi pi-chart-bar'
    },
    {
        text: 'Contas',
        link: '/configuracoes/contas',
        match: /^\/configuracoes\/contas$/,
        icon: 'pi pi-users',
        adminOnly: true
    }
];

const devStatusGroup = (type) => ({
    text: 'Status',
    items: [
        { text: 'A fazer', link: `${roadmapDevPath(type)}#dev-a_fazer` },
        { text: 'Em andamento', link: `${roadmapDevPath(type)}#dev-em_andamento` },
        { text: 'Concluído', link: `${roadmapDevPath(type)}#dev-concluido` }
    ]
});

export function resolveSidebar(path) {
    const match = path.match(/^\/roadmap\/([^/]+)(?:\/desenvolvimento)?/);
    if (!match) return null;

    const type = match[1];

    if (path.includes('/desenvolvimento')) {
        return [devStatusGroup(type)];
    }

    return [];
}

export function isNavActive(item, path) {
    return item.match?.test(path) ?? path === item.link;
}
