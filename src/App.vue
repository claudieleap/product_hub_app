<script setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

watch(
    () => route.meta.title,
    (title) => {
        document.title = title ? `${title} · Product Hub` : 'Product Hub · Aleevia';
    },
    { immediate: true }
);
</script>

<template>
    <router-view />
</template>
