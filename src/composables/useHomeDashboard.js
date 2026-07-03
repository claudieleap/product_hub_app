import { computed } from 'vue';
import { ROADMAP_TYPES } from '@/config/roadmapTypes';
import { useRoadmapMatrix } from '@/composables/useRoadmapMatrix';
import { getRoadmapReady } from '@/composables/roadmapLoader';
import { deliveryDateIsoKey } from '@/utils/brazilianDate';

const matrixByType = Object.fromEntries(ROADMAP_TYPES.map((type) => [type.id, useRoadmapMatrix(type.id)]));

function currentMonthKey() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit'
    }).formatToParts(now);

    const year = parts.find((part) => part.type === 'year')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    return `${year}-${month}`;
}

export function useHomeDashboard() {
    const allReady = computed(() => ROADMAP_TYPES.every((type) => getRoadmapReady(type.id).value));

    const statsByType = computed(() =>
        ROADMAP_TYPES.map((type) => {
            const store = matrixByType[type.id];
            const devStats = store.devStats.value;

            return {
                id: type.id,
                label: type.label,
                color: type.color,
                wash: type.wash,
                icon: type.icon,
                matrix: store.matrixItems.value.length,
                backlog: store.backlogItems.value.length,
                dev: devStats.total,
                devConcluido: devStats.concluido,
                devProgress: devStats.progress,
                deliveries: store.deliveredItems.value.length
            };
        })
    );

    const deliveredItems = computed(() => {
        const all = [];

        for (const type of ROADMAP_TYPES) {
            for (const item of matrixByType[type.id].deliveredItems.value) {
                all.push({ ...item, roadmapType: type.id });
            }
        }

        return all.sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt));
    });

    const totals = computed(() => {
        const monthPrefix = currentMonthKey();
        const devConcluido = statsByType.value.reduce((sum, type) => sum + type.devConcluido, 0);
        const devTotal = statsByType.value.reduce((sum, type) => sum + type.dev, 0);

        return {
            matrix: statsByType.value.reduce((sum, type) => sum + type.matrix, 0),
            backlog: statsByType.value.reduce((sum, type) => sum + type.backlog, 0),
            dev: devTotal,
            devConcluido,
            devProgress: devTotal ? Math.round((devConcluido / devTotal) * 100) : 0,
            deliveries: deliveredItems.value.length,
            deliveriesThisMonth: deliveredItems.value.filter((item) =>
                deliveryDateIsoKey(item.deliveredAt).startsWith(monthPrefix)
            ).length
        };
    });

    const pipeline = computed(() => {
        const segments = [
            { id: 'backlog', label: 'Backlog', value: totals.value.backlog, color: '#64748b' },
            { id: 'matrix', label: 'Matriz', value: totals.value.matrix, color: '#1e4fe0' },
            { id: 'dev', label: 'Desenvolvimento', value: totals.value.dev, color: '#c8841a' },
            { id: 'deliveries', label: 'Entregas', value: totals.value.deliveries, color: '#168a5a' }
        ];
        const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

        return segments.map((segment) => ({
            ...segment,
            pct: Math.round((segment.value / total) * 100)
        }));
    });

    const recentDeliveries = computed(() => deliveredItems.value.slice(0, 5));

    return {
        allReady,
        totals,
        statsByType,
        pipeline,
        recentDeliveries
    };
}
