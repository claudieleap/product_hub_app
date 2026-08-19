<script setup>
import { computed } from 'vue';
import { ROADMAP_DEV_STATUSES } from '@/data/roadmapDevStatus';

const visible = defineModel('visible', { type: Boolean, default: false });
const productId = defineModel('productId', { type: String, default: '' });
const title = defineModel('title', { type: String, default: '' });
const notes = defineModel('notes', { type: String, default: '' });
const priority = defineModel('priority', { type: String, default: 'media' });
const metrics = defineModel('metrics', { type: Array, default: () => [] });
const inDevelopment = defineModel('inDevelopment', { type: Boolean, default: false });
const devStatus = defineModel('devStatus', { type: String, default: 'a_fazer' });

const props = defineProps({
    mode: {
        type: String,
        required: true,
        validator: (value) => ['add', 'edit'].includes(value)
    },
    variant: {
        type: String,
        required: true,
        validator: (value) => ['matrix', 'backlog'].includes(value)
    },
    allProducts: {
        type: Array,
        default: () => []
    },
    priorityOptions: {
        type: Array,
        default: () => []
    },
    metricsGrouped: {
        type: Array,
        default: () => []
    },
    getProductById: {
        type: Function,
        required: true
    },
    devBoardPath: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['save', 'cancel', 'send-to-backlog']);

const dialogHeader = computed(() => {
    if (props.mode === 'edit') return 'Editar item';
    return props.variant === 'backlog' ? 'Novo item no backlog' : 'Novo item';
});

const priorityLabel = computed(() =>
    props.variant === 'backlog' ? 'Prioridade no backlog' : 'Prioridade'
);

const saveDisabled = computed(() => !title.value.trim() || !productId.value);

const fieldIdPrefix = computed(() => (props.variant === 'backlog' ? 'backlog-item' : 'matrix-item'));

function onCancel() {
    visible.value = false;
    emit('cancel');
}

function onSave() {
    if (saveDisabled.value) return;
    emit('save');
}
</script>

<template>
    <Dialog
        v-model:visible="visible"
        modal
        append-to="body"
        class="roadmap-form-dialog roadmap-item-dialog"
        :header="dialogHeader"
        :style="{ width: 'min(760px, 96vw)' }"
        :draggable="false"
    >
        <div class="roadmap-dialog-field">
            <label :for="`${fieldIdPrefix}-module`">Módulo</label>
            <Select
                :id="`${fieldIdPrefix}-module`"
                v-model="productId"
                :options="allProducts"
                option-label="title"
                option-value="id"
                class="w-full roadmap-product-select"
            >
                <template #value="{ value }">
                    <span v-if="value" class="roadmap-product-select__value">
                        <span
                            class="roadmap-col-header__icon roadmap-product-select__icon"
                            :style="{ background: getProductById(value)?.accent }"
                        >
                            <i :class="getProductById(value)?.icon" />
                        </span>
                        {{ getProductById(value)?.title }}
                    </span>
                </template>
                <template #option="{ option }">
                    <span class="roadmap-module-option">
                        <span class="roadmap-col-header__icon" :style="{ background: option.accent }">
                            <i :class="option.icon" />
                        </span>
                        {{ option.title }}
                    </span>
                </template>
            </Select>
            <small v-if="variant === 'matrix' && mode === 'edit'" class="roadmap-dialog-hint">
                Ao mudar o módulo, o item move para a linha correspondente na matriz.
            </small>
        </div>

        <div class="roadmap-dialog-field">
            <label :for="`${fieldIdPrefix}-title`">Título</label>
            <InputText
                :id="`${fieldIdPrefix}-title`"
                v-model="title"
                class="w-full"
                placeholder="Ex.: Importação XML TISS em lote"
                @keyup.enter="onSave"
            />
        </div>

        <div class="roadmap-dialog-field">
            <label :for="`${fieldIdPrefix}-notes`">Observações (opcional)</label>
            <Textarea
                :id="`${fieldIdPrefix}-notes`"
                v-model="notes"
                class="w-full"
                rows="4"
                placeholder="Contexto, dependência ou critério de aceite..."
            />
        </div>

        <div class="roadmap-dialog-field">
            <label :for="`${fieldIdPrefix}-priority`">{{ priorityLabel }}</label>
            <Select
                :id="`${fieldIdPrefix}-priority`"
                v-model="priority"
                :options="priorityOptions"
                option-label="label"
                option-value="id"
                class="w-full"
            >
                <template #value="{ value }">
                    <span
                        v-if="value"
                        class="roadmap-priority-pill"
                        :class="priorityOptions.find((entry) => entry.id === value)?.rowClass"
                    >
                        {{ priorityOptions.find((entry) => entry.id === value)?.label }}
                    </span>
                </template>
                <template #option="{ option }">
                    <span class="roadmap-priority-pill" :class="option.rowClass">{{ option.label }}</span>
                </template>
            </Select>
            <small v-if="variant === 'matrix' && mode === 'edit'" class="roadmap-dialog-hint">
                Ao mudar a prioridade, o item move automaticamente para a coluna correspondente.
            </small>
        </div>

        <div class="roadmap-dialog-field">
            <label :for="`${fieldIdPrefix}-metrics`">Métricas (opcional)</label>
            <MultiSelect
                :id="`${fieldIdPrefix}-metrics`"
                v-model="metrics"
                :options="metricsGrouped"
                option-label="label"
                option-value="id"
                option-group-label="label"
                option-group-children="items"
                filter
                display="chip"
                append-to="body"
                scroll-height="22rem"
                panel-class="roadmap-metrics-panel"
                :panel-style="{ minWidth: 'min(720px, 92vw)' }"
                class="w-full roadmap-metrics-select"
                placeholder="Selecione métricas de sucesso"
            />
            <small class="roadmap-dialog-hint">
                Métricas de produto e negócio — adoção, conciliação, glosas, antecipação e retenção.
            </small>
        </div>

        <div v-if="variant === 'matrix'" class="roadmap-dialog-field">
            <label>Desenvolvimento</label>
            <div class="roadmap-dialog-check">
                <Checkbox v-model="inDevelopment" binary :input-id="`${fieldIdPrefix}-in-dev`" />
                <label :for="`${fieldIdPrefix}-in-dev`">Enviar para o board de desenvolvimento</label>
            </div>
            <Select
                v-if="inDevelopment"
                v-model="devStatus"
                :options="ROADMAP_DEV_STATUSES"
                option-label="label"
                option-value="id"
                class="w-full"
            >
                <template #value="{ value }">
                    <span
                        v-if="value"
                        class="roadmap-dev-pill"
                        :class="ROADMAP_DEV_STATUSES.find((status) => status.id === value)?.rowClass"
                    >
                        {{ ROADMAP_DEV_STATUSES.find((status) => status.id === value)?.label }}
                    </span>
                </template>
                <template #option="{ option }">
                    <span class="roadmap-dev-pill" :class="option.rowClass">{{ option.label }}</span>
                </template>
            </Select>
            <small v-if="inDevelopment && devBoardPath" class="roadmap-dialog-hint">
                Visível na aba <router-link :to="devBoardPath">Desenvolvimento</router-link> para acompanhamento do
                CEO.
            </small>
        </div>

        <template #footer>
            <Button
                v-if="variant === 'matrix' && mode === 'edit'"
                label="Enviar para backlog"
                severity="secondary"
                icon="pi pi-inbox"
                text
                class="roadmap-dialog-backlog-btn"
                @click="emit('send-to-backlog')"
            />
            <Button label="Cancelar" severity="secondary" text @click="onCancel" />
            <Button
                :label="mode === 'edit' ? 'Salvar' : 'Adicionar'"
                :icon="mode === 'edit' ? 'pi pi-check' : 'pi pi-plus'"
                :disabled="saveDisabled"
                @click="onSave"
            />
        </template>
    </Dialog>
</template>
