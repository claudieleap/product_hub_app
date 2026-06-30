import { computed, ref } from 'vue';
import { ROADMAP_PRODUCTS as DEFAULT_PRODUCTS } from '@/data/roadmapProducts';
import { roadmapApi, isRoadmapApiEnabled } from '@/api/roadmapClient';
import {
    ensureRoadmapLoaded,
    getCustomProductsSnapshot,
    persistProductsFallback,
    setCustomProductsSnapshot
} from '@/composables/roadmapLoader';

function slugify(title) {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
}

function uniqueProductId(title, existingIds) {
    const base = slugify(title) || 'modulo';
    let candidate = base;
    let suffix = 2;

    while (existingIds.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }

    return candidate;
}

export const MODULE_ICON_OPTIONS = [
    { label: 'Caixa', value: 'pi pi-box' },
    { label: 'Configurações', value: 'pi pi-cog' },
    { label: 'Gráfico', value: 'pi pi-chart-line' },
    { label: 'Usuários', value: 'pi pi-users' },
    { label: 'Documento', value: 'pi pi-file' },
    { label: 'Carteira', value: 'pi pi-wallet' },
    { label: 'Raio', value: 'pi pi-bolt' },
    { label: 'IA', value: 'pi pi-sparkles' },
    { label: 'Coração', value: 'pi pi-heart' },
    { label: 'Escudo', value: 'pi pi-shield' }
];

export const MODULE_ACCENT_OPTIONS = [
    { label: 'Azul', value: '#1e4fe0' },
    { label: 'Verde', value: '#0e9e92' },
    { label: 'Roxo', value: '#6e47c9' },
    { label: 'Verde escuro', value: '#168a5a' },
    { label: 'Vermelho', value: '#cf4a3e' },
    { label: 'Âmbar', value: '#c8841a' }
];

const customProducts = ref(getCustomProductsSnapshot());

ensureRoadmapLoaded().then((state) => {
    customProducts.value = state.customProducts ?? getCustomProductsSnapshot();
});

function persistCustomProducts(products) {
    setCustomProductsSnapshot(products);
    persistProductsFallback(products);
}

export function useRoadmapProducts() {
    const allProducts = computed(() => [...DEFAULT_PRODUCTS, ...customProducts.value]);

    const customCount = computed(() => customProducts.value.length);

    function getProductById(id) {
        return allProducts.value.find((product) => product.id === id) ?? null;
    }

    async function addProduct({ title, description, icon, accent }) {
        const trimmedTitle = title?.trim();
        if (!trimmedTitle) return null;

        const existingIds = new Set(allProducts.value.map((product) => product.id));
        const entry = {
            id: uniqueProductId(trimmedTitle, existingIds),
            title: trimmedTitle,
            description: description?.trim() || 'Módulo cadastrado no roadmap de produto.',
            icon: icon ?? 'pi pi-box',
            accent: accent ?? '#1e4fe0',
            custom: true,
            createdAt: new Date().toISOString()
        };

        if (isRoadmapApiEnabled()) {
            const saved = await roadmapApi.createProduct(entry);
            Object.assign(entry, saved ?? {});
        }

        customProducts.value = [...customProducts.value, entry];
        persistCustomProducts(customProducts.value);
        return entry;
    }

    async function removeCustomProduct(id) {
        const product = customProducts.value.find((p) => p.id === id);
        if (!product) return false;

        if (isRoadmapApiEnabled()) {
            await roadmapApi.deleteProduct(id);
        }

        customProducts.value = customProducts.value.filter((p) => p.id !== id);
        persistCustomProducts(customProducts.value);
        return true;
    }

    async function updateCustomProduct(id, { title, description, icon, accent }) {
        const index = customProducts.value.findIndex((p) => p.id === id);
        if (index === -1) return null;

        const trimmedTitle = title?.trim();
        if (!trimmedTitle) return null;

        const current = customProducts.value[index];
        const entry = {
            ...current,
            title: trimmedTitle,
            description: description?.trim() || current.description,
            icon: icon ?? current.icon,
            accent: accent ?? current.accent
        };

        if (isRoadmapApiEnabled()) {
            const saved = await roadmapApi.updateProduct(id, {
                title: entry.title,
                description: entry.description,
                icon: entry.icon,
                accent: entry.accent
            });
            Object.assign(entry, saved ?? {});
        }

        customProducts.value = customProducts.value.map((product, i) => (i === index ? entry : product));
        persistCustomProducts(customProducts.value);
        return entry;
    }

    return {
        allProducts,
        customProducts,
        customCount,
        getProductById,
        addProduct,
        removeCustomProduct,
        updateCustomProduct
    };
}
