import { computed, ref, unref } from 'vue';
import { getRoadmapProducts } from '@/data/roadmapProductsByType';
import { getRoadmapApi, isRoadmapApiEnabled } from '@/api/roadmapClient';
import { parseRoadmapType } from '@/config/roadmapTypes';
import {
    ensureRoadmapLoaded,
    getCustomProductsSnapshot,
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

function mergeProducts(defaultProducts, customProducts) {
    const hiddenIds = new Set(
        customProducts.filter((product) => product.isHidden).map((product) => product.id)
    );
    const overrideById = new Map(
        customProducts
            .filter((product) => !product.isHidden)
            .map((product) => [product.id, product])
    );
    const defaultIds = new Set(defaultProducts.map((product) => product.id));

    const mergedDefaults = defaultProducts
        .filter((product) => !hiddenIds.has(product.id))
        .map((product) => {
            const override = overrideById.get(product.id);
            if (!override) return product;

            return {
                ...product,
                title: override.title,
                description: override.description,
                icon: override.icon,
                accent: override.accent
            };
        });

    const customOnly = customProducts.filter(
        (product) => !product.isHidden && !defaultIds.has(product.id)
    );

    return [...mergedDefaults, ...customOnly];
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

const productStores = new Map();

function createProductStore(roadmapTypeInput) {
    const roadmapType = parseRoadmapType(unref(roadmapTypeInput));
    const defaultProducts = getRoadmapProducts(roadmapType);
    const defaultIds = new Set(defaultProducts.map((product) => product.id));
    const api = getRoadmapApi(roadmapType);
    const customProducts = ref(getCustomProductsSnapshot(roadmapType));

    ensureRoadmapLoaded(roadmapType).then((state) => {
        customProducts.value = state.customProducts ?? getCustomProductsSnapshot(roadmapType);
    });

    function persistCustomProducts(products) {
        setCustomProductsSnapshot(roadmapType, products);
    }

    function findCustomEntry(id) {
        return customProducts.value.find((product) => product.id === id) ?? null;
    }

    const allProducts = computed(() => mergeProducts(defaultProducts, customProducts.value));
    const customCount = computed(
        () => customProducts.value.filter((product) => !product.isHidden && !defaultIds.has(product.id)).length
    );

    function getProductById(id) {
        return allProducts.value.find((product) => product.id === id) ?? null;
    }

    function upsertLocalCustomEntry(entry) {
        const index = customProducts.value.findIndex((product) => product.id === entry.id);
        if (index === -1) {
            customProducts.value = [...customProducts.value, entry];
        } else {
            customProducts.value = customProducts.value.map((product, i) => (i === index ? entry : product));
        }
        persistCustomProducts(customProducts.value);
    }

    async function addProduct({ title, description, icon, accent }) {
        const trimmedTitle = title?.trim();
        if (!trimmedTitle) return null;

        const existingIds = new Set(allProducts.value.map((product) => product.id));
        const entry = {
            id: uniqueProductId(trimmedTitle, existingIds),
            title: trimmedTitle,
            description: description?.trim() || 'Módulo cadastrado no roadmap.',
            icon: icon ?? 'pi pi-box',
            accent: accent ?? '#1e4fe0',
            custom: true,
            isHidden: false,
            createdAt: new Date().toISOString()
        };

        if (isRoadmapApiEnabled()) {
            const saved = await api.createProduct(entry);
            Object.assign(entry, saved ?? {});
        }

        upsertLocalCustomEntry(entry);
        return entry;
    }

    async function upsertProduct(id, { title, description, icon, accent }) {
        const trimmedTitle = title?.trim();
        if (!trimmedTitle) return null;

        const defaultProduct = defaultProducts.find((product) => product.id === id);
        const existingCustom = findCustomEntry(id);
        const entry = {
            ...(defaultProduct ?? existingCustom ?? {}),
            id,
            title: trimmedTitle,
            description: description?.trim() || defaultProduct?.description || existingCustom?.description || 'Módulo cadastrado no roadmap.',
            icon: icon ?? defaultProduct?.icon ?? existingCustom?.icon ?? 'pi pi-box',
            accent: accent ?? defaultProduct?.accent ?? existingCustom?.accent ?? '#1e4fe0',
            custom: !defaultProduct,
            isHidden: false,
            createdAt: existingCustom?.createdAt ?? defaultProduct?.createdAt ?? new Date().toISOString()
        };

        if (isRoadmapApiEnabled()) {
            const payload = {
                title: entry.title,
                description: entry.description,
                icon: entry.icon,
                accent: entry.accent,
                isHidden: false
            };

            if (existingCustom) {
                const saved = await api.updateProduct(id, payload);
                Object.assign(entry, saved ?? {});
            } else {
                const saved = await api.createProduct({ ...entry, ...payload });
                Object.assign(entry, saved ?? {});
            }
        }

        upsertLocalCustomEntry(entry);
        return entry;
    }

    async function removeModule(id) {
        const defaultProduct = defaultProducts.find((product) => product.id === id);
        const existingCustom = findCustomEntry(id);

        if (!defaultProduct && !existingCustom) return false;

        if (isRoadmapApiEnabled()) {
            if (defaultProduct) {
                const payload = {
                    id,
                    title: existingCustom?.title ?? defaultProduct.title,
                    description: existingCustom?.description ?? defaultProduct.description,
                    icon: existingCustom?.icon ?? defaultProduct.icon,
                    accent: existingCustom?.accent ?? defaultProduct.accent,
                    isHidden: true
                };

                if (existingCustom) {
                    await api.updateProduct(id, payload);
                } else {
                    await api.createProduct(payload);
                }
            } else {
                await api.deleteProduct(id);
            }
        }

        if (defaultProduct) {
            upsertLocalCustomEntry({
                ...(existingCustom ?? defaultProduct),
                id,
                custom: true,
                isHidden: true
            });
        } else {
            customProducts.value = customProducts.value.filter((product) => product.id !== id);
            persistCustomProducts(customProducts.value);
        }

        return true;
    }

    async function removeCustomProduct(id) {
        return removeModule(id);
    }

    async function updateCustomProduct(id, fields) {
        return upsertProduct(id, fields);
    }

    return {
        allProducts,
        customProducts,
        customCount,
        getProductById,
        addProduct,
        upsertProduct,
        removeModule,
        removeCustomProduct,
        updateCustomProduct
    };
}

export function useRoadmapProducts(roadmapType = 'saas') {
    const type = parseRoadmapType(unref(roadmapType));

    if (!productStores.has(type)) {
        productStores.set(type, createProductStore(type));
    }

    return productStores.get(type);
}
