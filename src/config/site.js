import { ROADMAP_TYPES } from '@/config/roadmapTypes';
import { getRoadmapProducts } from '@/data/roadmapProductsByType';
import { roadmapDevPath, roadmapMatrixPath } from '@/config/roadmapTypes';

export const siteTitle = 'Product Hub';
export const siteDescription = 'Roadmaps SaaS, Interno e BPO — estratégia Aleevia';

export const nav = [
    { text: 'Início', link: '/', match: /^\/$/, icon: 'pi pi-home' },
    ...ROADMAP_TYPES.map((type) => ({
        text: type.label,
        link: roadmapMatrixPath(type.id),
        match: new RegExp(`^/roadmap/${type.id}`),
        icon: type.icon
    }))
];

function buildRoadmapSidebar(type) {
    const products = getRoadmapProducts(type);
    const matrixPath = roadmapMatrixPath(type);
    const devPath = roadmapDevPath(type);

    return [
        {
            text: 'Roadmap',
            items: [
                { text: 'Matriz', link: matrixPath },
                { text: 'Desenvolvimento', link: devPath }
            ]
        },
        {
            text: 'Tipos',
            items: ROADMAP_TYPES.map((entry) => ({
                text: entry.label,
                link: roadmapMatrixPath(entry.id)
            }))
        },
        {
            text: 'Módulos',
            items: products.map((product) => ({
                text: product.title,
                link: `${matrixPath}#product-${product.id}`
            }))
        }
    ];
}

const devSidebarExtras = {
    text: 'Status',
    items: [
        { text: 'A fazer', link: '#dev-a_fazer' },
        { text: 'Em andamento', link: '#dev-em_andamento' },
        { text: 'Concluído', link: '#dev-concluido' }
    ]
};

export function resolveSidebar(path) {
    const match = path.match(/^\/roadmap\/([^/]+)(?:\/desenvolvimento)?/);
    if (!match) return null;

    const type = match[1];
    const base = buildRoadmapSidebar(type);

    if (path.includes('/desenvolvimento')) {
        const devPath = roadmapDevPath(type);
        return [
            base[0],
            base[1],
            {
                ...devSidebarExtras,
                items: devSidebarExtras.items.map((item) => ({
                    ...item,
                    link: `${devPath}${item.link}`
                }))
            }
        ];
    }

    return base;
}

export function isNavActive(item, path) {
    return item.match?.test(path) ?? path === item.link;
}
