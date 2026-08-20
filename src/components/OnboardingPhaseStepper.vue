<script setup>
import { computed } from 'vue';
import '@/assets/commercial.css';

const props = defineProps({
    phases: { type: Array, default: () => [] },
    modelValue: { type: String, default: '' },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const currentIndex = computed(() => props.phases.findIndex((phase) => phase.id === props.modelValue));

function selectPhase(phase) {
    if (props.loading || phase.id === props.modelValue) return;
    emit('update:modelValue', phase.id);
}
</script>

<template>
    <div class="com-stepper">
        <template v-for="(phase, index) in phases" :key="phase.id">
            <div v-if="index > 0" class="com-stepper__connector" :class="{ 'com-stepper__connector--done': index <= currentIndex }" />
            <button
                type="button"
                class="com-stepper__step"
                :class="{
                    'com-stepper__step--done': index < currentIndex,
                    'com-stepper__step--current': index === currentIndex
                }"
                :disabled="loading"
                @click="selectPhase(phase)"
            >
                <span class="com-stepper__node">
                    <i v-if="index < currentIndex" class="pi pi-check" />
                    <span v-else-if="index === currentIndex" class="com-stepper__dot" />
                </span>
                <span class="com-stepper__label">{{ phase.title }}</span>
            </button>
        </template>
    </div>
</template>
