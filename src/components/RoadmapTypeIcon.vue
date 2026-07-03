<script setup>
import GuavaIcon from '@/components/icons/GuavaIcon.vue';

defineProps({
    icon: {
        type: String,
        required: true
    }
});
</script>

<template>
    <span class="roadmap-type-icon">
        <GuavaIcon v-if="icon === 'guava'" />
        <i v-else :class="icon" aria-hidden="true" />
    </span>
</template>

<style scoped>
.roadmap-type-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    font-size: inherit;
}
</style>
