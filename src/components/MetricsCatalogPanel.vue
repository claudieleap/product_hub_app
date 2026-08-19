<script setup>
import { computed, ref } from 'vue';
import { useRoadmapMetrics } from '@/composables/useRoadmapMetrics';
import { useMetricsDashboard } from '@/composables/useMetricsDashboard';
import { isMetricsApiEnabled } from '@/api/metricsClient';

const {
    groups,
    ready,
    loading,
    error,
    addGroup,
    editGroup,
    removeGroup,
    addMetric,
    editMetric,
    removeMetric
} = useRoadmapMetrics();

const { metricUsage, allReady: dashboardReady } = useMetricsDashboard();

const apiEnabled = isMetricsApiEnabled();
const actionError = ref('');

const groupDialogVisible = ref(false);
const groupDialogMode = ref('add');
const editingGroupId = ref(null);
const groupLabel = ref('');

const metricDialogVisible = ref(false);
const metricDialogMode = ref('add');
const editingMetricId = ref(null);
const metricGroupId = ref('');
const metricLabel = ref('');

const deleteDialogVisible = ref(false);
const deleteTarget = ref(null);

const catalogReady = computed(() => ready.value && dashboardReady.value);

const totalMetrics = computed(() =>
    groups.value.reduce((sum, group) => sum + group.metrics.length, 0)
);

function metricItemCount(metricId) {
    return metricUsage.value.get(metricId)?.total ?? 0;
}

function openAddGroupDialog() {
    groupDialogMode.value = 'add';
    editingGroupId.value = null;
    groupLabel.value = '';
    actionError.value = '';
    groupDialogVisible.value = true;
}

function openEditGroupDialog(group) {
    groupDialogMode.value = 'edit';
    editingGroupId.value = group.id;
    groupLabel.value = group.label;
    actionError.value = '';
    groupDialogVisible.value = true;
}

function openAddMetricDialog(group) {
    metricDialogMode.value = 'add';
    editingMetricId.value = null;
    metricGroupId.value = group.id;
    metricLabel.value = '';
    actionError.value = '';
    metricDialogVisible.value = true;
}

function openEditMetricDialog(group, metric) {
    metricDialogMode.value = 'edit';
    editingMetricId.value = metric.id;
    metricGroupId.value = group.id;
    metricLabel.value = metric.label;
    actionError.value = '';
    metricDialogVisible.value = true;
}

function requestDeleteGroup(group) {
    deleteTarget.value = { type: 'group', group };
    deleteDialogVisible.value = true;
}

function requestDeleteMetric(group, metric) {
    deleteTarget.value = { type: 'metric', group, metric };
    deleteDialogVisible.value = true;
}

const deleteDialogTitle = computed(() => {
    if (!deleteTarget.value) return 'Confirmar exclusão';
    return deleteTarget.value.type === 'group' ? 'Excluir grupo' : 'Excluir métrica';
});

const deleteDialogMessage = computed(() => {
    if (!deleteTarget.value) return '';

    if (deleteTarget.value.type === 'group') {
        const count = deleteTarget.value.group.metrics.length;
        return `Excluir o grupo "${deleteTarget.value.group.label}" e suas ${count} métrica(s)? Itens do roadmap que usam essas métricas podem ficar sem rótulo visível.`;
    }

    return `Excluir a métrica "${deleteTarget.value.metric.label}"?`;
});

async function confirmSaveGroup() {
    const label = groupLabel.value.trim();
    if (!label) return;

    actionError.value = '';

    try {
        if (groupDialogMode.value === 'add') {
            await addGroup(label);
        } else {
            await editGroup(editingGroupId.value, label);
        }

        groupDialogVisible.value = false;
    } catch (err) {
        actionError.value = err?.message || 'Não foi possível salvar o grupo.';
    }
}

async function confirmSaveMetric() {
    const label = metricLabel.value.trim();
    if (!label || !metricGroupId.value) return;

    actionError.value = '';

    try {
        if (metricDialogMode.value === 'add') {
            await addMetric(metricGroupId.value, label);
        } else {
            await editMetric(editingMetricId.value, { label, groupId: metricGroupId.value });
        }

        metricDialogVisible.value = false;
    } catch (err) {
        actionError.value = err?.message || 'Não foi possível salvar a métrica.';
    }
}

async function confirmDelete() {
    if (!deleteTarget.value) return;

    actionError.value = '';

    try {
        if (deleteTarget.value.type === 'group') {
            await removeGroup(deleteTarget.value.group.id);
        } else {
            await removeMetric(deleteTarget.value.metric.id);
        }

        deleteDialogVisible.value = false;
        deleteTarget.value = null;
    } catch (err) {
        actionError.value = err?.message || 'Não foi possível excluir.';
    }
}
</script>

<template>
    <section class="metrics-catalog" aria-label="Catálogo de métricas">
        <div class="metrics-catalog__toolbar">
            <p class="metrics-catalog__summary">
                {{ groups.length }} grupo(s) · {{ totalMetrics }} métrica(s)
            </p>
            <Button
                label="Novo grupo"
                icon="pi pi-plus"
                size="small"
                :disabled="!apiEnabled || loading"
                @click="openAddGroupDialog"
            />
        </div>

        <Message v-if="!apiEnabled" severity="warn" :closable="false" class="metrics-catalog__banner">
            Configure <code>VITE_API_BASE_URL</code> para editar o catálogo. Sem API, os dados padrão são exibidos
            somente leitura.
        </Message>

        <Message v-else-if="error" severity="error" :closable="false" class="metrics-catalog__banner">
            {{ error }}
        </Message>

        <Message v-if="actionError" severity="error" :closable="false" class="metrics-catalog__banner">
            {{ actionError }}
        </Message>

        <div v-if="!catalogReady || loading" class="metrics-catalog__loading">Carregando catálogo…</div>

        <div v-else class="metrics-catalog__groups">
            <section v-for="group in groups" :key="group.id" class="metrics-catalog__group">
                <div class="metrics-catalog__group-head">
                    <div>
                        <h2>{{ group.label }}</h2>
                        <p>{{ group.metrics.length }} métrica(s)</p>
                    </div>
                    <div class="metrics-catalog__group-actions">
                        <Button
                            icon="pi pi-plus"
                            label="Métrica"
                            size="small"
                            severity="secondary"
                            outlined
                            :disabled="!apiEnabled"
                            @click="openAddMetricDialog(group)"
                        />
                        <Button
                            icon="pi pi-pencil"
                            size="small"
                            severity="secondary"
                            text
                            :disabled="!apiEnabled"
                            @click="openEditGroupDialog(group)"
                        />
                        <Button
                            icon="pi pi-trash"
                            size="small"
                            severity="danger"
                            text
                            :disabled="!apiEnabled"
                            @click="requestDeleteGroup(group)"
                        />
                    </div>
                </div>

                <ul v-if="group.metrics.length" class="metrics-catalog__metric-list">
                    <li v-for="metric in group.metrics" :key="metric.id" class="metrics-catalog__metric">
                        <span class="metrics-catalog__metric-label">{{ metric.label }}</span>
                        <span
                            class="metrics-catalog__metric-count"
                            :class="{ 'metrics-catalog__metric-count--empty': !metricItemCount(metric.id) }"
                            :title="`${metricItemCount(metric.id)} item(ns) associado(s)`"
                        >
                            {{ metricItemCount(metric.id) }}
                        </span>
                        <div class="metrics-catalog__metric-actions">
                            <Button
                                icon="pi pi-pencil"
                                size="small"
                                severity="secondary"
                                text
                                :disabled="!apiEnabled"
                                @click="openEditMetricDialog(group, metric)"
                            />
                            <Button
                                icon="pi pi-trash"
                                size="small"
                                severity="danger"
                                text
                                :disabled="!apiEnabled"
                                @click="requestDeleteMetric(group, metric)"
                            />
                        </div>
                    </li>
                </ul>

                <p v-else class="metrics-catalog__empty">Nenhuma métrica neste grupo.</p>
            </section>
        </div>

        <Dialog
            v-model:visible="groupDialogVisible"
            modal
            :header="groupDialogMode === 'add' ? 'Novo grupo' : 'Editar grupo'"
            :style="{ width: 'min(480px, 94vw)' }"
        >
            <div class="metrics-catalog__field">
                <label for="group-label">Nome do grupo</label>
                <InputText
                    id="group-label"
                    v-model="groupLabel"
                    class="w-full"
                    placeholder="Ex.: Experiência do usuário"
                    @keyup.enter="confirmSaveGroup"
                />
            </div>
            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="groupDialogVisible = false" />
                <Button
                    :label="groupDialogMode === 'add' ? 'Criar' : 'Salvar'"
                    icon="pi pi-check"
                    :disabled="!groupLabel.trim()"
                    @click="confirmSaveGroup"
                />
            </template>
        </Dialog>

        <Dialog
            v-model:visible="metricDialogVisible"
            modal
            :header="metricDialogMode === 'add' ? 'Nova métrica' : 'Editar métrica'"
            :style="{ width: 'min(520px, 94vw)' }"
        >
            <div class="metrics-catalog__field">
                <label for="metric-group">Grupo</label>
                <Select
                    id="metric-group"
                    v-model="metricGroupId"
                    :options="groups"
                    option-label="label"
                    option-value="id"
                    class="w-full"
                />
            </div>
            <div class="metrics-catalog__field">
                <label for="metric-label">Nome da métrica</label>
                <InputText
                    id="metric-label"
                    v-model="metricLabel"
                    class="w-full"
                    placeholder="Ex.: Taxa de conversão do trial"
                    @keyup.enter="confirmSaveMetric"
                />
            </div>
            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="metricDialogVisible = false" />
                <Button
                    :label="metricDialogMode === 'add' ? 'Criar' : 'Salvar'"
                    icon="pi pi-check"
                    :disabled="!metricLabel.trim() || !metricGroupId"
                    @click="confirmSaveMetric"
                />
            </template>
        </Dialog>

        <Dialog
            v-model:visible="deleteDialogVisible"
            modal
            :header="deleteDialogTitle"
            :style="{ width: 'min(520px, 94vw)' }"
        >
            <p class="metrics-catalog__delete-msg">{{ deleteDialogMessage }}</p>
            <template #footer>
                <Button label="Cancelar" severity="secondary" text @click="deleteDialogVisible = false" />
                <Button label="Excluir" icon="pi pi-trash" severity="danger" @click="confirmDelete" />
            </template>
        </Dialog>
    </section>
</template>

<style scoped>
.metrics-catalog__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.metrics-catalog__summary {
    margin: 0;
    font-size: 0.875rem;
    color: var(--hub-muted);
}

.metrics-catalog__banner {
    margin-bottom: 1rem;
}

.metrics-catalog__loading {
    color: var(--hub-muted);
}

.metrics-catalog__groups {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.metrics-catalog__group {
    border: 1px solid var(--hub-line);
    border-radius: 14px;
    padding: 1rem 1.1rem;
    background: var(--hub-surface);
}

.metrics-catalog__group-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.metrics-catalog__group-head h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--hub-ink);
}

.metrics-catalog__group-head p {
    margin: 0.2rem 0 0;
    font-size: 0.8rem;
    color: var(--hub-muted);
}

.metrics-catalog__group-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.metrics-catalog__metric-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.metrics-catalog__metric {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.65rem;
    border-radius: 0.5rem;
    background: var(--hub-bg);
}

.metrics-catalog__metric-label {
    flex: 1;
    font-size: 0.9rem;
    color: var(--hub-ink-soft);
}

.metrics-catalog__metric-count {
    flex-shrink: 0;
    min-width: 1.75rem;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    background: var(--hub-blue-wash);
    color: var(--hub-blue);
    font-size: 0.8rem;
    font-weight: 700;
    text-align: center;
    font-variant-numeric: tabular-nums;
}

.metrics-catalog__metric-count--empty {
    background: #f1f5f9;
    color: var(--hub-muted);
}

.metrics-catalog__metric-actions {
    display: flex;
    gap: 0.15rem;
}

.metrics-catalog__empty {
    margin: 0;
    font-size: 0.875rem;
    color: var(--hub-muted);
    font-style: italic;
}

.metrics-catalog__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.85rem;
}

.metrics-catalog__field label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--hub-ink-soft);
}

.metrics-catalog__delete-msg {
    margin: 0;
    line-height: 1.5;
    color: var(--hub-ink-soft);
}
</style>
