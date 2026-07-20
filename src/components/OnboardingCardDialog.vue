<script setup>
import { computed, ref } from 'vue';
import {
    ONBOARDING_KINDS,
    ONBOARDING_OPERATIONS,
    getStatusMeta
} from '@/config/onboardingConfig';
import { useOnboardingBoard } from '@/composables/useOnboardingBoard';
import OnboardingCellDialog from '@/components/OnboardingCellDialog.vue';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    cardId: { type: String, default: '' }
});

const emit = defineEmits(['deleted']);

const {
    getCard,
    updateCard,
    removeCard,
    addUnit,
    removeUnit,
    addConvenio,
    removeConvenio,
    readCell,
    cardProgress
} = useOnboardingBoard();

const card = computed(() => getCard(props.cardId));
const operations = ONBOARDING_OPERATIONS;
const kinds = ONBOARDING_KINDS;

const cellDialogVisible = ref(false);
const activeConvenio = ref(null);
const activeUnit = ref(null);

const hasMatrix = computed(() => (card.value?.units.length ?? 0) > 0 && (card.value?.convenios.length ?? 0) > 0);

const gridStyle = computed(() => {
    const cols = card.value?.units.length ?? 0;
    return {
        gridTemplateColumns: `minmax(150px, 210px) repeat(${cols}, minmax(168px, 1fr))`
    };
});

const progress = computed(() => (card.value ? cardProgress(card.value) : { pct: 0, done: 0, total: 0 }));

function statusTone(statusId) {
    return getStatusMeta(statusId).tone;
}

function setKind(kindId) {
    if (card.value) updateCard(card.value.id, { kind: kindId });
}

function openCell(convenio, unit) {
    activeConvenio.value = convenio;
    activeUnit.value = unit;
    cellDialogVisible.value = true;
}

function confirmDelete() {
    if (!card.value) return;
    if (!window.confirm(`Excluir a clínica "${card.value.name}"? Essa ação não pode ser desfeita.`)) return;
    const id = card.value.id;
    removeCard(id);
    visible.value = false;
    emit('deleted', id);
}
</script>

<template>
    <Dialog
        v-model:visible="visible"
        modal
        append-to="body"
        class="onb-dialog onb-card-dialog"
        :header="card?.name ?? 'Clínica'"
        :style="{ width: 'min(1040px, 96vw)' }"
        :content-style="{ maxHeight: '74vh' }"
        :draggable="false"
    >
        <template v-if="card">
            <!-- Configuração do estabelecimento -->
            <div class="onb-section">
                <p class="onb-section__title">Estabelecimento</p>
                <div class="onb-field-row">
                    <div class="onb-field">
                        <label>Nome</label>
                        <InputText v-model="card.name" placeholder="Nome da clínica ou hospital" />
                    </div>
                    <div class="onb-field" style="flex: 0 0 auto">
                        <label>Tipo</label>
                        <div class="onb-seg">
                            <button
                                v-for="kind in kinds"
                                :key="kind.id"
                                type="button"
                                class="onb-seg__btn"
                                :class="{ active: card.kind === kind.id }"
                                @click="setKind(kind.id)"
                            >
                                <i :class="kind.icon" />
                                {{ kind.label }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Unidades -->
            <div class="onb-section">
                <p class="onb-section__title">Unidades</p>
                <div class="onb-chips">
                    <div v-for="unit in card.units" :key="unit.id" class="onb-chip">
                        <input v-model="unit.name" :aria-label="`Nome da ${unit.name}`" />
                        <button
                            type="button"
                            class="onb-chip__remove"
                            title="Remover unidade"
                            @click="removeUnit(card.id, unit.id)"
                        >
                            <i class="pi pi-times" />
                        </button>
                    </div>
                    <button type="button" class="onb-chip-add" @click="addUnit(card.id)">
                        <i class="pi pi-plus" /> Unidade
                    </button>
                </div>
            </div>

            <!-- Convênios -->
            <div class="onb-section">
                <p class="onb-section__title">Convênios</p>
                <div class="onb-chips">
                    <div v-for="convenio in card.convenios" :key="convenio.id" class="onb-chip">
                        <input v-model="convenio.name" :aria-label="`Nome do ${convenio.name}`" />
                        <button
                            type="button"
                            class="onb-chip__remove"
                            title="Remover convênio"
                            @click="removeConvenio(card.id, convenio.id)"
                        >
                            <i class="pi pi-times" />
                        </button>
                    </div>
                    <button type="button" class="onb-chip-add" @click="addConvenio(card.id)">
                        <i class="pi pi-plus" /> Convênio
                    </button>
                </div>
            </div>

            <!-- Matriz Convênios × Unidades -->
            <div class="onb-section">
                <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px">
                    <p class="onb-section__title" style="margin: 0">Matriz de implantação</p>
                    <span class="onb-progress-label" style="text-align: left">{{ progress.pct }}% concluído</span>
                </div>

                <div v-if="hasMatrix" class="onb-matrix-wrap">
                    <div class="onb-matrix" :style="gridStyle">
                        <!-- Cabeçalho -->
                        <div class="onb-matrix__corner">Convênio ↓ · Unidade →</div>
                        <div
                            v-for="unit in card.units"
                            :key="`h-${unit.id}`"
                            class="onb-matrix__col-head"
                        >
                            {{ unit.name }}
                        </div>

                        <!-- Linhas -->
                        <template v-for="convenio in card.convenios" :key="convenio.id">
                            <div class="onb-matrix__row-head">{{ convenio.name }}</div>
                            <div
                                v-for="unit in card.units"
                                :key="`${convenio.id}-${unit.id}`"
                                class="onb-matrix__cell"
                            >
                                <button
                                    type="button"
                                    class="onb-cell"
                                    :class="{ 'onb-cell--inativo': !readCell(card, convenio.id, unit.id).ativo }"
                                    @click="openCell(convenio, unit)"
                                >
                                    <div class="onb-cell__row">
                                        <span class="onb-cell__ativo">
                                            <span
                                                class="onb-status-dot"
                                                :class="readCell(card, convenio.id, unit.id).ativo ? 'onb-tone-green' : ''"
                                                :style="readCell(card, convenio.id, unit.id).ativo ? '' : 'background: var(--hub-line)'"
                                            />
                                            {{ readCell(card, convenio.id, unit.id).ativo ? 'Ativo' : 'Inativo' }}
                                        </span>
                                        <span
                                            class="onb-cell__mode"
                                            :class="{ 'onb-cell__mode--portal': readCell(card, convenio.id, unit.id).modo === 'portal' }"
                                        >
                                            {{ readCell(card, convenio.id, unit.id).modo === 'portal' ? 'Portal' : 'Fora' }}
                                        </span>
                                    </div>
                                    <div class="onb-cell__ops">
                                        <span
                                            v-for="op in operations"
                                            :key="op.id"
                                            class="onb-op-chip"
                                            :title="`${op.label}: ${getStatusMeta(readCell(card, convenio.id, unit.id).ops[op.id].status).label}`"
                                        >
                                            <span
                                                class="onb-status-dot"
                                                :class="`onb-tone-${statusTone(readCell(card, convenio.id, unit.id).ops[op.id].status)}`"
                                            />
                                            {{ op.short }}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </template>
                    </div>
                </div>

                <div v-else class="onb-matrix-wrap">
                    <p class="onb-matrix__empty">
                        Adicione pelo menos uma unidade e um convênio para montar a matriz.
                    </p>
                </div>
            </div>

            <OnboardingCellDialog
                v-model:visible="cellDialogVisible"
                :card-id="card.id"
                :convenio="activeConvenio"
                :unit="activeUnit"
            />
        </template>

        <template #footer>
            <Button
                label="Excluir"
                severity="danger"
                text
                icon="pi pi-trash"
                @click="confirmDelete"
            />
            <Button label="Fechar" icon="pi pi-check" @click="visible = false" />
        </template>
    </Dialog>
</template>
