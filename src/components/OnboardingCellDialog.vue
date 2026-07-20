<script setup>
import { computed, ref, watch } from 'vue';
import {
    ONBOARDING_MODES,
    ONBOARDING_OPERATIONS,
    ONBOARDING_STATUSES,
    getStatusMeta
} from '@/config/onboardingConfig';
import { useOnboardingBoard } from '@/composables/useOnboardingBoard';

const visible = defineModel('visible', { type: Boolean, default: false });

const props = defineProps({
    cardId: { type: String, default: '' },
    convenio: { type: Object, default: null },
    unit: { type: Object, default: null }
});

const { ensureCell } = useOnboardingBoard();

const cell = ref(null);
const showSenha = ref(false);

watch(
    () => [visible.value, props.cardId, props.convenio?.id, props.unit?.id],
    () => {
        if (visible.value && props.cardId && props.convenio && props.unit) {
            cell.value = ensureCell(props.cardId, props.convenio.id, props.unit.id);
            showSenha.value = false;
        }
    },
    { immediate: true }
);

const header = computed(() => {
    if (!props.convenio || !props.unit) return 'Célula';
    return `${props.convenio.name} · ${props.unit.name}`;
});

const operations = ONBOARDING_OPERATIONS;
const statuses = ONBOARDING_STATUSES;
const modes = ONBOARDING_MODES;

function toneClass(statusId) {
    return `onb-tone-${getStatusMeta(statusId).tone}`;
}

function setMode(modeId) {
    if (cell.value) cell.value.modo = modeId;
}

function setStatus(opId, statusId) {
    if (cell.value) cell.value.ops[opId].status = statusId;
}
</script>

<template>
    <Dialog
        v-model:visible="visible"
        modal
        append-to="body"
        class="onb-dialog onb-cell-dialog"
        :header="header"
        :style="{ width: 'min(560px, 96vw)' }"
        :draggable="false"
    >
        <template v-if="cell">
            <!-- Ativo / Inativo -->
            <div class="onb-field" style="flex-direction: row; align-items: center; gap: 12px">
                <ToggleSwitch v-model="cell.ativo" input-id="onb-cell-ativo" />
                <label for="onb-cell-ativo" style="margin: 0">
                    {{ cell.ativo ? 'Ativo neste convênio/unidade' : 'Inativo' }}
                </label>
            </div>

            <!-- Portal / Fora -->
            <div class="onb-section" style="margin-top: 16px">
                <p class="onb-section__title">Como é feito</p>
                <div class="onb-seg" role="group" aria-label="Portal ou fora">
                    <button
                        v-for="mode in modes"
                        :key="mode.id"
                        type="button"
                        class="onb-seg__btn"
                        :class="{ active: cell.modo === mode.id }"
                        @click="setMode(mode.id)"
                    >
                        <i :class="mode.icon" />
                        {{ mode.label }}
                    </button>
                </div>

                <div v-if="cell.modo === 'portal'" class="onb-field-row" style="margin-top: 12px">
                    <div class="onb-field">
                        <label>Login do portal</label>
                        <InputText v-model="cell.portalLogin" placeholder="usuário / matrícula" />
                    </div>
                    <div class="onb-field">
                        <label>Senha</label>
                        <div style="display: flex; gap: 6px">
                            <InputText
                                v-model="cell.portalSenha"
                                :type="showSenha ? 'text' : 'password'"
                                placeholder="••••••••"
                                style="flex: 1"
                            />
                            <Button
                                type="button"
                                severity="secondary"
                                text
                                :icon="showSenha ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                :title="showSenha ? 'Ocultar' : 'Mostrar'"
                                @click="showSenha = !showSenha"
                            />
                        </div>
                    </div>
                </div>

                <div v-else class="onb-field" style="margin-top: 12px">
                    <label>Detalhe — como é feito</label>
                    <Textarea
                        v-model="cell.detalhe"
                        rows="3"
                        auto-resize
                        placeholder="Ex.: envio por e-mail, planilha, integração, presencial..."
                    />
                </div>
            </div>

            <!-- Operações -->
            <div class="onb-section">
                <p class="onb-section__title">Operações</p>
                <div v-for="op in operations" :key="op.id" class="onb-op-block">
                    <div class="onb-op-block__head">
                        <span class="onb-op-block__title">{{ op.label }}</span>
                        <span class="onb-status-pill" :class="toneClass(cell.ops[op.id].status)">
                            <span class="onb-status-dot" />
                            {{ getStatusMeta(cell.ops[op.id].status).label }}
                        </span>
                    </div>

                    <div class="onb-seg" role="group" :aria-label="`Status de ${op.label}`">
                        <button
                            v-for="status in statuses"
                            :key="status.id"
                            type="button"
                            class="onb-seg__btn"
                            :class="[
                                `onb-tone-${status.tone}`,
                                { active: cell.ops[op.id].status === status.id }
                            ]"
                            @click="setStatus(op.id, status.id)"
                        >
                            <span class="onb-status-dot" :class="`onb-tone-${status.tone}`" />
                            {{ status.label }}
                        </button>
                    </div>

                    <div class="onb-field" style="margin-top: 10px">
                        <label>Descrição</label>
                        <Textarea
                            v-model="cell.ops[op.id].descricao"
                            rows="2"
                            auto-resize
                            placeholder="Observações, pendências, responsável..."
                        />
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <Button label="Fechar" icon="pi pi-check" @click="visible = false" />
        </template>
    </Dialog>
</template>
