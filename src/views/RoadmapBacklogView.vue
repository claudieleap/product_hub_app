<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import RoadmapPageHeader from '@/components/RoadmapPageHeader.vue';
import RoadmapItemFormDialog from '@/components/RoadmapItemFormDialog.vue';
import { BACKLOG_PRIORITY_ID, MATRIX_PRIORITIES, ROADMAP_PRIORITIES } from '@/data/roadmapProducts';
import { useRoadmapMatrix } from '@/composables/useRoadmapMatrix';
import { useRoadmapProducts } from '@/composables/useRoadmapProducts';
import { useRoadmapMetrics } from '@/composables/useRoadmapMetrics';
import { useKanbanDrag } from '@/composables/useKanbanDrag';
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

const {
    backlogItems,
    addItem,
    removeItem,
    updateItem,
    promoteFromBacklog,
    getBacklogItemsByPriority,
    moveBacklogItemToPriority,
    countBacklogByPriority
} = useRoadmapMatrix(roadmapType);
const { allProducts, getProductById } = useRoadmapProducts(roadmapType);
const { metricsGrouped, getMetricLabels } = useRoadmapMetrics();

const dialogVisible = ref(false);
const dialogMode = ref('add');
const editingId = ref(null);
const dialogProductId = ref('');
const dialogBacklogPriority = ref('media');
const dialogTitle = ref('');
const dialogNotes = ref('');
const dialogMetrics = ref([]);

const promoteVisible = ref(false);
const promoteItem = ref(null);
const promoteProductId = ref('');
const promotePriority = ref('media');
const promoteError = ref(null);

const deleteConfirmVisible = ref(false);
const pendingDelete = ref(null);
const dragError = ref(null);

const { draggingId, dropTargetKey: dragOverPriority, suppressClick, onPointerDown: onCardPointerDown } = useKanbanDrag({
    async onMove(item, zone) {
        dragError.value = null;

        try {
            return await moveBacklogItemToPriority(item.id, zone.dataset.priorityId);
        } catch (error) {
            dragError.value = error.message || 'Não foi possível mover o item.';
            return false;
        }
    }
});

function productTitle(productId) {
    return getProductById(productId)?.title ?? productId;
}

function productAccent(productId) {
    return getProductById(productId)?.accent ?? '#64748b';
}

function metricSummary(metricIds = []) {
    return getMetricLabels(metricIds).join(' · ');
}

function openAddDialog(priorityId = 'media') {
    dialogMode.value = 'add';
    editingId.value = null;
    dialogProductId.value = allProducts.value[0]?.id ?? '';
    dialogBacklogPriority.value = priorityId;
    dialogTitle.value = '';
    dialogNotes.value = '';
    dialogMetrics.value = [];
    dialogVisible.value = true;
}

function openEditDialog(item) {
    dialogMode.value = 'edit';
    editingId.value = item.id;
    dialogProductId.value = item.productId;
    dialogBacklogPriority.value = item.backlogPriority || 'media';
    dialogTitle.value = item.title;
    dialogNotes.value = item.notes ?? '';
    dialogMetrics.value = item.metrics ? [...item.metrics] : [];
    dialogVisible.value = true;
}

function handleCardClick(item) {
    if (suppressClick.value) {
        suppressClick.value = false;
        return;
    }

    openEditDialog(item);
}

async function confirmSave() {
    if (!dialogTitle.value.trim() || !dialogProductId.value) return;

    if (dialogMode.value === 'add') {
        await addItem(
            dialogProductId.value,
            BACKLOG_PRIORITY_ID,
            dialogTitle.value,
            dialogNotes.value,
            dialogMetrics.value,
            null,
            dialogBacklogPriority.value
        );
    } else if (editingId.value) {
        await updateItem(editingId.value, {
            productId: dialogProductId.value,
            backlogPriority: dialogBacklogPriority.value,
            title: dialogTitle.value,
            notes: dialogNotes.value,
            metrics: dialogMetrics.value
        });
    }

    dialogVisible.value = false;
}

function openPromoteDialog(item) {
    promoteItem.value = item;
    promoteProductId.value = item.productId;
    promotePriority.value = item.backlogPriority || 'media';
    promoteError.value = null;
    promoteVisible.value = true;
}

async function confirmPromote() {
    if (!promoteItem.value || !promoteProductId.value || !promotePriority.value) return;

    promoteError.value = null;

    try {
        const ok = await promoteFromBacklog(
            promoteItem.value.id,
            promoteProductId.value,
            promotePriority.value
        );
        if (!ok) return;
        promoteVisible.value = false;
        promoteItem.value = null;
    } catch (error) {
        promoteError.value = error.message || 'Não foi possível enviar para a matriz.';
    }
}

function requestRemove(item) {
    pendingDelete.value = item;
    deleteConfirmVisible.value = true;
}

async function confirmRemove() {
    if (pendingDelete.value) {
        await removeItem(pendingDelete.value.id);
    }
    deleteConfirmVisible.value = false;
    pendingDelete.value = null;
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
                    view="backlog"
                    title="Backlog"
                    subtitle="Ideias sem slot na matriz. Priorize aqui e envie para a matriz quando estiver pronto."
                >
                    <template #actions>
                        <div class="roadmap-stats roadmap-stats--inline">
                            <span class="roadmap-stat"><b>{{ backlogItems.length }}</b> itens</span>
                        </div>
                        <Button
                            type="button"
                            icon="pi pi-plus"
                            label="Novo item"
                            :disabled="!allProducts.length"
                            @click="openAddDialog()"
                        />
                    </template>
                </RoadmapPageHeader>

                <p v-if="dragError" class="roadmap-sync-warning">{{ dragError }}</p>

                <p class="roadmap-matrix-hint">
                    Colunas = prioridade sugerida · arraste cards entre colunas para reclassificar.
                </p>

                <section v-if="!backlogItems.length" class="roadmap-dev-empty roadmap-backlog-empty">
                    <i class="pi pi-inbox" />
                    <h3>Backlog vazio</h3>
                    <p>
                        Adicione itens aqui antes de priorizá-los na
                        <router-link :to="matrixPath">matriz do roadmap</router-link>.
                    </p>
                    <Button
                        v-if="allProducts.length"
                        type="button"
                        icon="pi pi-plus"
                        label="Adicionar ao backlog"
                        @click="openAddDialog()"
                    />
                </section>

                <section v-else class="roadmap-dev-board roadmap-backlog-board">
                    <div
                        v-for="priority in MATRIX_PRIORITIES"
                        :key="priority.id"
                        :id="`backlog-${priority.id}`"
                        class="roadmap-dev-column roadmap-backlog-column"
                        :class="[
                            priority.rowClass,
                            { 'roadmap-dev-column--drop-target': dragOverPriority === priority.id }
                        ]"
                    >
                        <header class="roadmap-dev-column__head">
                            <div class="roadmap-dev-column__head-main">
                                <span class="roadmap-dev-column__title">
                                    <span class="roadmap-priority-pill" :class="priority.rowClass">
                                        {{ priority.label }}
                                    </span>
                                </span>
                            </div>
                            <span class="roadmap-dev-column__count">{{ countBacklogByPriority(priority.id) }}</span>
                        </header>

                        <div
                            class="roadmap-dev-column__body"
                            data-drop-zone
                            :data-zone-key="priority.id"
                            :data-priority-id="priority.id"
                        >
                            <div
                                v-if="draggingId && dragOverPriority === priority.id"
                                class="roadmap-dev-column__drop-hint"
                            >
                                Soltar aqui
                            </div>

                            <article
                                v-for="item in getBacklogItemsByPriority(priority.id)"
                                :key="item.id"
                                class="roadmap-backlog-card roadmap-backlog-card--draggable"
                                :class="{ 'roadmap-dev-card--dragging': draggingId === item.id }"
                                :style="{ '--feature-accent': productAccent(item.productId) }"
                                title="Arraste para outra coluna ou clique para editar"
                                @pointerdown="onCardPointerDown($event, item)"
                                @click="handleCardClick(item)"
                            >
                                <div class="roadmap-backlog-card__top">
                                    <span class="roadmap-dev-card__module">{{ productTitle(item.productId) }}</span>
                                    <div class="roadmap-backlog-card__actions">
                                        <button
                                            type="button"
                                            class="roadmap-backlog-card__icon-btn"
                                            data-no-drag
                                            title="Editar"
                                            @click.stop="openEditDialog(item)"
                                        >
                                            <i class="pi pi-pencil" />
                                        </button>
                                        <button
                                            type="button"
                                            class="roadmap-backlog-card__icon-btn roadmap-backlog-card__icon-btn--danger"
                                            data-no-drag
                                            title="Excluir"
                                            @click.stop="requestRemove(item)"
                                        >
                                            <i class="pi pi-trash" />
                                        </button>
                                    </div>
                                </div>
                                <h3 class="roadmap-backlog-card__title">{{ item.title }}</h3>
                                <div class="roadmap-backlog-card__footer">
                                    <span
                                        v-if="item.metrics?.length"
                                        class="roadmap-dev-card__metrics"
                                        :title="metricSummary(item.metrics)"
                                    >
                                        <i class="pi pi-chart-line" />
                                        {{ item.metrics.length }}
                                    </span>
                                    <Button
                                        type="button"
                                        size="small"
                                        icon="pi pi-arrow-right"
                                        label="Enviar para matriz"
                                        data-no-drag
                                        @click.stop="openPromoteDialog(item)"
                                    />
                                </div>
                            </article>

                            <button
                                type="button"
                                class="roadmap-backlog-add-card"
                                @click="openAddDialog(priority.id)"
                            >
                                <i class="pi pi-plus" />
                                Adicionar
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <RoadmapItemFormDialog
            v-model:visible="dialogVisible"
            v-model:product-id="dialogProductId"
            v-model:title="dialogTitle"
            v-model:notes="dialogNotes"
            v-model:priority="dialogBacklogPriority"
            v-model:metrics="dialogMetrics"
            :mode="dialogMode"
            variant="backlog"
            :all-products="allProducts"
            :priority-options="MATRIX_PRIORITIES"
            :metrics-grouped="metricsGrouped"
            :get-product-by-id="getProductById"
            @save="confirmSave"
        />

        <Dialog
            v-model:visible="promoteVisible"
            modal
            header="Enviar para a matriz"
            class="roadmap-form-dialog"
            :style="{ width: 'min(480px, 94vw)' }"
        >
            <p class="roadmap-dialog-hint roadmap-backlog-promote-lead">
                O item entra na matriz com a prioridade escolhida (pré-preenchida pelo backlog).
            </p>
            <p v-if="promoteError" class="roadmap-sync-warning">{{ promoteError }}</p>
            <div class="roadmap-dialog-field">
                <label for="promote-module">Módulo</label>
                <Select
                    id="promote-module"
                    v-model="promoteProductId"
                    :options="allProducts"
                    option-label="title"
                    option-value="id"
                    class="w-full"
                />
            </div>
            <div class="roadmap-dialog-field">
                <label for="promote-priority">Prioridade na matriz</label>
                <Select
                    id="promote-priority"
                    v-model="promotePriority"
                    :options="MATRIX_PRIORITIES"
                    option-label="label"
                    option-value="id"
                    class="w-full"
                >
                    <template #value="{ value }">
                        <span
                            v-if="value"
                            class="roadmap-priority-pill"
                            :class="ROADMAP_PRIORITIES.find((p) => p.id === value)?.rowClass"
                        >
                            {{ ROADMAP_PRIORITIES.find((p) => p.id === value)?.label }}
                        </span>
                    </template>
                    <template #option="{ option }">
                        <span class="roadmap-priority-pill" :class="option.rowClass">{{ option.label }}</span>
                    </template>
                </Select>
            </div>
            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="promoteVisible = false" />
                <Button
                    label="Enviar para matriz"
                    icon="pi pi-arrow-right"
                    :disabled="!promoteProductId || !promotePriority"
                    @click="confirmPromote"
                />
            </template>
        </Dialog>

        <Dialog
            v-model:visible="deleteConfirmVisible"
            modal
            header="Excluir item"
            :style="{ width: 'min(420px, 94vw)' }"
        >
            <p>Excluir <strong>{{ pendingDelete?.title }}</strong> do backlog?</p>
            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="deleteConfirmVisible = false" />
                <Button label="Sim, excluir" severity="danger" icon="pi pi-trash" @click="confirmRemove" />
            </template>
        </Dialog>
    </VuePressLayout>
</template>
