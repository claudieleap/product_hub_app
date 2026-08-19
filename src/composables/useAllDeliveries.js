import { computed } from 'vue';
import { ROADMAP_TYPES } from '@/config/roadmapTypes';
import { useRoadmapMatrix } from '@/composables/useRoadmapMatrix';
import { useRoadmapProducts } from '@/composables/useRoadmapProducts';
import { getRoadmapReady } from '@/composables/roadmapLoader';

const matrixByType = Object.fromEntries(ROADMAP_TYPES.map((type) => [type.id, useRoadmapMatrix(type.id)]));
const productsByType = Object.fromEntries(ROADMAP_TYPES.map((type) => [type.id, useRoadmapProducts(type.id)]));

export function useAllDeliveries() {
    const allReady = computed(() => ROADMAP_TYPES.every((type) => getRoadmapReady(type.id).value));

    const deliveredItems = computed(() => {
        const all = [];

        for (const type of ROADMAP_TYPES) {
            for (const item of matrixByType[type.id].deliveredItems.value) {
                all.push({ ...item, roadmapType: type.id });
            }
        }

        return all.sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt));
    });

    function getProductById(roadmapType, productId) {
        return productsByType[roadmapType]?.getProductById(productId);
    }

    return {
        allReady,
        deliveredItems,
        getProductById
    };
}
