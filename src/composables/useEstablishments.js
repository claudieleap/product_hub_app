import { computed, ref } from 'vue';
import { establishmentsApi, isEstablishmentsApiEnabled } from '@/api/establishmentsClient';
import { COMMERCIAL_STAGES } from '@/config/commercialConfig';

/**
 * Store singleton dos estabelecimentos — fonte única de dados compartilhada
 * pelas telas de Onboarding e Pipeline comercial (o mesmo registro, visto de
 * dois ângulos). Carrega uma vez da API e mantém em memória.
 */

const establishments = ref([]);
const isHydrated = ref(false);
const loadError = ref(null);
let loadPromise = null;

function normalize(establishment) {
    return {
        ...establishment,
        especialidades: Array.isArray(establishment.especialidades) ? establishment.especialidades : [],
        projects: Array.isArray(establishment.projects) ? establishment.projects : []
    };
}

function ensureLoaded() {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        if (!isEstablishmentsApiEnabled()) {
            isHydrated.value = true;
            return;
        }

        try {
            const data = await establishmentsApi.list();
            establishments.value = (data ?? []).map(normalize);
            loadError.value = null;
        } catch (error) {
            loadError.value = error.message || 'Falha ao carregar estabelecimentos.';
            loadPromise = null; // permite tentar de novo na próxima chamada, em vez de travar o erro pra sempre
        } finally {
            isHydrated.value = true;
        }
    })();

    return loadPromise;
}

function findEstablishment(id) {
    return establishments.value.find((item) => item.id === id) ?? null;
}

async function moveToStage(id, stageId) {
    const establishment = findEstablishment(id);
    if (!establishment || establishment.stageId === stageId) return false;

    const previousStage = establishment.stageId;
    const previousOrder = establishment.orderIndex;
    const orderIndex = establishments.value.filter((item) => item.stageId === stageId).length;

    establishment.stageId = stageId;
    establishment.orderIndex = orderIndex;

    try {
        await establishmentsApi.update(id, { stageId, orderIndex });
        return true;
    } catch (error) {
        establishment.stageId = previousStage;
        establishment.orderIndex = previousOrder;
        throw error;
    }
}

async function updateFields(id, patch) {
    const establishment = findEstablishment(id);
    if (!establishment) return;

    const previous = {};
    for (const key of Object.keys(patch)) {
        previous[key] = establishment[key];
        establishment[key] = patch[key];
    }

    try {
        await establishmentsApi.update(id, patch);
    } catch (error) {
        Object.assign(establishment, previous);
        throw error;
    }
}

async function createEstablishment(payload) {
    const created = normalize(await establishmentsApi.create(payload));
    establishments.value.push(created);
    return created;
}

async function removeEstablishment(id) {
    await establishmentsApi.remove(id);
    establishments.value = establishments.value.filter((item) => item.id !== id);
}

async function fetchComments(id) {
    return establishmentsApi.listComments(id);
}

async function postComment(id, text) {
    return establishmentsApi.addComment(id, text);
}

async function createAppointment(id, payload) {
    const result = await establishmentsApi.createAppointment(id, payload);
    const establishment = findEstablishment(id);
    if (establishment && result.stageId) {
        establishment.stageId = result.stageId;
    }
    return result;
}

export function useEstablishments() {
    const ready = ensureLoaded();

    const leadsByStage = computed(() => {
        const map = new Map(COMMERCIAL_STAGES.map((stage) => [stage.id, []]));

        for (const item of establishments.value) {
            if (!item.stageId) continue;
            if (!map.has(item.stageId)) map.set(item.stageId, []);
            map.get(item.stageId).push(item);
        }

        for (const list of map.values()) {
            list.sort((a, b) => a.orderIndex - b.orderIndex);
        }

        return map;
    });

    const pipelineEstablishments = computed(() => establishments.value.filter((item) => item.stageId));

    const cities = computed(() =>
        [...new Set(establishments.value.map((item) => item.municipio).filter(Boolean))].sort()
    );

    const specialties = computed(() =>
        [...new Set(establishments.value.flatMap((item) => item.especialidades))].sort()
    );

    function countByStage(stageId) {
        return establishments.value.filter((item) => item.stageId === stageId).length;
    }

    return {
        ready,
        establishments,
        isHydrated,
        loadError,
        leadsByStage,
        pipelineEstablishments,
        cities,
        specialties,
        countByStage,
        getEstablishment: findEstablishment,
        moveToStage,
        updateFields,
        createEstablishment,
        removeEstablishment,
        fetchComments,
        postComment,
        createAppointment
    };
}
