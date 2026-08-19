import { computed } from 'vue';
import { ROADMAP_TYPES } from '@/config/roadmapTypes';
import { useRoadmapMatrix } from '@/composables/useRoadmapMatrix';
import { useRoadmapMetrics } from '@/composables/useRoadmapMetrics';
import { getRoadmapReady } from '@/composables/roadmapLoader';
import { resolveMetricId } from '@/data/roadmapMetrics';

const matrixByType = Object.fromEntries(ROADMAP_TYPES.map((type) => [type.id, useRoadmapMatrix(type.id)]));

function createEmptyTypeCounts() {
    return Object.fromEntries(ROADMAP_TYPES.map((type) => [type.id, 0]));
}

export function useMetricsDashboard() {
    const { groups, ready: metricsReady, loading: metricsLoading, error: metricsError } = useRoadmapMetrics();

    const roadmapReady = computed(() => ROADMAP_TYPES.every((type) => getRoadmapReady(type.id).value));

    const allReady = computed(() => metricsReady.value && roadmapReady.value);

    const allItems = computed(() => {
        const items = [];

        for (const type of ROADMAP_TYPES) {
            for (const item of matrixByType[type.id].items.value) {
                items.push({ ...item, roadmapType: type.id });
            }
        }

        return items;
    });

    const metricUsage = computed(() => {
        const counts = new Map();

        for (const type of ROADMAP_TYPES) {
            for (const item of matrixByType[type.id].items.value) {
                const seen = new Set();

                for (const rawId of item.metrics ?? []) {
                    const metricId = resolveMetricId(rawId);
                    if (seen.has(metricId)) continue;
                    seen.add(metricId);

                    if (!counts.has(metricId)) {
                        counts.set(metricId, { total: 0, byType: createEmptyTypeCounts() });
                    }

                    const entry = counts.get(metricId);
                    entry.total += 1;
                    entry.byType[type.id] += 1;
                }
            }
        }

        return counts;
    });

    const totals = computed(() => {
        const items = allItems.value;
        const withMetrics = items.filter((item) => (item.metrics?.length ?? 0) > 0).length;
        const associations = [...metricUsage.value.values()].reduce((sum, entry) => sum + entry.total, 0);
        const metricsWithItems = [...metricUsage.value.values()].filter((entry) => entry.total > 0).length;

        return {
            items: items.length,
            withMetrics,
            withoutMetrics: items.length - withMetrics,
            associations,
            metricsWithItems
        };
    });

    const dashboardGroups = computed(() =>
        groups.value.map((group) => {
            const metrics = group.metrics
                .map((metric) => {
                    const usage = metricUsage.value.get(metric.id) ?? {
                        total: 0,
                        byType: createEmptyTypeCounts()
                    };

                    return {
                        ...metric,
                        itemCount: usage.total,
                        byType: usage.byType
                    };
                })
                .sort((a, b) => b.itemCount - a.itemCount || a.label.localeCompare(b.label, 'pt-BR'));

            const groupAssociations = metrics.reduce((sum, metric) => sum + metric.itemCount, 0);
            const maxInGroup = Math.max(...metrics.map((metric) => metric.itemCount), 1);

            return {
                ...group,
                metrics,
                groupAssociations,
                maxInGroup
            };
        })
    );

    const topMetrics = computed(() => {
        const flat = dashboardGroups.value.flatMap((group) =>
            group.metrics.map((metric) => ({
                ...metric,
                groupLabel: group.label
            }))
        );

        return flat.filter((metric) => metric.itemCount > 0).sort((a, b) => b.itemCount - a.itemCount).slice(0, 8);
    });

    const maxTopMetricCount = computed(() => Math.max(...topMetrics.value.map((metric) => metric.itemCount), 1));

    return {
        groups,
        metricUsage,
        dashboardGroups,
        topMetrics,
        maxTopMetricCount,
        totals,
        allReady,
        metricsLoading,
        metricsError
    };
}
