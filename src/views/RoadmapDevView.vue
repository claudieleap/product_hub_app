<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import RoadmapPageHeader from '@/components/RoadmapPageHeader.vue';
import { ROADMAP_PRIORITIES } from '@/data/roadmapProducts';
import { ROADMAP_DEV_STATUSES } from '@/data/roadmapDevStatus';
import { useRoadmapMatrix } from '@/composables/useRoadmapMatrix';
import { useRoadmapProducts } from '@/composables/useRoadmapProducts';
import { useKanbanDrag } from '@/composables/useKanbanDrag';
import { useRoadmapMetrics } from '@/composables/useRoadmapMetrics';
import '@/assets/home.css';
import { getRoadmapReady } from '@/composables/roadmapLoader';
import { ENTREGAS_PATH, getRoadmapTypeMeta, parseRoadmapType, roadmapMatrixPath } from '@/config/roadmapTypes';

const props = defineProps({
    type: {
        type: String,
        default: 'saas'
    }
});

const route = useRoute();
const router = useRouter();
const roadmapType = computed(() => parseRoadmapType(props.type || route.params.type));
const typeMeta = computed(() => getRoadmapTypeMeta(roadmapType.value));
const roadmapReady = computed(() => getRoadmapReady(roadmapType.value).value);
const matrixPath = computed(() => roadmapMatrixPath(roadmapType.value));

const { devItems, getDevItemsByStatus, moveItemToDevStatus, updateItem, finalizeConcludedItems } =
    useRoadmapMatrix(roadmapType);
const { getProductById } = useRoadmapProducts(roadmapType);
const { getMetricLabels } = useRoadmapMetrics();

const dragError = ref(null);
const finalizeError = ref(null);
const finalizeLoading = ref(false);

const concludedCount = computed(() => getDevItemsByStatus('concluido').length);

const { draggingId, dropTargetKey: dragOverStatus, onPointerDown: onCardPointerDown } = useKanbanDrag({
    async onMove(item, zone) {
        dragError.value = null;

        try {
            return await moveItemToDevStatus(item.id, zone.dataset.statusId);
        } catch (error) {
            dragError.value = error.message || 'Não foi possível mover o card.';
            return false;
        }
    }
});

function productTitle(productId) {
    return getProductById(productId)?.title ?? productId;
}

function productAccent(productId) {
    return getProductById(productId)?.accent ?? '#1e4fe0';
}

function priorityLabel(priorityId) {
    return ROADMAP_PRIORITIES.find((p) => p.id === priorityId)?.label ?? priorityId;
}

function priorityClass(priorityId) {
    return ROADMAP_PRIORITIES.find((p) => p.id === priorityId)?.rowClass ?? '';
}

function metricSummary(metricIds = []) {
    return getMetricLabels(metricIds).join(' · ');
}

async function removeFromDev(item) {
    await updateItem(item.id, { devStatus: null });
}

async function handleFinalize() {
    if (!concludedCount.value || finalizeLoading.value) return;

    const confirmed = window.confirm(
        `Finalizar ${concludedCount.value} ${concludedCount.value === 1 ? 'item' : 'itens'} em Concluído? ` +
            'Eles sairão da matriz e do desenvolvimento e irão para Entregas.'
    );
    if (!confirmed) return;

    finalizeError.value = null;
    finalizeLoading.value = true;

    try {
        const result = await finalizeConcludedItems();
        if (result?.count > 0) {
            await router.push(ENTREGAS_PATH);
        }
    } catch (error) {
        finalizeError.value = error.message || 'Não foi possível finalizar as entregas.';
    } finally {
        finalizeLoading.value = false;
    }
}
</script>

<template>
    <VuePressLayout wide>
        <div class="home-page">
            <div v-if="!roadmapReady" class="wrap roadmap-loading">
                <p>Carregando roadmap...</p>
            </div>
            <div v-else class="wrap">
                <RoadmapPageHeader
                    view="dev"
                    title="Board de desenvolvimento"
                    subtitle="Arraste os cards entre as colunas para atualizar o status."
                />

                <p v-if="dragError" class="roadmap-sync-warning">{{ dragError }}</p>
                <p v-if="finalizeError" class="roadmap-sync-warning">{{ finalizeError }}</p>

                <section v-if="!devItems.length" class="roadmap-dev-empty">
                    <i class="pi pi-inbox" />
                    <h3>Nenhum item em desenvolvimento</h3>
                    <p>
                        Na <router-link :to="matrixPath">matriz do roadmap</router-link>, edite um item e marque
                        <strong>Enviar para desenvolvimento</strong> para ele aparecer aqui.
                    </p>
                </section>

                <section v-else class="roadmap-dev-board">
                    <div
                        v-for="status in ROADMAP_DEV_STATUSES"
                        :key="status.id"
                        :id="`dev-${status.id}`"
                        class="roadmap-dev-column"
                        :class="[status.rowClass, { 'roadmap-dev-column--drop-target': dragOverStatus === status.id }]"
                    >
                        <header class="roadmap-dev-column__head">
                            <div class="roadmap-dev-column__head-main">
                                <span class="roadmap-dev-column__title">
                                    <i :class="status.icon" />
                                    {{ status.label }}
                                </span>
                                <p v-if="status.description" class="roadmap-dev-column__desc">
                                    {{ status.description }}
                                </p>
                            </div>
                            <span class="roadmap-dev-column__count">{{ getDevItemsByStatus(status.id).length }}</span>
                        </header>

                        <div
                            class="roadmap-dev-column__body"
                            data-drop-zone
                            :data-zone-key="status.id"
                            :data-status-id="status.id"
                        >
                            <div
                                v-if="draggingId && dragOverStatus === status.id"
                                class="roadmap-dev-column__drop-hint"
                            >
                                Soltar aqui
                            </div>
                            <article
                                v-for="item in getDevItemsByStatus(status.id)"
                                :key="item.id"
                                class="roadmap-dev-card"
                                :class="{ 'roadmap-dev-card--dragging': draggingId === item.id }"
                                :style="{ '--feature-accent': productAccent(item.productId) }"
                                title="Arraste para outra coluna"
                                @pointerdown="onCardPointerDown($event, item)"
                            >
                                <div class="roadmap-dev-card__top">
                                    <span class="roadmap-dev-card__module">{{ productTitle(item.productId) }}</span>
                                    <button
                                        type="button"
                                        class="roadmap-dev-card__remove"
                                        data-no-drag
                                        title="Remover do desenvolvimento"
                                        @click.stop="removeFromDev(item)"
                                    >
                                        <i class="pi pi-times" />
                                    </button>
                                </div>
                                <h3 class="roadmap-dev-card__title">{{ item.title }}</h3>
                                <p v-if="item.notes" class="roadmap-dev-card__notes">{{ item.notes }}</p>
                                <div class="roadmap-dev-card__meta">
                                    <span class="roadmap-priority-pill" :class="priorityClass(item.priority)">
                                        {{ priorityLabel(item.priority) }}
                                    </span>
                                    <span
                                        v-if="item.metrics?.length"
                                        class="roadmap-dev-card__metrics"
                                        :title="metricSummary(item.metrics)"
                                    >
                                        <i class="pi pi-chart-line" />
                                        {{ item.metrics.length }}
                                    </span>
                                </div>
                            </article>
                            <button
                                v-if="status.id === 'concluido'"
                                type="button"
                                class="roadmap-dev-finalize-btn"
                                :disabled="!concludedCount || finalizeLoading"
                                @click="handleFinalize"
                            >
                                <i class="pi pi-check-circle" />
                                {{ finalizeLoading ? 'Finalizando...' : 'Finalizar' }}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </VuePressLayout>
</template>
