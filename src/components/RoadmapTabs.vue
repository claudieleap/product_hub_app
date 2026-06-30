<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

function isActive(path) {
    if (path === '/roadmap') return route.path === '/roadmap';
    return route.path.startsWith(path);
}
</script>

<template>
    <nav class="roadmap-tabs" aria-label="Roadmap">
        <router-link to="/roadmap" class="roadmap-tabs__link" :class="{ active: isActive('/roadmap') && route.path === '/roadmap' }">
            <i class="pi pi-th-large" />
            Matriz
        </router-link>
        <router-link
            to="/roadmap/desenvolvimento"
            class="roadmap-tabs__link"
            :class="{ active: isActive('/roadmap/desenvolvimento') }"
        >
            <i class="pi pi-code" />
            Desenvolvimento
        </router-link>
    </nav>
</template>
