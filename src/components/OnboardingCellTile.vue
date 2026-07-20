<script setup>
import { computed } from 'vue';
import { ONBOARDING_OPERATIONS, getStatusMeta } from '@/config/onboardingConfig';
import { isCellAllDone } from '@/composables/useOnboardingBoard';

const props = defineProps({
    cell: { type: Object, required: true }
});

const operations = ONBOARDING_OPERATIONS;

const allDone = computed(() => isCellAllDone(props.cell));
const conciliado = computed(() => Boolean(props.cell.conciliado) && allDone.value);
const pronto = computed(() => allDone.value && !conciliado.value);

function tone(statusId) {
    return getStatusMeta(statusId).tone;
}

function statusLabel(statusId) {
    return getStatusMeta(statusId).label;
}
</script>

<template>
    <button
        type="button"
        class="onb-cell"
        :class="[
            cell.ativo ? 'onb-cell--ativo' : 'onb-cell--inativo',
            { 'onb-cell--pronto': pronto, 'onb-cell--conciliado': conciliado }
        ]"
    >
        <div v-if="conciliado" class="onb-cell__ribbon onb-cell__ribbon--conciliado">
            <i class="pi pi-check-circle" /> Conciliado
        </div>
        <div v-else-if="pronto" class="onb-cell__ribbon onb-cell__ribbon--pronto">
            <i class="pi pi-verified" /> Pronto pra conciliar
        </div>

        <div class="onb-cell__row">
            <span
                class="onb-cell__ativo"
                :class="cell.ativo ? 'onb-cell__ativo--on' : 'onb-cell__ativo--off'"
            >
                <span class="onb-status-dot" />
                {{ cell.ativo ? 'Ativo' : 'Inativo' }}
            </span>
            <span
                class="onb-cell__mode"
                :class="cell.modo === 'portal' ? 'onb-cell__mode--portal' : 'onb-cell__mode--fora'"
            >
                {{ cell.modo === 'portal' ? 'Portal' : 'Fora' }}
            </span>
        </div>
        <div class="onb-cell__ops">
            <span
                v-for="op in operations"
                :key="op.id"
                class="onb-op-chip"
                :class="`onb-op-chip--${tone(cell.ops[op.id].status)}`"
                :title="`${op.label}: ${statusLabel(cell.ops[op.id].status)}`"
            >
                <span class="onb-status-dot" />
                {{ op.short }}
            </span>
        </div>
    </button>
</template>
