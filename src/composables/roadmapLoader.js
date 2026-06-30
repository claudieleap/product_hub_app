import { ref } from 'vue';
import { roadmapApi, isRoadmapApiEnabled } from '@/api/roadmapClient';
import { IMPLEMENTED_SEED_IDS, ROADMAP_SEED_ITEMS } from '@/data/roadmapSeedData';

const MATRIX_KEY = 'aleevia-roadmap-matrix-v1';
const DELETED_SEEDS_KEY = 'aleevia-roadmap-deleted-seeds-v1';
const PRODUCTS_KEY = 'aleevia-roadmap-products-v1';

const implementedIds = new Set(IMPLEMENTED_SEED_IDS);

export const roadmapReady = ref(false);
export const roadmapSyncError = ref(null);

let deletedSeedIds = new Set();
let customProductsSnapshot = [];
let loadPromise = null;

export function getDeletedSeedIds() {
    return deletedSeedIds;
}

export function getCustomProductsSnapshot() {
    return customProductsSnapshot;
}

export function setCustomProductsSnapshot(products) {
    customProductsSnapshot = products;
}

function loadDeletedSeedIdsLocal() {
    try {
        const raw = localStorage.getItem(DELETED_SEEDS_KEY);
        if (raw) return new Set(JSON.parse(raw));
    } catch {
        /* ignore */
    }

    return new Set();
}

function persistDeletedSeedIdsLocal() {
    try {
        localStorage.setItem(DELETED_SEEDS_KEY, JSON.stringify([...deletedSeedIds]));
    } catch (e) {
        console.error('Falha ao salvar exclusões do roadmap', e);
    }
}

function loadMatrixLocal() {
    try {
        const raw = localStorage.getItem(MATRIX_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        /* ignore */
    }

    return [];
}

function loadProductsLocal() {
    try {
        const raw = localStorage.getItem(PRODUCTS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        /* ignore */
    }

    return [];
}

function persistMatrixLocal(items) {
    try {
        localStorage.setItem(MATRIX_KEY, JSON.stringify(items));
    } catch (e) {
        console.error('Falha ao salvar roadmap', e);
    }
}

function purgeImplementedItems(items) {
    return items.filter((item) => !implementedIds.has(item.id));
}

function mergeSeedItems(items) {
    const knownIds = new Set(items.map((item) => item.id));
    const missing = ROADMAP_SEED_ITEMS.filter(
        (seed) => !knownIds.has(seed.id) && !deletedSeedIds.has(seed.id)
    );

    if (!missing.length) return items;

    return [...items, ...missing];
}

function buildLocalState() {
    deletedSeedIds = loadDeletedSeedIdsLocal();

    return {
        items: mergeSeedItems(purgeImplementedItems(loadMatrixLocal())),
        customProducts: loadProductsLocal(),
        deletedSeedIds: [...deletedSeedIds]
    };
}

async function migrateLocalToApiIfEmpty(apiState) {
    const hasRemoteData =
        (apiState.items?.length ?? 0) > 0 ||
        (apiState.customProducts?.length ?? 0) > 0 ||
        (apiState.deletedSeedIds?.length ?? 0) > 0;

    if (hasRemoteData) return apiState;

    const local = buildLocalState();
    const hasLocalData =
        local.items.length > 0 || local.customProducts.length > 0 || local.deletedSeedIds.length > 0;

    if (!hasLocalData) {
        return apiState;
    }

    try {
        return await roadmapApi.importState(local);
    } catch (error) {
        console.warn('Importação do roadmap local bloqueada ou falhou:', error.message);
        return apiState;
    }
}

async function syncMissingSeedsToApi(items) {
    if (!isRoadmapApiEnabled()) return;

    const remote = await roadmapApi.getState();
    const remoteIds = new Set((remote.items ?? []).map((item) => item.id));

    for (const item of items) {
        if (!remoteIds.has(item.id) && item.id.startsWith('rm-seed-')) {
            try {
                await roadmapApi.createItem(item);
            } catch (error) {
                console.warn(`Falha ao sincronizar seed ${item.id}:`, error.message);
            }
        }
    }
}

export async function ensureRoadmapLoaded() {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        roadmapSyncError.value = null;

        try {
            if (!isRoadmapApiEnabled()) {
                const local = buildLocalState();
                deletedSeedIds = new Set(local.deletedSeedIds);
                customProductsSnapshot = local.customProducts;
                roadmapReady.value = true;

                return {
                    items: local.items,
                    customProducts: local.customProducts
                };
            }

            let remote = await roadmapApi.getState();
            remote = await migrateLocalToApiIfEmpty(remote);

            deletedSeedIds = new Set(remote.deletedSeedIds ?? []);
            customProductsSnapshot = remote.customProducts ?? [];

            let items = mergeSeedItems(purgeImplementedItems(remote.items ?? []));
            await syncMissingSeedsToApi(items);

            if (items.length !== (remote.items ?? []).length) {
                const fresh = await roadmapApi.getState();
                items = mergeSeedItems(purgeImplementedItems(fresh.items ?? []));
                customProductsSnapshot = fresh.customProducts ?? customProductsSnapshot;
                deletedSeedIds = new Set(fresh.deletedSeedIds ?? [...deletedSeedIds]);
            }

            roadmapReady.value = true;

            return {
                items,
                customProducts: customProductsSnapshot
            };
        } catch (error) {
            roadmapSyncError.value = error.message || 'Falha ao carregar roadmap';
            console.error(error);

            const local = buildLocalState();
            deletedSeedIds = new Set(local.deletedSeedIds);
            customProductsSnapshot = local.customProducts;
            roadmapReady.value = true;

            return {
                items: local.items,
                customProducts: local.customProducts,
                fallback: true
            };
        }
    })();

    return loadPromise;
}

export async function trackDeletedSeed(id) {
    deletedSeedIds.add(id);
    persistDeletedSeedIdsLocal();
}

export function persistMatrixFallback(items) {
    if (!isRoadmapApiEnabled()) {
        persistMatrixLocal(items);
    }
}

export function persistProductsFallback(products) {
    if (!isRoadmapApiEnabled()) {
        try {
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        } catch (e) {
            console.error('Falha ao salvar módulos do roadmap', e);
        }
    }
}

function stripCustomProduct(product) {
    const { custom, ...rest } = product;
    return rest;
}

export function exportLocalRoadmapState() {
    return buildLocalState();
}

export async function publishRoadmapState(items, customProducts) {
    if (!isRoadmapApiEnabled()) {
        throw new Error('API do roadmap não configurada (VITE_API_BASE_URL).');
    }

    const payload = {
        items,
        customProducts: customProducts.map(stripCustomProduct),
        deletedSeedIds: [...deletedSeedIds]
    };

    const remote = await roadmapApi.syncState(payload);

    deletedSeedIds = new Set(remote.deletedSeedIds ?? []);
    customProductsSnapshot = remote.customProducts ?? [];

    return remote;
}
