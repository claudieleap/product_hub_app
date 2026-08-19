<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import VuePressLayout from '@/layouts/VuePressLayout.vue';
import RoadmapPageHeader from '@/components/RoadmapPageHeader.vue';
import RoadmapItemFormDialog from '@/components/RoadmapItemFormDialog.vue';
import { ROADMAP_PRIORITIES } from '@/data/roadmapProducts';
import { useRoadmapMatrix } from '@/composables/useRoadmapMatrix';
import {
    MODULE_ACCENT_OPTIONS,
    MODULE_ICON_OPTIONS,
    useRoadmapProducts
} from '@/composables/useRoadmapProducts';
import { useRoadmapMetrics } from '@/composables/useRoadmapMetrics';
import '@/assets/home.css';
import { getRoadmapReady, getRoadmapSyncError } from '@/composables/roadmapLoader';
import { useKanbanDrag } from '@/composables/useKanbanDrag';
import { getRoadmapTypeMeta, parseRoadmapType, roadmapBacklogPath, roadmapDevPath } from '@/config/roadmapTypes';

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
const roadmapSyncError = computed(() => getRoadmapSyncError(roadmapType.value).value);
const devBoardPath = computed(() => roadmapDevPath(roadmapType.value));
const backlogPath = computed(() => roadmapBacklogPath(roadmapType.value));

const { getCellItems, addItem, removeItem, removeItemsByProduct, updateItem, saveItemFields, moveItemToCell, moveItemToBacklog, matrixItems, backlogItems, countByProduct, countAllByProduct, countByPriority } = useRoadmapMatrix(roadmapType);
const { allProducts, getProductById, addProduct, removeModule, upsertProduct } = useRoadmapProducts(roadmapType);
const { metricsGrouped, getMetricLabels } = useRoadmapMetrics();

const dialogVisible = ref(false);
const dialogMode = ref('add');
const editingId = ref(null);
const dialogProductId = ref('');
const dialogPriority = ref('media');
const dialogTitle = ref('');
const dialogNotes = ref('');
const dialogMetrics = ref([]);
const dialogInDevelopment = ref(false);
const dialogDevStatus = ref('a_fazer');
const editSnapshot = ref(null);
const dialogSaved = ref(false);

const deleteConfirmVisible = ref(false);
const pendingDeleteFeature = ref(null);

const deleteModuleConfirmVisible = ref(false);
const pendingDeleteModule = ref(null);

const moduleDialogVisible = ref(false);
const moduleDialogMode = ref('add');
const editingModuleId = ref(null);
const moduleTitle = ref('');
const moduleDescription = ref('');
const moduleIcon = ref('pi pi-box');
const moduleAccent = ref('#1e4fe0');

const moduleMenu = ref(null);
const moduleMenuProduct = ref(null);

const moduleMenuItems = computed(() => {
    if (!moduleMenuProduct.value) return [];

    return [
        {
            label: 'Renomear',
            icon: 'pi pi-pencil',
            command: () => openEditModuleDialog(moduleMenuProduct.value)
        },
        {
            label: 'Excluir',
            icon: 'pi pi-trash',
            class: 'roadmap-module-menu__danger',
            command: () => requestRemoveModule(moduleMenuProduct.value)
        }
    ];
});

const dragError = ref(null);

const { draggingId: draggingFeatureId, dropTargetKey: dragOverCellKey, suppressClick: suppressFeatureClick, onPointerDown: onCardPointerDown } = useKanbanDrag({
    async onMove(item, zone) {
        dragError.value = null;

        try {
            return await moveItemToCell(item.id, zone.dataset.productId, zone.dataset.priorityId);
        } catch (error) {
            dragError.value = error.message || 'Não foi possível mover o item.';
            return false;
        }
    }
});

const totalFeatures = computed(() => matrixItems.value.length);

function openAddDialog(product, priority) {
    dialogMode.value = 'add';
    editingId.value = null;
    editSnapshot.value = null;
    dialogSaved.value = false;
    dialogProductId.value = product.id;
    dialogPriority.value = priority.id;
    dialogTitle.value = '';
    dialogNotes.value = '';
    dialogMetrics.value = [];
    dialogInDevelopment.value = false;
    dialogDevStatus.value = 'a_fazer';
    dialogVisible.value = true;
}

function openEditDialog(feature, product) {
    if (suppressFeatureClick.value) {
        suppressFeatureClick.value = false;
        return;
    }

    dialogMode.value = 'edit';
    editingId.value = feature.id;
    dialogProductId.value = feature.productId;
    dialogPriority.value = feature.priority;
    dialogTitle.value = feature.title;
    dialogNotes.value = feature.notes ?? '';
    dialogMetrics.value = feature.metrics ? [...feature.metrics] : [];
    dialogInDevelopment.value = Boolean(feature.devStatus);
    dialogDevStatus.value = feature.devStatus ?? 'a_fazer';
    editSnapshot.value = {
        productId: feature.productId,
        priority: feature.priority,
        title: feature.title,
        notes: feature.notes ?? '',
        metrics: feature.metrics ? [...feature.metrics] : [],
        devStatus: feature.devStatus ?? null
    };
    dialogSaved.value = false;
    dialogVisible.value = true;
}

function metricSummary(metricIds = []) {
    return getMetricLabels(metricIds).join(' · ');
}

function cellKey(productId, priorityId) {
    return `${productId}:${priorityId}`;
}

function isDropTarget(productId, priorityId) {
    return dragOverCellKey.value === cellKey(productId, priorityId);
}

watch(dialogPriority, (priority, previous) => {
    if (!dialogVisible.value || dialogMode.value !== 'edit' || !editingId.value) return;
    if (priority !== previous) {
        void updateItem(editingId.value, { priority });
    }
});

watch(dialogProductId, (productId, previous) => {
    if (!dialogVisible.value || dialogMode.value !== 'edit' || !editingId.value) return;
    if (productId && productId !== previous) {
        void updateItem(editingId.value, { productId });
    }
});

watch(dialogVisible, (visible) => {
    if (visible) return;
    if (dialogMode.value === 'edit' && editingId.value && editSnapshot.value && !dialogSaved.value) {
        void saveItemFields(editingId.value, editSnapshot.value);
    }
    editSnapshot.value = null;
    dialogSaved.value = false;
});

function itemFieldsFromDialog() {
    return {
        productId: dialogProductId.value,
        priority: dialogPriority.value,
        title: dialogTitle.value,
        notes: dialogNotes.value,
        metrics: dialogMetrics.value,
        devStatus: dialogInDevelopment.value ? dialogDevStatus.value : null
    };
}

async function confirmSave() {
    if (!dialogTitle.value.trim()) return;

    const fields = itemFieldsFromDialog();

    if (dialogMode.value === 'add') {
        if (!(await addItem(fields.productId, fields.priority, fields.title, fields.notes, fields.metrics, fields.devStatus))) return;
    } else if (editingId.value) {
        if (!(await saveItemFields(editingId.value, fields))) return;
    }

    dialogSaved.value = true;
    dialogVisible.value = false;
}

async function sendToBacklog() {
    if (!editingId.value) return;

    dialogSaved.value = true;
    await moveItemToBacklog(editingId.value);
    dialogVisible.value = false;
}

function closeItemDialog() {
    dialogVisible.value = false;
}

function requestRemove(feature) {
    pendingDeleteFeature.value = feature;
    deleteConfirmVisible.value = true;
}

function cancelRemove() {
    deleteConfirmVisible.value = false;
    pendingDeleteFeature.value = null;
}

async function confirmRemove() {
    if (pendingDeleteFeature.value) {
        await removeItem(pendingDeleteFeature.value.id);
    }
    cancelRemove();
}

function requestRemoveModule(product) {
    if (!product) return;
    pendingDeleteModule.value = product;
    deleteModuleConfirmVisible.value = true;
}

function cancelRemoveModule() {
    deleteModuleConfirmVisible.value = false;
    pendingDeleteModule.value = null;
}

async function confirmRemoveModule() {
    if (!pendingDeleteModule.value) return;

    await removeItemsByProduct(pendingDeleteModule.value.id);
    await removeModule(pendingDeleteModule.value.id);
    cancelRemoveModule();
}

function openModuleDialog() {
    moduleDialogMode.value = 'add';
    editingModuleId.value = null;
    moduleTitle.value = '';
    moduleDescription.value = '';
    moduleIcon.value = 'pi pi-box';
    moduleAccent.value = '#1e4fe0';
    moduleDialogVisible.value = true;
}

function openEditModuleDialog(product) {
    if (!product) return;

    moduleDialogMode.value = 'edit';
    editingModuleId.value = product.id;
    moduleTitle.value = product.title;
    moduleDescription.value = product.description ?? '';
    moduleIcon.value = product.icon ?? 'pi pi-box';
    moduleAccent.value = product.accent ?? '#1e4fe0';
    moduleDialogVisible.value = true;
}

function toggleModuleMenu(event, product) {
    moduleMenuProduct.value = product;
    moduleMenu.value?.toggle(event);
}

async function confirmSaveModule() {
    if (!moduleTitle.value.trim()) return;

    if (moduleDialogMode.value === 'add') {
        const created = await addProduct({
            title: moduleTitle.value,
            description: moduleDescription.value,
            icon: moduleIcon.value,
            accent: moduleAccent.value
        });

        if (!created) return;

        moduleDialogVisible.value = false;

        nextTick(() => {
            document.getElementById(`product-${created.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        return;
    }

    if (!editingModuleId.value) return;

    const updated = await upsertProduct(editingModuleId.value, {
        title: moduleTitle.value,
        description: moduleDescription.value,
        icon: moduleIcon.value,
        accent: moduleAccent.value
    });

    if (!updated) return;

    moduleDialogVisible.value = false;
}
</script>

<template>
    <VuePressLayout wide>
        <div class="home-page">
        <div v-if="!roadmapReady" class="wrap roadmap-loading">
            <p>Carregando roadmap...</p>
        </div>
        <div v-else class="wrap">
            <p v-if="roadmapSyncError" class="roadmap-sync-warning">
                {{ roadmapSyncError }} — exibindo dados locais como fallback.
            </p>
            <p v-if="dragError" class="roadmap-sync-warning">{{ dragError }}</p>
            <RoadmapPageHeader
                view="matrix"
                title="Matriz de itens"
                :subtitle="typeMeta.tagline"
            >
                <template #actions>
                    <div class="roadmap-stats roadmap-stats--inline">
                        <span class="roadmap-stat"><b>{{ totalFeatures }}</b> na matriz</span>
                        <router-link :to="backlogPath" class="roadmap-stat roadmap-stat--link">
                            <b>{{ backlogItems.length }}</b> no backlog
                        </router-link>
                        <span class="roadmap-stat"><b>{{ allProducts.length }}</b> módulos</span>
                        <span class="roadmap-stat"><b>{{ ROADMAP_PRIORITIES.length }}</b> níveis</span>
                    </div>
                    <Button
                        type="button"
                        class="roadmap-add-module-btn"
                        icon="pi pi-plus"
                        label="Novo módulo"
                        @click="openModuleDialog"
                    />
                </template>
            </RoadmapPageHeader>

            <p class="roadmap-matrix-hint">
                Colunas = prioridade · linhas = módulos · arraste cards entre células para reorganizar.
            </p>

            <section class="roadmap-section">
                <div class="roadmap-matrix-wrap">
                    <div
                        class="roadmap-matrix"
                        :style="{ gridTemplateColumns: `200px repeat(${ROADMAP_PRIORITIES.length}, minmax(200px, 1fr))` }"
                    >
                        <div class="roadmap-matrix__corner">Módulo ↓ · Prioridade →</div>

                        <div
                            v-for="priority in ROADMAP_PRIORITIES"
                            :key="priority.id"
                            :id="`priority-${priority.id}`"
                            class="roadmap-col-header roadmap-col-header--priority"
                            :class="priority.rowClass"
                        >
                            <span class="roadmap-row-label__badge">{{ priority.label }}</span>
                            <span class="roadmap-col-header__count">{{ countByPriority(priority.id) }}</span>
                        </div>

                        <template v-for="product in allProducts" :key="product.id">
                            <div
                                class="roadmap-row-label roadmap-row-label--product"
                                :class="{ 'roadmap-row-label--custom': product.custom }"
                                :id="`product-${product.id}`"
                            >
                                <div class="roadmap-row-label__top">
                                    <span class="roadmap-col-header__icon" :style="{ background: product.accent }">
                                        <i :class="product.icon" />
                                    </span>
                                    <span class="roadmap-row-label__title">{{ product.title }}</span>
                                    <span class="roadmap-col-header__count">{{ countByProduct(product.id) }}</span>
                                    <button
                                        type="button"
                                        class="roadmap-module__menu"
                                        title="Opções do módulo"
                                        aria-label="Opções do módulo"
                                        @click.stop="toggleModuleMenu($event, product)"
                                    >
                                        <i class="pi pi-ellipsis-v" />
                                    </button>
                                </div>
                                <p class="roadmap-row-label__desc">{{ product.description }}</p>
                            </div>

                            <div
                                v-for="priority in ROADMAP_PRIORITIES"
                                :key="`${product.id}-${priority.id}`"
                                class="roadmap-cell"
                                :class="{ 'roadmap-cell--drop-target': isDropTarget(product.id, priority.id) }"
                                data-drop-zone
                                :data-zone-key="cellKey(product.id, priority.id)"
                                :data-product-id="product.id"
                                :data-priority-id="priority.id"
                            >
                                <div
                                    v-if="draggingFeatureId && isDropTarget(product.id, priority.id)"
                                    class="roadmap-cell__drop-hint"
                                >
                                    Soltar aqui
                                </div>
                                <div
                                    v-for="feature in getCellItems(product.id, priority.id)"
                                    :key="feature.id"
                                    class="roadmap-feature"
                                    :class="{ 'roadmap-feature--dragging': draggingFeatureId === feature.id }"
                                    :style="{ '--feature-accent': product.accent }"
                                    title="Arraste para outra célula ou clique para editar"
                                    @pointerdown="onCardPointerDown($event, feature)"
                                    @click="openEditDialog(feature, product)"
                                    @keydown.enter="openEditDialog(feature, product)"
                                >
                                    <div class="roadmap-feature__body">
                                        <span class="roadmap-feature__text">{{ feature.title }}</span>
                                        <span v-if="feature.devStatus" class="roadmap-feature__dev-badge" title="Em desenvolvimento">
                                            <i class="pi pi-code" />
                                            Dev
                                        </span>
                                        <span
                                            v-if="feature.metrics?.length"
                                            class="roadmap-feature__metrics"
                                            :title="metricSummary(feature.metrics)"
                                        >
                                            <i class="pi pi-chart-line" />
                                            {{ feature.metrics.length }}
                                            {{ feature.metrics.length === 1 ? 'métrica' : 'métricas' }}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        class="roadmap-feature__remove"
                                        data-no-drag
                                        title="Remover"
                                        @click.stop="requestRemove(feature)"
                                    >
                                        <i class="pi pi-times" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    class="roadmap-add-btn"
                                    @click="openAddDialog(product, priority)"
                                >
                                    + item
                                </button>
                            </div>
                        </template>
                    </div>
                </div>
            </section>
        </div>

        <Teleport to="body">
        <Menu ref="moduleMenu" :model="moduleMenuItems" :popup="true" />
        <Dialog
            v-model:visible="moduleDialogVisible"
            modal
            class="roadmap-form-dialog"
            :header="moduleDialogMode === 'edit' ? 'Renomear módulo' : 'Novo módulo'"
            append-to="body"
            :style="{ width: 'min(440px, 94vw)' }"
            :draggable="false"
            :breakpoints="{ '960px': '94vw' }"
        >
            <p v-if="moduleDialogMode === 'add'" class="roadmap-module-intro">
                O módulo será adicionado como uma nova linha na matriz, com células para cada prioridade.
            </p>
            <p v-else class="roadmap-module-intro">
                Atualize o nome, descrição, ícone ou cor do módulo na matriz.
            </p>
            <div class="roadmap-dialog-field">
                <label for="module-title">Nome do módulo</label>
                <InputText
                    id="module-title"
                    v-model="moduleTitle"
                    class="w-full"
                    placeholder="Ex.: Repasse Médico"
                    @keyup.enter="confirmSaveModule"
                />
            </div>
            <div class="roadmap-dialog-field">
                <label for="module-description">Descrição (opcional)</label>
                <Textarea
                    id="module-description"
                    v-model="moduleDescription"
                    class="w-full"
                    rows="3"
                    placeholder="O que este módulo cobre no produto..."
                />
            </div>
            <div class="roadmap-dialog-field">
                <label for="module-icon">Ícone</label>
                <Select
                    id="module-icon"
                    v-model="moduleIcon"
                    :options="MODULE_ICON_OPTIONS"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                >
                    <template #value="{ value }">
                        <span v-if="value" class="roadmap-module-option">
                            <i :class="value" />
                            {{ MODULE_ICON_OPTIONS.find((o) => o.value === value)?.label }}
                        </span>
                    </template>
                    <template #option="{ option }">
                        <span class="roadmap-module-option">
                            <i :class="option.value" />
                            {{ option.label }}
                        </span>
                    </template>
                </Select>
            </div>
            <div class="roadmap-dialog-field">
                <label for="module-accent">Cor do módulo</label>
                <Select
                    id="module-accent"
                    v-model="moduleAccent"
                    :options="MODULE_ACCENT_OPTIONS"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                >
                    <template #value="{ value }">
                        <span v-if="value" class="roadmap-module-option">
                            <span class="roadmap-module-swatch" :style="{ background: value }" />
                            {{ MODULE_ACCENT_OPTIONS.find((o) => o.value === value)?.label }}
                        </span>
                    </template>
                    <template #option="{ option }">
                        <span class="roadmap-module-option">
                            <span class="roadmap-module-swatch" :style="{ background: option.value }" />
                            {{ option.label }}
                        </span>
                    </template>
                </Select>
            </div>
            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="moduleDialogVisible = false" />
                <Button
                    :label="moduleDialogMode === 'edit' ? 'Salvar' : 'Adicionar módulo'"
                    :icon="moduleDialogMode === 'edit' ? 'pi pi-check' : 'pi pi-plus'"
                    :disabled="!moduleTitle.trim()"
                    @click="confirmSaveModule"
                />
            </template>
        </Dialog>

        <RoadmapItemFormDialog
            v-model:visible="dialogVisible"
            v-model:product-id="dialogProductId"
            v-model:title="dialogTitle"
            v-model:notes="dialogNotes"
            v-model:priority="dialogPriority"
            v-model:metrics="dialogMetrics"
            v-model:in-development="dialogInDevelopment"
            v-model:dev-status="dialogDevStatus"
            :mode="dialogMode"
            variant="matrix"
            :all-products="allProducts"
            :priority-options="ROADMAP_PRIORITIES"
            :metrics-grouped="metricsGrouped"
            :get-product-by-id="getProductById"
            :dev-board-path="devBoardPath"
            @save="confirmSave"
            @cancel="closeItemDialog"
            @send-to-backlog="sendToBacklog"
        />

        <Dialog
            v-model:visible="deleteConfirmVisible"
            modal
            append-to="body"
            header="Excluir item?"
            :style="{ width: 'min(400px, 94vw)' }"
            :draggable="false"
        >
            <p class="roadmap-delete-confirm">
                Tem certeza que deseja excluir
                <strong>{{ pendingDeleteFeature?.title }}</strong>?
                Esta ação não pode ser desfeita.
            </p>
            <template #footer>
                <Button label="Não, manter" severity="secondary" text @click="cancelRemove" />
                <Button label="Sim, excluir" severity="danger" icon="pi pi-trash" @click="confirmRemove" />
            </template>
        </Dialog>
        <Dialog
            v-model:visible="deleteModuleConfirmVisible"
            modal
            append-to="body"
            header="Excluir módulo?"
            :style="{ width: 'min(440px, 94vw)' }"
            :draggable="false"
        >
            <p class="roadmap-delete-confirm">
                Tem certeza que deseja excluir o módulo
                <strong>{{ pendingDeleteModule?.title }}</strong>?
                <template v-if="pendingDeleteModule && countAllByProduct(pendingDeleteModule.id) > 0">
                    Os <strong>{{ countAllByProduct(pendingDeleteModule.id) }}</strong>
                    {{ countAllByProduct(pendingDeleteModule.id) === 1 ? 'item associado será removido' : 'itens associados serão removidos' }}.
                </template>
                Esta ação não pode ser desfeita.
            </p>
            <template #footer>
                <Button label="Não, manter" severity="secondary" text @click="cancelRemoveModule" />
                <Button label="Sim, excluir módulo" severity="danger" icon="pi pi-trash" @click="confirmRemoveModule" />
            </template>
        </Dialog>
        </Teleport>
        </div>
    </VuePressLayout>
</template>
