<script setup>
import { computed } from 'vue';
import { COMMERCIAL_STAGES } from '@/config/commercialConfig';
import '@/assets/commercial.css';

const LOST_STAGE_ID = 'levantada_mao';

const props = defineProps({
    modelValue: { type: String, default: '' },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const currentIndex = computed(() => COMMERCIAL_STAGES.findIndex((stage) => stage.id === props.modelValue));

function selectStage(stage) {
    if (props.loading || stage.id === props.modelValue) return;
    emit('update:modelValue', stage.id);
}
</script>

<template>
    <div class="com-stepper">
        <template v-for="(stage, index) in COMMERCIAL_STAGES" :key="stage.id">
            <div v-if="index > 0" class="com-stepper__connector" :class="{ 'com-stepper__connector--done': index <= currentIndex }" />
            <button
                type="button"
                class="com-stepper__step"
                :class="{
                    'com-stepper__step--done': index < currentIndex,
                    'com-stepper__step--current': index === currentIndex,
                    'com-stepper__step--lost': stage.id === LOST_STAGE_ID
                }"
                :disabled="loading"
                @click="selectStage(stage)"
            >
                <span class="com-stepper__node">
                    <i v-if="index < currentIndex" class="pi pi-check" />
                    <span v-else-if="index === currentIndex" class="com-stepper__dot" />
                </span>
                <span class="com-stepper__label">{{ stage.title }}</span>
            </button>
        </template>
    </div>
</template>
