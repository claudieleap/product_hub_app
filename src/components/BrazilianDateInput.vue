<script setup>
import { computed } from 'vue';
import { dateToIsoKey, isoKeyToDate } from '@/utils/brazilianDate';

defineProps({
    placeholder: {
        type: String,
        default: 'dd/mm/aaaa'
    },
    id: {
        type: String,
        default: undefined
    }
});

/** Valor interno: chave ISO aaaa-mm-dd ou string vazia. */
const model = defineModel({ type: String, default: '' });

const pickerValue = computed({
    get: () => isoKeyToDate(model.value),
    set: (date) => {
        model.value = date ? dateToIsoKey(date) : '';
    }
});
</script>

<template>
    <DatePicker
        :input-id="id"
        v-model="pickerValue"
        date-format="dd/mm/yy"
        show-icon
        icon-display="input"
        :placeholder="placeholder"
        append-to="body"
        class="brazilian-date-picker"
    />
</template>
