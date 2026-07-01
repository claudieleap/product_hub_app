<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import {
    ROADMAP_TYPES,
    getRoadmapTypeMeta,
    parseRoadmapType,
    roadmapDevPath,
    roadmapMatrixPath
} from '@/config/roadmapTypes';

const route = useRoute();
const roadmapType = computed(() => parseRoadmapType(route.params.type));
const typeMeta = computed(() => getRoadmapTypeMeta(roadmapType.value));

function isMatrixActive() {
    return route.path === roadmapMatrixPath(roadmapType.value);
}

function isDevActive() {
    return route.path === roadmapDevPath(roadmapType.value);
}
</script>

<template>
    <div class="roadmap-tabs-stack">
        <nav class="roadmap-tabs roadmap-tabs--types" aria-label="Tipo de roadmap">
            <router-link
                v-for="type in ROADMAP_TYPES"
                :key="type.id"
                :to="roadmapMatrixPath(type.id)"
                class="roadmap-tabs__link"
                :class="{ active: roadmapType === type.id }"
            >
                <i :class="type.icon" />
                {{ type.label }}
            </router-link>
        </nav>

        <nav class="roadmap-tabs" :aria-label="`Visualização · ${typeMeta.label}`">
            <router-link
                :to="roadmapMatrixPath(roadmapType)"
                class="roadmap-tabs__link"
                :class="{ active: isMatrixActive() }"
            >
                <i class="pi pi-th-large" />
                Matriz
            </router-link>
            <router-link
                :to="roadmapDevPath(roadmapType)"
                class="roadmap-tabs__link"
                :class="{ active: isDevActive() }"
            >
                <i class="pi pi-code" />
                Desenvolvimento
            </router-link>
        </nav>
    </div>
</template>
