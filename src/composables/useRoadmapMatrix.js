import { computed, ref, unref } from 'vue';
import { getRoadmapApi, isRoadmapApiEnabled } from '@/api/roadmapClient';
import { parseRoadmapType } from '@/config/roadmapTypes';
import { BACKLOG_PRIORITY_ID, isBacklogPriority, isMatrixPriority } from '@/data/roadmapProducts';
import { ensureRoadmapLoaded } from '@/composables/roadmapLoader';

const matrixStores = new Map();

function createMatrixStore(roadmapTypeInput) {
    const roadmapType = parseRoadmapType(unref(roadmapTypeInput));
    const items = ref([]);
    const isHydrated = ref(false);
    const api = getRoadmapApi(roadmapType);

    ensureRoadmapLoaded(roadmapType).then((state) => {
        items.value = (state.items ?? []).map(normalizeItem);
        isHydrated.value = true;
    });

    function persist() {
        /* estado persistido pela API em cada operação */
    }

    function normalizeMetrics(metrics) {
        if (Array.isArray(metrics)) return [...metrics];
        if (typeof metrics === 'string' && metrics.trim()) {
            return metrics.trim().split(/\s+/);
        }
        return [];
    }

    function normalizeItemFields({ title, notes, metrics, priority, devStatus, backlogPriority }) {
        return {
            title: title?.trim() ?? '',
            notes: notes?.trim() ?? '',
            metrics: normalizeMetrics(metrics),
            priority,
            devStatus: devStatus || null,
            backlogPriority: backlogPriority || null
        };
    }

    function normalizeItem(item) {
        const normalized = {
            ...item,
            metrics: normalizeMetrics(item.metrics),
            deliveredAt: item.deliveredAt || null
        };

        if (isBacklogPriority(normalized.priority) && !normalized.backlogPriority) {
            normalized.backlogPriority = 'media';
        }

        if (!isBacklogPriority(normalized.priority)) {
            normalized.backlogPriority = null;
        }

        return normalized;
    }

    function getBacklogTier(item) {
        return item.backlogPriority || 'media';
    }

    async function apiCreateItem(entry) {
        if (!isRoadmapApiEnabled()) return entry;
        return api.createItem(entry);
    }

    async function apiUpdateItem(id, patch) {
        if (!isRoadmapApiEnabled()) return;
        await api.updateItem(id, patch);
    }

    async function apiDeleteItem(id) {
        if (!isRoadmapApiEnabled()) return;
        await api.deleteItem(id);
    }

    async function apiDeleteItemsByProduct(productId) {
        if (!isRoadmapApiEnabled()) return;
        await api.deleteItemsByProduct(productId);
    }

    function isDelivered(item) {
        return Boolean(item.deliveredAt);
    }

    const itemsByCell = computed(() => {
        const map = {};
        for (const item of items.value) {
            if (isDelivered(item) || isBacklogPriority(item.priority)) continue;
            const key = `${item.productId}:${item.priority}`;
            if (!map[key]) map[key] = [];
            map[key].push(item);
        }
        return map;
    });

    const backlogItems = computed(() =>
        items.value.filter((item) => isBacklogPriority(item.priority) && !isDelivered(item))
    );

    const matrixItems = computed(() =>
        items.value.filter((item) => !isBacklogPriority(item.priority) && !isDelivered(item))
    );

    const deliveredItems = computed(() =>
        [...items.value.filter((item) => isDelivered(item))].sort(
            (a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt)
        )
    );

    const devItems = computed(() => matrixItems.value.filter((item) => item.devStatus));

    const devStats = computed(() => {
        const total = devItems.value.length;
        const concluido = devItems.value.filter((item) => item.devStatus === 'concluido').length;
        const emAndamento = devItems.value.filter((item) => item.devStatus === 'em_andamento').length;
        const aFazer = devItems.value.filter((item) => item.devStatus === 'a_fazer').length;

        return {
            total,
            concluido,
            emAndamento,
            aFazer,
            progress: total ? Math.round((concluido / total) * 100) : 0
        };
    });

    function getCellItems(productId, priority) {
        return itemsByCell.value[`${productId}:${priority}`] ?? [];
    }

    function getDevItemsByStatus(status) {
        return devItems.value.filter((item) => item.devStatus === status);
    }

    function getBacklogItemsByPriority(tier) {
        return backlogItems.value.filter((item) => getBacklogTier(item) === tier);
    }

    async function addItem(
        productId,
        priority,
        title,
        notes = '',
        metrics = [],
        devStatus = null,
        backlogPriority = 'media'
    ) {
        const resolvedBacklogPriority = isBacklogPriority(priority) ? backlogPriority : null;
        const fields = normalizeItemFields({
            title,
            notes,
            metrics,
            priority,
            devStatus,
            backlogPriority: resolvedBacklogPriority
        });
        if (!fields.title) return null;

        const entry = {
            id: `rm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            productId,
            ...fields,
            createdAt: new Date().toISOString()
        };

        if (isRoadmapApiEnabled()) {
            const saved = await apiCreateItem(entry);
            entry.id = saved?.id ?? entry.id;
            entry.backlogPriority = saved?.backlogPriority ?? entry.backlogPriority;
        }

        items.value = [...items.value, normalizeItem(entry)];
        persist();
        return entry;
    }

    async function removeItem(id) {
        if (isRoadmapApiEnabled()) {
            await apiDeleteItem(id);
        }

        items.value = items.value.filter((item) => item.id !== id);
        persist();
    }

    async function removeItemsByProduct(productId) {
        const count = items.value.filter((item) => item.productId === productId).length;

        if (isRoadmapApiEnabled()) {
            await apiDeleteItemsByProduct(productId);
        }

        items.value = items.value.filter((item) => item.productId !== productId);
        persist();
        return count;
    }

    async function updateItem(id, patch) {
        const current = items.value.find((item) => item.id === id);
        if (!current) return false;

        const productId = patch.productId ?? current.productId;
        const nextPriority = patch.priority ?? current.priority;
        let nextBacklogPriority =
            patch.backlogPriority !== undefined ? patch.backlogPriority : current.backlogPriority;

        if (isBacklogPriority(nextPriority)) {
            nextBacklogPriority = nextBacklogPriority || 'media';
        } else {
            nextBacklogPriority = null;
        }

        const merged = normalizeItemFields({
            title: patch.title ?? current.title,
            notes: patch.notes ?? current.notes ?? '',
            metrics: patch.metrics ?? current.metrics ?? [],
            priority: nextPriority,
            devStatus: patch.devStatus !== undefined ? patch.devStatus : current.devStatus,
            backlogPriority: nextBacklogPriority
        });

        if (!merged.title) return false;

        const next = { ...current, ...merged, productId };

        items.value = items.value.map((item) => (item.id === id ? next : item));

        if (isRoadmapApiEnabled()) {
            try {
                await apiUpdateItem(id, {
                    productId: next.productId,
                    priority: next.priority,
                    backlogPriority: next.backlogPriority,
                    title: next.title,
                    notes: next.notes,
                    metrics: next.metrics,
                    devStatus: next.devStatus
                });
            } catch (error) {
                items.value = items.value.map((item) => (item.id === id ? current : item));
                throw error;
            }
        }

        persist();
        return true;
    }

    async function saveItemFields(id, fields) {
        return updateItem(id, fields);
    }

    async function moveItemToPriority(id, priority, productId = null) {
        const item = items.value.find((entry) => entry.id === id);
        if (!item) return false;
        if (productId && productId !== item.productId) {
            return moveItemToCell(id, productId, priority);
        }
        if (item.priority === priority) return false;

        return updateItem(id, { priority });
    }

    async function moveItemToCell(id, productId, priority) {
        const item = items.value.find((entry) => entry.id === id);
        if (!item) return false;
        if (item.productId === productId && item.priority === priority) return false;

        return updateItem(id, { productId, priority });
    }

    async function moveItemToDevStatus(id, devStatus) {
        const item = items.value.find((entry) => entry.id === id);
        if (!item || !item.devStatus) return false;
        if (item.devStatus === devStatus) return false;

        return updateItem(id, { devStatus });
    }

    async function setItemInDevelopment(id, inDevelopment, devStatus = 'a_fazer') {
        return updateItem(id, { devStatus: inDevelopment ? devStatus : null });
    }

    async function moveItemToBacklog(id) {
        const item = items.value.find((entry) => entry.id === id);
        if (!item || isBacklogPriority(item.priority)) return false;

        const backlogPriority = isMatrixPriority(item.priority) ? item.priority : item.backlogPriority || 'media';

        return updateItem(id, {
            priority: BACKLOG_PRIORITY_ID,
            backlogPriority,
            devStatus: null
        });
    }

    async function promoteFromBacklog(id, productId, priority) {
        if (isBacklogPriority(priority)) return false;

        return updateItem(id, { productId, priority, backlogPriority: null });
    }

    async function moveBacklogItemToPriority(id, backlogPriority) {
        const item = items.value.find((entry) => entry.id === id);
        if (!item || !isBacklogPriority(item.priority)) return false;
        if (getBacklogTier(item) === backlogPriority) return false;

        return updateItem(id, { backlogPriority });
    }

    function countBacklogByPriority(tier) {
        return backlogItems.value.filter((item) => getBacklogTier(item) === tier).length;
    }

    async function finalizeConcludedItems() {
        const concluded = items.value.filter((item) => item.devStatus === 'concluido' && !isDelivered(item));
        if (!concluded.length) {
            return { count: 0, items: [] };
        }

        if (isRoadmapApiEnabled()) {
            const result = await api.finalizeDeliveries();
            const deliveredMap = new Map((result?.items ?? []).map((item) => [item.id, item]));

            items.value = items.value.map((item) => {
                const delivered = deliveredMap.get(item.id);
                if (delivered) {
                    return normalizeItem({ ...item, ...delivered, devStatus: null });
                }
                return item;
            });

            persist();
            return result ?? { count: deliveredMap.size, items: [...deliveredMap.values()] };
        }

        const deliveredAt = new Date().toISOString();
        items.value = items.value.map((item) => {
            if (item.devStatus === 'concluido') {
                return normalizeItem({ ...item, devStatus: null, deliveredAt });
            }
            return item;
        });
        persist();

        return {
            count: concluded.length,
            deliveredAt,
            items: items.value.filter((item) => item.deliveredAt === deliveredAt)
        };
    }

    function countByProduct(productId) {
        return items.value.filter(
            (item) => item.productId === productId && !isBacklogPriority(item.priority) && !isDelivered(item)
        ).length;
    }

    function countAllByProduct(productId) {
        return items.value.filter((item) => item.productId === productId).length;
    }

    function countBacklogByProduct(productId) {
        return items.value.filter((item) => item.productId === productId && isBacklogPriority(item.priority)).length;
    }

    function countByPriority(priority) {
        return items.value.filter(
            (item) => item.priority === priority && !isBacklogPriority(item.priority) && !isDelivered(item)
        ).length;
    }

    function countDevByProduct(productId) {
        return devItems.value.filter((item) => item.productId === productId).length;
    }

    return {
        items,
        isHydrated,
        backlogItems,
        matrixItems,
        devItems,
        deliveredItems,
        devStats,
        getCellItems,
        getDevItemsByStatus,
        getBacklogItemsByPriority,
        moveBacklogItemToPriority,
        addItem,
        removeItem,
        removeItemsByProduct,
        updateItem,
        saveItemFields,
        moveItemToPriority,
        moveItemToCell,
        moveItemToBacklog,
        promoteFromBacklog,
        moveItemToDevStatus,
        setItemInDevelopment,
        finalizeConcludedItems,
        countByProduct,
        countAllByProduct,
        countBacklogByProduct,
        countBacklogByPriority,
        countByPriority,
        countDevByProduct
    };
}

export function useRoadmapMatrix(roadmapType = 'saas') {
    const type = parseRoadmapType(unref(roadmapType));

    if (!matrixStores.has(type)) {
        matrixStores.set(type, createMatrixStore(type));
    }

    return matrixStores.get(type);
}
