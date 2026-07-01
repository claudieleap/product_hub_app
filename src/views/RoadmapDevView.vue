<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import RoadmapTabs from '@/components/RoadmapTabs.vue';
import { ROADMAP_PRIORITIES } from '@/data/roadmapProducts';
import { ROADMAP_DEV_STATUSES } from '@/data/roadmapDevStatus';
import { useRoadmapMatrix } from '@/composables/useRoadmapMatrix';
import { useRoadmapProducts } from '@/composables/useRoadmapProducts';
import { useKanbanDrag } from '@/composables/useKanbanDrag';
import { getMetricLabels } from '@/data/roadmapMetrics';
import '@/assets/home.css';
import { getRoadmapReady } from '@/composables/roadmapLoader';
import { getRoadmapTypeMeta, parseRoadmapType, roadmapMatrixPath } from '@/config/roadmapTypes';

const props = defineProps({
    type: {
        type: String,
        default: 'saas'
    }
});

const route = useRoute();
const roadmapType = computed(() => parseRoadmapType(props.type || route.params.type));
const typeMeta = computed(() => getRoadmapTypeMeta(roadmapType.value));
const roadmapReady = computed(() => getRoadmapReady(roadmapType.value).value);
const matrixPath = computed(() => roadmapMatrixPath(roadmapType.value));

const { devItems, getDevItemsByStatus, moveItemToDevStatus, updateItem } = useRoadmapMatrix(roadmapType);
const { getProductById } = useRoadmapProducts(roadmapType);

const dragError = ref(null);

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
</script>

<template>
    <VuePressLayout wide>
        <div class="home-page">
            <div v-if="!roadmapReady" class="wrap roadmap-loading">
                <p>Carregando roadmap...</p>
            </div>
            <div v-else class="wrap">
                <section class="roadmap-page-header vp-doc">
                    <span class="home-hero__eyebrow">Roadmap {{ typeMeta.label }}</span>
                    <h1>Board de desenvolvimento</h1>
                    <p class="home-hero__lead">
                        Visão executiva do roadmap {{ typeMeta.label.toLowerCase() }} em execução. Arraste os cards entre as colunas para atualizar o status.
                    </p>
                    <RoadmapTabs />
                </section>

                <p v-if="dragError" class="roadmap-sync-warning">{{ dragError }}</p>

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
                            <span class="roadmap-dev-column__title">
                                <i :class="status.icon" />
                                {{ status.label }}
                            </span>
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
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </VuePressLayout>
</template>
