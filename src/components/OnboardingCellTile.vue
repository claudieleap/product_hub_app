<script setup>
import { ONBOARDING_OPERATIONS, getStatusMeta } from '@/config/onboardingConfig';

defineProps({
    cell: { type: Object, required: true }
});

const operations = ONBOARDING_OPERATIONS;

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
        :class="cell.ativo ? 'onb-cell--ativo' : 'onb-cell--inativo'"
    >
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
