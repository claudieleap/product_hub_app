<script setup>
import { ref } from 'vue';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import RoadmapTabs from '@/components/RoadmapTabs.vue';
import { ROADMAP_PRIORITIES } from '@/data/roadmapProducts';
import { ROADMAP_DEV_STATUSES } from '@/data/roadmapDevStatus';
import { useRoadmapMatrix } from '@/composables/useRoadmapMatrix';
import { useRoadmapProducts } from '@/composables/useRoadmapProducts';
import { getMetricLabels } from '@/data/roadmapMetrics';
import '@/assets/home.css';
import { roadmapReady } from '@/composables/roadmapLoader';

const { devItems, getDevItemsByStatus, moveItemToDevStatus, updateItem } = useRoadmapMatrix();
const { allProducts, getProductById } = useRoadmapProducts();

const draggingId = ref(null);
const dragOverStatus = ref(null);
const suppressClick = ref(false);

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

function onDragStart(event, item) {
    draggingId.value = item.id;
    suppressClick.value = false;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id);
}

function onDragEnd() {
    draggingId.value = null;
    dragOverStatus.value = null;
}

function onDragOver(event, statusId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    dragOverStatus.value = statusId;
}

function onDragLeave(statusId) {
    if (dragOverStatus.value === statusId) dragOverStatus.value = null;
}

async function onDrop(event, statusId) {
    event.preventDefault();
    const itemId = draggingId.value ?? event.dataTransfer.getData('text/plain');
    const moved = await moveItemToDevStatus(itemId, statusId);
    if (moved) suppressClick.value = true;
    onDragEnd();
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
                    <span class="home-hero__eyebrow">Roadmap</span>
                    <h1>Board de desenvolvimento</h1>
                    <p class="home-hero__lead">
                        Visão executiva do que saiu da matriz para execução. Acompanhe o avanço por status e módulo.
                    </p>
                    <RoadmapTabs />
                </section>

                <section v-if="!devItems.length" class="roadmap-dev-empty">
                    <i class="pi pi-inbox" />
                    <h3>Nenhum item em desenvolvimento</h3>
                    <p>
                        Na <router-link to="/roadmap">matriz do roadmap</router-link>, edite um item e marque
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
                        @dragover="onDragOver($event, status.id)"
                        @dragleave="onDragLeave(status.id)"
                        @drop="onDrop($event, status.id)"
                    >
                        <header class="roadmap-dev-column__head">
                            <span class="roadmap-dev-column__title">
                                <i :class="status.icon" />
                                {{ status.label }}
                            </span>
                            <span class="roadmap-dev-column__count">{{ getDevItemsByStatus(status.id).length }}</span>
                        </header>

                        <div class="roadmap-dev-column__body">
                            <article
                                v-for="item in getDevItemsByStatus(status.id)"
                                :key="item.id"
                                class="roadmap-dev-card"
                                :class="{ 'roadmap-dev-card--dragging': draggingId === item.id }"
                                :style="{ '--feature-accent': productAccent(item.productId) }"
                                draggable="true"
                                @dragstart="onDragStart($event, item)"
                                @dragend="onDragEnd"
                            >
                                <div class="roadmap-dev-card__top">
                                    <span class="roadmap-dev-card__module">{{ productTitle(item.productId) }}</span>
                                    <button
                                        type="button"
                                        class="roadmap-dev-card__remove"
                                        title="Remover do desenvolvimento"
                                        draggable="false"
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
