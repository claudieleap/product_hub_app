import { ROADMAP_TYPES } from '@/config/roadmapTypes';
import { roadmapDevPath, roadmapMatrixPath } from '@/config/roadmapTypes';

export const siteTitle = 'Product Hub';
export const siteDescription = 'Roadmaps SaaS, Interno e BPO — estratégia Aleevia';

/** Navegação global: tipo de roadmap (único lugar para trocar SaaS / Interno / BPO). */
export const nav = [
    { text: 'Início', link: '/', match: /^\/$/, icon: 'pi pi-home' },
    ...ROADMAP_TYPES.map((type) => ({
        text: type.label,
        link: roadmapMatrixPath(type.id),
        match: new RegExp(`^/roadmap/${type.id}`),
        icon: type.icon
    }))
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
