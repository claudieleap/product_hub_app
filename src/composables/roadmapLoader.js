import { ref } from 'vue';
import { getRoadmapApi, isRoadmapApiEnabled } from '@/api/roadmapClient';
import { parseRoadmapType } from '@/config/roadmapTypes';

const loaderState = new Map();

function getLoader(type) {
    const roadmapType = parseRoadmapType(type);

    if (!loaderState.has(roadmapType)) {
        loaderState.set(roadmapType, {
            roadmapType,
            roadmapReady: ref(false),
            roadmapSyncError: ref(null),
            deletedSeedIds: new Set(),
            customProductsSnapshot: [],
            loadPromise: null
        });
    }

    return loaderState.get(roadmapType);
}

export function getRoadmapReady(type) {
    return getLoader(type).roadmapReady;
}

export function getRoadmapSyncError(type) {
    return getLoader(type).roadmapSyncError;
}

export function getDeletedSeedIds(type) {
    return getLoader(type).deletedSeedIds;
}

export function getCustomProductsSnapshot(type) {
    return getLoader(type).customProductsSnapshot;
}

export function setCustomProductsSnapshot(type, products) {
    getLoader(type).customProductsSnapshot = products;
}

function applyRemoteState(loader, remote) {
    loader.deletedSeedIds = new Set(remote.deletedSeedIds ?? []);
    loader.customProductsSnapshot = remote.customProducts ?? [];

    return {
        items: remote.items ?? [],
        customProducts: loader.customProductsSnapshot
    };
}

export async function ensureRoadmapLoaded(type = 'saas') {
    const loader = getLoader(type);

    if (loader.loadPromise) return loader.loadPromise;

    loader.loadPromise = (async () => {
        loader.roadmapSyncError.value = null;

        if (!isRoadmapApiEnabled()) {
            loader.roadmapSyncError.value = 'API do roadmap não configurada (VITE_API_BASE_URL).';
            loader.roadmapReady.value = true;

            return {
                items: [],
                customProducts: [],
                fallback: true
            };
        }

        try {
            const remote = await getRoadmapApi(type).getState();
            loader.roadmapReady.value = true;

            return applyRemoteState(loader, remote);
        } catch (error) {
            loader.roadmapSyncError.value = error.message || 'Falha ao carregar roadmap';
            console.error(error);
            loader.roadmapReady.value = true;

            return {
                items: [],
                customProducts: [],
                fallback: true
            };
        }
    })();

    return loader.loadPromise;
}

export function persistMatrixFallback() {
    /* noop — estado de itens vive apenas na API */
}

export function persistProductsFallback() {
    /* noop — módulos customizados vivem apenas na API */
}

function stripCustomProduct(product) {
    const { custom, ...rest } = product;
    return rest;
}

export async function publishRoadmapState(type, items, customProducts) {
    if (!isRoadmapApiEnabled()) {
        throw new Error('API do roadmap não configurada (VITE_API_BASE_URL).');
    }

    const loader = getLoader(type);
    const payload = {
        items,
        customProducts: customProducts.map(stripCustomProduct),
        deletedSeedIds: [...loader.deletedSeedIds]
    };

    const remote = await getRoadmapApi(type).syncState(payload);

    loader.deletedSeedIds = new Set(remote.deletedSeedIds ?? []);
    loader.customProductsSnapshot = remote.customProducts ?? [];

    return remote;
}
