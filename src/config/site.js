import { ROADMAP_PRODUCTS } from '@/data/roadmapProducts';

export const siteTitle = 'Product Hub';
export const siteDescription = 'Roadmap de produto e estratégia Aleevia';

export const nav = [
    { text: 'Home', link: '/', match: /^\/$/, icon: 'pi pi-home' },
    { text: 'Roadmap', link: '/roadmap', match: /^\/roadmap/, icon: 'pi pi-map' },
    { text: 'Status API', link: '/status', match: /^\/status/, icon: 'pi pi-server' }
];

export const sidebar = {
    '/roadmap': [
        {
            text: 'Roadmap',
            items: [
                { text: 'Matriz', link: '/roadmap' },
                { text: 'Desenvolvimento', link: '/roadmap/desenvolvimento' }
            ]
        },
        {
            text: 'Módulos',
            items: ROADMAP_PRODUCTS.map((product) => ({
                text: product.title,
                link: `/roadmap#product-${product.id}`
            }))
        }
    ],
    '/roadmap/desenvolvimento': [
        {
            text: 'Roadmap',
            items: [
                { text: 'Matriz', link: '/roadmap' },
                { text: 'Desenvolvimento', link: '/roadmap/desenvolvimento' }
            ]
        },
        {
            text: 'Status',
            items: [
                { text: 'A fazer', link: '/roadmap/desenvolvimento#dev-a_fazer' },
                { text: 'Em andamento', link: '/roadmap/desenvolvimento#dev-em_andamento' },
                { text: 'Concluído', link: '/roadmap/desenvolvimento#dev-concluido' }
            ]
        }
    ]
};

export function resolveSidebar(path) {
    if (path.startsWith('/roadmap/desenvolvimento')) return sidebar['/roadmap/desenvolvimento'];
    if (path.startsWith('/roadmap')) return sidebar['/roadmap'];
    return null;
}

export function isNavActive(item, path) {
    return item.match?.test(path) ?? path === item.link;
}
