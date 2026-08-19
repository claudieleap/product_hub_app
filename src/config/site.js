import { ROADMAP_TYPES } from '@/config/roadmapTypes';
import { ENTREGAS_PATH, roadmapDevPath, roadmapMatrixPath } from '@/config/roadmapTypes';
import { ONBOARDING_PATH } from '@/config/onboardingConfig';
import { COMMERCIAL_PIPELINE_PATH, COMMERCIAL_DASHBOARD_PATH, COMMERCIAL_CALENDAR_PATH } from '@/config/commercialConfig';

export const siteTitle = 'Product Hub';
export const siteDescription = 'Roadmaps SaaS, Interno e BPO — estratégia Aleevia';

/** Início fica solto no topo do menu, fora dos grupos Produto/Comercial. */
export const homeNavItem = { text: 'Início', link: '/', match: /^\/$/, icon: 'pi pi-home' };

/**
 * Navegação global agrupada em duas áreas:
 * - Produto: entregas e matrizes de roadmap (SaaS / Interno / BPO), métricas, contas.
 * - Comercial: onboarding de clínicas e prospecção (pipeline + dashboard).
 */
export const navGroups = [
    {
        text: 'Produto',
        items: [
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
        ]
    },
    {
        text: 'Comercial',
        items: [
            {
                text: 'Onboarding',
                link: ONBOARDING_PATH,
                match: /^\/onboarding/,
                icon: 'pi pi-building-columns'
            },
            {
                text: 'Pipeline',
                link: COMMERCIAL_PIPELINE_PATH,
                match: /^\/comercial\/pipeline/,
                icon: 'pi pi-filter'
            },
            {
                text: 'Dashboard',
                link: COMMERCIAL_DASHBOARD_PATH,
                match: /^\/comercial\/dashboard/,
                icon: 'pi pi-chart-pie'
            },
            {
                text: 'Calendário',
                link: COMMERCIAL_CALENDAR_PATH,
                match: /^\/comercial\/calendario/,
                icon: 'pi pi-calendar'
            }
        ]
    }
];

/** Navegação global achatada — mantida para quem só precisa da lista de links. */
export const nav = [homeNavItem, ...navGroups.flatMap((group) => group.items)];

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
