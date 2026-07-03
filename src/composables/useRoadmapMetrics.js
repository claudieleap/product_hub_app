import { computed, ref } from 'vue';
import {
    createMetric,
    createMetricGroup,
    deleteMetric,
    deleteMetricGroup,
    fetchMetricsCatalog,
    isMetricsApiEnabled,
    updateMetric,
    updateMetricGroup
} from '@/api/metricsClient';
import {
    DEFAULT_ROADMAP_METRIC_GROUPS,
    buildFlatMetrics,
    buildMetricsGrouped,
    getMetricLabelsFromCatalog
} from '@/data/roadmapMetrics';

const groups = ref(cloneGroups(DEFAULT_ROADMAP_METRIC_GROUPS));
const ready = ref(false);
const loading = ref(false);
const error = ref('');
let loadPromise = null;

function cloneGroups(catalog) {
    return catalog.map((group) => ({
        ...group,
        metrics: group.metrics.map((metric) => ({ ...metric }))
    }));
}

function normalizeApiGroups(catalog) {
    return catalog.map((group) => ({
        id: group.id,
        label: group.label,
        metrics: (group.metrics ?? []).map((metric) => ({
            id: metric.id,
            label: metric.label
        }))
    }));
}

export function loadMetricsCatalog() {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        loading.value = true;
        error.value = '';

        try {
            if (isMetricsApiEnabled()) {
                const catalog = await fetchMetricsCatalog();
                if (Array.isArray(catalog)) {
                    groups.value = normalizeApiGroups(catalog);
                }
            }
        } catch (err) {
            error.value = err?.message || 'Não foi possível carregar o catálogo de métricas.';
            groups.value = cloneGroups(DEFAULT_ROADMAP_METRIC_GROUPS);
        } finally {
            ready.value = true;
            loading.value = false;
        }
    })();

    return loadPromise;
}

export function useRoadmapMetrics() {
    if (!ready.value && !loading.value) {
        void loadMetricsCatalog();
    }

    const flatMetrics = computed(() => buildFlatMetrics(groups.value));
    const metricsGrouped = computed(() => buildMetricsGrouped(groups.value));

    function getMetricLabels(ids = []) {
        return getMetricLabelsFromCatalog(ids, flatMetrics.value);
    }

    function getMetricById(id) {
        return flatMetrics.value.find((metric) => metric.id === id) ?? null;
    }

    async function reloadCatalog() {
        loadPromise = null;
        ready.value = false;
        await loadMetricsCatalog();
    }

    async function addGroup(label) {
        const created = await createMetricGroup({ label });
        await reloadCatalog();
        return created;
    }

    async function editGroup(id, label) {
        const updated = await updateMetricGroup(id, { label });
        await reloadCatalog();
        return updated;
    }

    async function removeGroup(id) {
        await deleteMetricGroup(id);
        await reloadCatalog();
    }

    async function addMetric(groupId, label) {
        const created = await createMetric({ groupId, label });
        await reloadCatalog();
        return created;
    }

    async function editMetric(id, patch) {
        const updated = await updateMetric(id, patch);
        await reloadCatalog();
        return updated;
    }

    async function removeMetric(id) {
        await deleteMetric(id);
        await reloadCatalog();
    }

    return {
        groups,
        flatMetrics,
        metricsGrouped,
        ready,
        loading,
        error,
        getMetricLabels,
        getMetricById,
        reloadCatalog,
        addGroup,
        editGroup,
        removeGroup,
        addMetric,
        editMetric,
        removeMetric
    };
}
